/**
 * 文件向量存储实现
 *
 * 将向量数据持久化到 data/vectors.json，按 collectionName 分组存储。
 * 支持来源元数据（ChunkMetadata），用于来源追溯。
 * 适用于开发和小规模场景，生产环境建议切换到 ChromaStore。
 */

import type { VectorStore } from './types'
import type { ChunkMetadata, SearchResult } from '../types'
import fs from 'fs'
import path from 'path'

const FILE_PATH = path.resolve('data/vectors.json')

/** 集合内的数据结构 */
interface CollectionData {
  ids: string[]
  texts: string[]
  vectors: number[][]
  /** 来源元数据（可选，向后兼容旧数据） */
  metas?: (ChunkMetadata | null)[]
}

/** 读取整个 vectors.json，文件不存在则返回空对象 */
function loadAll(): Record<string, CollectionData> {
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
   * @param metas          可选的来源元数据
   */
  async addVectors(
    collectionName: string,
    vectors: number[][],
    texts: string[],
    ids: string[],
    metas?: (ChunkMetadata | null)[]
  ): Promise<void> {
    const all = loadAll()
    const existing = all[collectionName] || { ids: [], texts: [], vectors: [], metas: [] }

    // 如果旧集合没有 metas，用 null 填充以保持对齐
    if (!existing.metas) {
      existing.metas = existing.ids.map(() => null)
    }

    all[collectionName] = {
      ids: [...existing.ids, ...ids],
      texts: [...existing.texts, ...texts],
      vectors: [...existing.vectors, ...vectors],
      metas: [...existing.metas, ...(metas ?? ids.map(() => null))],
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
  ): Promise<SearchResult[]> {
    const all = loadAll()
    const collection = all[collectionName]

    if (!collection) return []

    const { vectors, texts, metas } = collection
    const scored: SearchResult[] = vectors.map((vec: number[], i: number) => ({
      score: cosineSimilarity(vec, queryVector),
      content: texts[i] as string | null,
      metadata: metas?.[i] ?? null,
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

  /**
   * 删除集合中指定的向量（按 ID 精确匹配）
   *
   * 思路：用 Set 快速查找要删除的 ID，收集保留项的下标，然后重建三个平行数组
   * @param collectionName 集合名（格式：kb-{kbId}）
   * @param ids            要删除的向量 ID 列表
   */
  async removeVectors(collectionName: string, ids: string[]): Promise<void> {
    const all = loadAll()
    const collection = all[collectionName]
    if (!collection) return

    // 用 Set 提升 ID 查找性能
    const removeSet = new Set(ids)

    // 收集不需要删除的下标
    const keepIndices: number[] = []
    for (let i = 0; i < collection.ids.length; i++) {
      if (!removeSet.has(collection.ids[i])) {
        keepIndices.push(i)
      }
    }

    // 按保留下标重建平行数组（ids / texts / vectors / metas 一一对应）
    collection.ids = keepIndices.map(i => collection.ids[i])
    collection.texts = keepIndices.map(i => collection.texts[i])
    collection.vectors = keepIndices.map(i => collection.vectors[i])
    if (collection.metas) {
      const oldMetas = collection.metas
      collection.metas = keepIndices.map(i => oldMetas[i])
    }
    saveAll(all)
  }

  /** 统计指定集合的向量数量 */
  async count(collectionName: string): Promise<number> {
    const all = loadAll()
    return all[collectionName]?.ids?.length ?? 0
  }

  /**
   * 简单关键词搜索
   *
   * 中文逐字分词 + 英文按单词分词，计算匹配词频 / 查询总词数作为分数。
   * 用于与向量搜索互补，捕获精确关键词匹配。
   */
  async keywordSearch(
    collectionName: string,
    query: string,
    topK: number
  ): Promise<SearchResult[]> {
    const all = loadAll()
    const collection = all[collectionName]
    if (!collection) return []

    const tokens = tokenize(query)
    if (tokens.length === 0) return []

    const scored: SearchResult[] = collection.texts.map((text, i) => {
      const matched = tokens.filter(t => text.includes(t)).length
      return {
        content: text as string | null,
        score: matched / tokens.length,
        metadata: collection.metas?.[i] ?? null,
      }
    })

    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    return scored.filter(r => (r.score ?? 0) > 0).slice(0, topK)
  }

  /**
   * 混合检索：向量搜索 + 关键词搜索，RRF 融合排序
   *
   * 向量搜索捕获语义相似，关键词搜索捕获精确匹配，
   * 通过 Reciprocal Rank Fusion 合并两路结果。
   */
  async hybridSearch(
    collectionName: string,
    queryVector: number[],
    queryText: string,
    topK: number
  ): Promise<SearchResult[]> {
    const [vectorResults, keywordResults] = await Promise.all([
      this.similaritySearch(collectionName, queryVector, topK),
      this.keywordSearch(collectionName, queryText, topK),
    ])

    return reciprocalRankFusion([vectorResults, keywordResults], topK)
  }
}

/**
 * 中文逐字 + 英文按词分词
 * 例："RAG检索方法" → ["RAG", "检", "索", "方", "法"]
 */
function tokenize(text: string): string[] {
  const tokens: string[] = []
  // 提取中文字符（逐字）
  const chineseChars = text.match(/[一-鿿]/g) ?? []
  tokens.push(...chineseChars)
  // 提取英文单词（≥2字符）
  const englishWords = text.match(/[a-zA-Z0-9]{2,}/g) ?? []
  tokens.push(...englishWords)
  return tokens
}

/**
 * Reciprocal Rank Fusion (RRF)
 *
 * 对多个排序列表中的结果按公式融合：score = Σ(1 / (k + rank_i))
 * k=60 是 RRF 论文推荐的常数，平衡头部与尾部结果的权重。
 */
function reciprocalRankFusion(
  rankedLists: SearchResult[][],
  topK: number,
  k: number = 60
): SearchResult[] {
  // 以 content 为 key 聚合 RRF 分数
  const scoreMap = new Map<string, { score: number; result: SearchResult }>()

  for (const list of rankedLists) {
    list.forEach((result, rank) => {
      const key = result.content ?? ''
      const existing = scoreMap.get(key)
      const rrfContribution = 1 / (k + rank + 1) // rank 从 0 开始

      if (existing) {
        existing.score += rrfContribution
      } else {
        scoreMap.set(key, { score: rrfContribution, result })
      }
    })
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .map(item => ({ ...item.result, score: item.score }))
    .slice(0, topK)
}

/** 计算两个向量的余弦相似度 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}
