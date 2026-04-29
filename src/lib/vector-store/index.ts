
import { VectorStore } from './types'
import { ChromaClient } from "chromadb";
import { FileStore } from './file-store';
import { ChromaStore } from './chroma-store'

export function getVectorStore(): VectorStore {
  const storeType = process.env.VECTOR_STORE || 'file'
  
  if (storeType === 'chroma') {
    // 1. 连接 Chroma 服务器
    const client = new ChromaClient({ host: 'localhost', port: 8000 })
    return new ChromaStore(client)
  } else {
    return new FileStore()
  }
}