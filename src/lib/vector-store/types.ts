import type { ChunkMetadata, SearchResult } from '../types'

export interface VectorStore {
  /**
   * 在一个或多个集合中检索相关片段。
   * - `collectionNames` 只有一个时，相当于单知识库检索
   * - `collectionNames` 有多个时，用于“全部知识库”跨库检索
   * - `queryText` 可选，便于支持关键词 + 向量的混合检索实现
   */
  search(
    collectionNames: string[],
    queryVector: number[],
    topK: number,
    queryText?: string
  ): Promise<SearchResult[]>

  /**
   * 添加向量到集合
   * @param collectionName 集合名（格式：kb-{kbId}）
   * @param vectors        向量数组
   * @param texts          对应的文本切片
   * @param ids            切片唯一标识
   * @param metas          可选的来源元数据（用于来源追溯）
   */
  addVectors(
    collectionName: string,
    vectors: number[][],
    texts: string[],
    ids: string[],
    metas?: (ChunkMetadata | null)[]
  ): Promise<void>

  /**
   * 相似度搜索（返回带来源元数据的结果）
   * @param collectionName 集合名
   * @param queryVector    查询向量
   * @param topK           返回前 K 条结果
   */
  similaritySearch(
    collectionName: string,
    queryVector: number[],
    topK: number
  ): Promise<SearchResult[]>

  /** 删除指定集合的所有数据 */
  deleteCollection(collectionName: string): Promise<void>

  /** 删除集合中指定的向量（按 ID 精确匹配） */
  removeVectors(collectionName: string, ids: string[]): Promise<void>

  /** 统计指定集合的向量数量 */
  count(collectionName: string): Promise<number>
}
