/**
 * 文档切片模块
 *
 * 将长文本按 Markdown 标题分段，再对大段落按固定大小切片。
 * 每个切片都会携带其所属标题，保留上下文语义。
 */

import type { ChunkMetadata } from './types'

/** 文档标题 + 内容段落 */
interface Section {
  heading: string
  content: string
}

/** 带元数据的切片结果 */
export interface ChunkResult {
  text: string
  metadata: ChunkMetadata
}

/**
 * 按标题分段 + 固定大小切片（纯文本）
 *
 * 策略：
 * 1. 先按 Markdown 标题（# ~ ######）将文档拆为多个段落
 * 2. 小段落（≤ chunkSize）直接作为一个切片
 * 3. 大段落按 chunkSize 切片，相邻切片间有 overlap 字符重叠
 * 4. 所有切片都拼接上所属标题，保持语义完整
 *
 * @param text      原始文档文本
 * @param chunkSize 每个切片的最大字符数
 * @param overlap   相邻切片的重叠字符数
 * @returns 切片文本数组
 */
export function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = []
  if (!text || !text.length) return chunks

  const sections = splitByHeadings(text)

  for (const section of sections) {
    // 小段落直接整段作为一个切片
    if (section.content.length <= chunkSize) {
      chunks.push(withHeading(section))
      continue
    }

    // 大段落按固定大小切片，每段都带标题
    const step = Math.max(chunkSize - overlap, 1)
    for (let i = 0; i < section.content.length; i += step) {
      const slice = section.content.slice(i, i + chunkSize)
      chunks.push(withHeading({ heading: section.heading, content: slice }))
    }
  }

  return chunks
}

/**
 * 按标题分段 + 固定大小切片（带来源元数据）
 *
 * 与 chunkText 逻辑一致，但返回结构化结果用于来源追溯。
 * 每个切片携带所属文件名、标题和切片序号。
 *
 * @param text      原始文档文本
 * @param chunkSize 每个切片的最大字符数
 * @param overlap   相邻切片的重叠字符数
 * @param filename  源文件名（用于来源追溯）
 * @returns 带元数据的切片结果数组
 */
export function chunkTextWithMetadata(
  text: string,
  chunkSize: number,
  overlap: number,
  filename: string
): ChunkResult[] {
  const results: ChunkResult[] = []
  if (!text || !text.length) return results

  const sections = splitByHeadings(text)

  for (const section of sections) {
    if (section.content.length <= chunkSize) {
      results.push({
        text: withHeading(section),
        metadata: { filename, heading: section.heading, chunkIndex: 0 },
      })
      continue
    }

    const step = Math.max(chunkSize - overlap, 1)
    let chunkIndex = 0
    for (let i = 0; i < section.content.length; i += step) {
      const slice = section.content.slice(i, i + chunkSize)
      results.push({
        text: withHeading({ heading: section.heading, content: slice }),
        metadata: { filename, heading: section.heading, chunkIndex },
      })
      chunkIndex++
    }
  }

  return results
}

/** 拼接标题和内容 */
function withHeading(section: Section): string {
  return section.heading
    ? `${section.heading}\n${section.content}`
    : section.content
}

/**
 * 按 Markdown 标题拆分文档
 *
 * 遇到 # ~ ###### 开头的行视为新段落开始，
 * 将之前累积的内容保存为一个 section。
 */
function splitByHeadings(text: string): Section[] {
  const lines = text.split('\n')
  const sections: Section[] = []

  let currentHeading = ''
  let currentContent: string[] = []

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) {
      // 遇到新标题，先保存上一段
      if (currentContent.length) {
        sections.push({ heading: currentHeading, content: currentContent.join('\n') })
      }
      currentHeading = line
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }

  // 保存最后一段
  if (currentContent.length) {
    sections.push({ heading: currentHeading, content: currentContent.join('\n') })
  }

  return sections
}
