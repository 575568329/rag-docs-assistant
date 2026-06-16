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
  filePath?: string
  mimeType?: string
  fileSize?: number
  hasFile?: boolean
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
  kbId?: string
  metadata: ChunkMetadata | null
}

/** 传递给前端 UI 的来源引用 */
export interface SourceRef {
  /** 编号，对应 LLM 回答中的 [1] [2] */
  index: number
  /** 所属知识库 ID */
  kbId?: string
  /** 来源文档 ID */
  docId?: string
  /** 来源文件名 */
  filename: string
  /** 所属章节标题 */
  heading: string
  /** 所属知识库名称（跨知识库检索时用于区分来源） */
  knowledgeBaseName?: string
  /** 相似度分数 */
  score: number
}

/** 对话记录摘要 */
export interface Conversation {
  id: string
  title: string
  kbId: string | null
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  metadata?: {
    sources?: SourceRef[]
  }
  createdAt: string
}

/** 图谱节点收藏 */
export interface Favorite {
  id: string
  nodeId: string
  nodeLabel: string
  nodeType: string
  kbId: string | null
  createdAt: string
}

