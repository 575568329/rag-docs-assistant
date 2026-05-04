export interface KnowledgeBase {
  id: string
  name: string
  description: string
  docCount: number
  createdAt: string
}

export interface Document {
  id: string
  kbId: string
  filename: string
  chunkCount: number
  uploadedAt: string
  chunkIds?: string[]
}

/** 每个 chunk 的来源元数据，用于来源追溯 */
export interface ChunkMetadata {
  /** 所属文档文件名 */
  filename: string
  /** 所属 Markdown 标题 */
  heading: string
  /** 同一标题下的切片序号 */
  chunkIndex: number
}

/** 向量搜索结果（含来源元数据） */
export interface SearchResult {
  content: string | null
  score: number | null
  metadata: ChunkMetadata | null
}

/** 传递给前端 UI 的来源引用 */
export interface SourceRef {
  /** 编号，对应 LLM 回答中的 [1] [2] */
  index: number
  /** 来源文件名 */
  filename: string
  /** 所属章节标题 */
  heading: string
  /** 相似度分数 */
  score: number
}