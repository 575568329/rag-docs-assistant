/**
 * 文件向量存储实现
 *
 * 将向量数据持久化到 data/vectors.json，按 collectionName 分组存储。
 * 适用于开发和小规模场景，生产环境建议切换到 ChromaStore。
 */

import type { VectorStore } from './types'
import fs from 'fs'
import path from 'path'

const FILE_PATH = path.resolve('data/vectors.json')

/** 读取整个 vectors.json，文件不存在则返回空对象 */
function loadAll(): Record<string, { ids: string[]; texts: string[]; vectors: number[][] }> {
  if (!fs.existsSync(FILE_PATH)) return {}
  return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'))
}

/** 确保目录存在后写入文件 */
function saveAll(data: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true })
  fs.writeFileSync(FILE_PATH, JSON.stringify(data), 'utf-8')
}

export class FileStore implements VectorStore {

  /**
   * 添加向量到指定集合
   * @param collectionName 集合名（格式：kb-{kbId}）
   * @param vectors        向量数组
   * @param texts          对应的文本切片
   * @param ids            切片唯一标识
   */
  async addVectors(
    collectionName: string,
    vectors: number[][],
    texts: string[],
    ids: string[]
  ): Promise<void> {
    const all = loadAll()
    const existing = all[collectionName] || { ids: [], texts: [], vectors: [] }

    all[collectionName] = {
      ids: [...existing.ids, ...ids],
      texts: [...existing.texts, ...texts],
      vectors: [...existing.vectors, ...vectors],
    }

    saveAll(all)
  }

  /**
   * 余弦相似度搜索
   * @param collectionName 集合名
   * @param queryVector    查询向量
   * @param topK           返回前 K 条结果
   */
  async similaritySearch(
    collectionName: string,
    queryVector: number[],
    topK: number
  ): Promise<{ content: string | null; score: number | null }[]> {
    const all = loadAll()
    const collection = all[collectionName]

    if (!collection) return []

    const { vectors, texts } = collection
    const scored = vectors.map((vec: number[], i: number) => ({
      score: cosineSimilarity(vec, queryVector),
      content: texts[i] as string | null,
    }))

    // 按相似度降序排列，取前 topK 条
    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    return scored.slice(0, topK)
  }

  /** 删除指定集合的所有数据 */
  async deleteCollection(collectionName: string): Promise<void> {
    const all = loadAll()
    delete all[collectionName]
    saveAll(all)
  }

  /** 统计指定集合的向量数量 */
  async count(collectionName: string): Promise<number> {
    const all = loadAll()
    return all[collectionName]?.ids?.length ?? 0
  }
}

/** 计算两个向量的余弦相似度 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}
