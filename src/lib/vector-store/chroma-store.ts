/**
 * ChromaDB 向量存储实现
 *
 * 使用 ChromaDB 服务存储和检索向量数据，支持来源元数据。
 * 需要本地运行 Chroma 服务（localhost:8000）。
 */

import { ChromaClient } from 'chromadb'
import { VectorStore } from './types'
import type { ChunkMetadata, SearchResult } from '../types'

export class ChromaStore implements VectorStore {
  private client: ChromaClient

  constructor(client: ChromaClient) {
    this.client = client
  }

  async addVectors(
    collectionName: string,
    vectors: number[][],
    texts: string[],
    ids: string[],
    metas?: (ChunkMetadata | null)[]
  ) {
    const collection = await this.client.getOrCreateCollection({ name: collectionName })
    await collection.add({
      ids,
      documents: texts,
      embeddings: vectors,
      // ChromaDB 原生支持 metadatas 参数，过滤 null 值
      metadatas: (metas ?? ids.map(() => ({}))).map(m => m ?? {}),
    })
  }

  async similaritySearch(
    collectionName: string,
    queryVector: number[],
    topK: number
  ): Promise<SearchResult[]> {
    const collection = await this.client.getOrCreateCollection({ name: collectionName })
    const results = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: topK,
    })

    const data: SearchResult[] = []
    for (let index = 0; index < results.documents[0].length; index++) {
      const distance = results.distances?.[0]?.[index] ?? 0
      const rawMeta = results.metadatas?.[0]?.[index] as Record<string, unknown> | null

      data.push({
        content: results.documents[0][index] || '',
        score: distance !== null ? 1 - distance : 0,
        metadata: rawMeta
          ? {
              filename: (rawMeta.filename as string) ?? '',
              heading: (rawMeta.heading as string) ?? '',
              chunkIndex: (rawMeta.chunkIndex as number) ?? 0,
            }
          : null,
      })
    }

    return data
  }

  async deleteCollection(collectionName: string) {
    await this.client.deleteCollection({ name: collectionName })
  }

  async removeVectors(collectionName: string, ids: string[]) {
    const collection = await this.client.getOrCreateCollection({ name: collectionName })
    await collection.delete({ ids })
  }

  async count(collectionName: string) {
    const collection = await this.client.getOrCreateCollection({ name: collectionName })
    return collection.count()
  }
}
