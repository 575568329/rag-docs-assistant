/**
 * 统一文档解析模块
 *
 * 支持 .txt, .md, .pdf, .docx, .xlsx 五种格式
 */

import * as mammoth from 'mammoth'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import * as ExcelJS from 'exceljs'

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
 * 解析 PDF 文件
 */
async function parsePDF(file: File): Promise<string> {
  try {
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
