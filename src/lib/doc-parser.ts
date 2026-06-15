/**
 * 统一文档解析模块
 *
 * 支持 .txt, .md, .pdf, .docx, .xlsx 五种格式
 */

import * as mammoth from 'mammoth'
import * as ExcelJS from 'exceljs'

// 注意：pdfjs-dist 依赖浏览器的 DOMMatrix 等全局对象，Node 20 不内置，
// 因此不在顶层静态 import（否则加载本模块即崩溃，连 txt/docx 都解析不了），
// 改为在 parsePDF 内动态 import，并按需注入 polyfill。

// 支持的文件扩展名
export const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx', '.xlsx'] as const
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number]

/**
 * 解析文档为纯文本
 * @param file - 要解析的文件
 * @returns 解析后的文本内容
 */
export async function parseDocument(file: File): Promise<string> {
  const ext = getFileExtension(file.name) as SupportedExtension

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`不支持的文件格式: ${ext}，支持的格式: ${SUPPORTED_EXTENSIONS.join(', ')}`)
  }

  switch (ext) {
    case '.txt':
    case '.md':
      return await parseText(file)
    case '.pdf':
      return await parsePDF(file)
    case '.docx':
      return await parseDocx(file)
    case '.xlsx':
      return await parseXlsx(file)
    default:
      throw new Error(`不支持的文件格式: ${ext}`)
  }
}

/**
 * 获取文件扩展名
 */
function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx).toLowerCase() : ''
}

/**
 * 解析文本文件 (.txt, .md)
 */
async function parseText(file: File): Promise<string> {
  try {
    return await file.text()
  } catch (error) {
    throw new Error(`文本解析失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 按需注入 pdfjs 在 Node 环境缺失的浏览器全局对象（DOMMatrix）。
 * Node 22+ 已内置，仅在缺失时注入，避免覆盖原生实现。
 * 用纯 JS 实现而非 @napi-rs/canvas：后者是平台相关原生模块，
 * 在「Windows 构建 / Linux 运行」的部署模式下二进制不匹配会加载失败。
 * pdfjs 文本提取只用到矩阵乘法与坐标变换，纯 JS 实现足够。
 */
let pdfPolyfillsReady = false
function ensurePdfPolyfills(): void {
  if (pdfPolyfillsReady) return
  const g = globalThis as Record<string, unknown>
  if (typeof g.DOMMatrix === 'undefined') {
    g.DOMMatrix = createDOMMatrixPolyfill()
  }
  pdfPolyfillsReady = true
}

/** 最小可用的 DOMMatrix（仅覆盖 pdfjs 文本提取所需的 2D 变换语义） */
function createDOMMatrixPolyfill() {
  return class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
    m11 = 1; m12 = 0; m13 = 0; m14 = 0
    m21 = 0; m22 = 1; m23 = 0; m24 = 0
    m31 = 0; m32 = 0; m33 = 1; m34 = 0
    m41 = 0; m42 = 0; m43 = 0; m44 = 1
    is2D = true
    isIdentity = true

    constructor(init?: number[] | string) {
      if (Array.isArray(init) && init.length >= 6) {
        const [a, b, c, d, e, f] = init
        this.a = this.m11 = a
        this.b = this.m12 = b
        this.c = this.m21 = c
        this.d = this.m22 = d
        this.e = this.m41 = e
        this.f = this.m42 = f
        this.isIdentity = a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0
      }
    }

    multiply(other: DOMMatrix): DOMMatrix {
      const r = new DOMMatrix()
      r.a = this.a * other.a + this.c * other.b
      r.b = this.b * other.a + this.d * other.b
      r.c = this.a * other.c + this.c * other.d
      r.d = this.b * other.c + this.d * other.d
      r.e = this.a * other.e + this.c * other.f + this.e
      r.f = this.b * other.e + this.d * other.f + this.f
      r.m11 = r.a; r.m12 = r.b; r.m21 = r.c; r.m22 = r.d; r.m41 = r.e; r.m42 = r.f
      r.isIdentity = false
      return r
    }

    translate(tx = 0, ty = 0): DOMMatrix {
      const m = new DOMMatrix([1, 0, 0, 1, tx, ty])
      return this.multiply(m)
    }

    scale(sx = 1, sy?: number): DOMMatrix {
      const m = new DOMMatrix([sx, 0, 0, sy ?? sx, 0, 0])
      return this.multiply(m)
    }
  }
}

/**
 * 解析 PDF 文件
 */
async function parsePDF(file: File): Promise<string> {
  try {
    // pdfjs-dist 引用浏览器全局对象，Node 20 缺失，解析前按需注入 polyfill
    ensurePdfPolyfills()
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      useSystemFonts: true,
    })

    const pdf = await loadingTask.promise
    const numPages = pdf.numPages
    let fullText = ''

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ')

      fullText += pageText + '\n\n'
    }

    return fullText.trim()
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
      throw new Error('PDF 解析失败：文件可能已加密或受密码保护')
    }
    throw new Error(`PDF 解析失败: ${errorMsg}`)
  }
}

/**
 * 解析 Word 文档 (.docx)
 */
async function parseDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })
    return result.value.trim()
  } catch (error) {
    throw new Error(`Word 文档解析失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 解析 Excel 文件 (.xlsx)
 * 限制读取前 100 行以保护大文件
 */
async function parseXlsx(file: File): Promise<string> {
  const MAX_ROWS = 100

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    let fullText = ''

    workbook.eachSheet((worksheet) => {
      if (worksheet.rowCount === 0) return

      fullText += `## 工作表: ${worksheet.name}\n\n`

      let rowCount = 0
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowCount >= MAX_ROWS) return

        const cells = row.values as (string | number | undefined)[]
        // 跳过 undefined (ExcelJS row.values[0] 永远是 undefined)
        const rowText = cells
          .slice(1)
          .map(cell => cell?.toString() || '')
          .filter(Boolean)
          .join(' | ')

        if (rowText) {
          fullText += rowText + '\n'
          rowCount++
        }
      })

      fullText += '\n'
    })

    return fullText.trim()
  } catch (error) {
    throw new Error(`Excel 文件解析失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}
