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
}