/**
 * EntityExtractor - 使用 AI SDK 提取实体和关系
 *
 * 从文本中提取实体（人物、组织、地点、概念、事件、文档）和关系，
 * 并存储到 GraphStore 中。
 */

import { generateObject } from 'ai'
import { createZhipu } from 'zhipu-ai-provider'
import { z } from 'zod'
import type { EntityType, RelationType } from './graph-store'

/** 实体 */
export interface Entity {
  name: string
  type: EntityType
  description?: string
}

/** 关系 */
export interface Relation {
  source: string
  target: string
  type: RelationType
  description?: string
}

/** 提取结果 */
export interface ExtractionResult {
  entities: Entity[]
  relations: Relation[]
}

/** Zod Schema: 实体类型 */
const entitySchema = z.object({
  name: z.string().describe('实体名称'),
  type: z
    .enum(['Person', 'Organization', 'Location', 'Concept', 'Event', 'Document'])
    .describe('实体类型'),
  description: z.string().optional().describe('实体描述（可选）'),
})

/** Zod Schema: 关系类型 */
const relationSchema = z.object({
  source: z.string().describe('源实体名称'),
  target: z.string().describe('目标实体名称'),
  type: z
    .enum(['BELONGS_TO', 'RELATED_TO', 'LOCATED_AT', 'PART_OF', 'CAUSED_BY'])
    .describe('关系类型'),
  description: z.string().optional().describe('关系描述（可选）'),
})

/** Zod Schema: 提取结果 */
const extractionResultSchema = z.object({
  entities: z.array(entitySchema).describe('实体列表'),
  relations: z.array(relationSchema).describe('关系列表'),
})

/** 智谱 AI 客户端（官方社区 provider，正确请求 /chat/completions） */
const zhipu = createZhipu({
  apiKey: process.env.ZHIPU_API_KEY ?? '',
})

/**
 * 从文本中提取实体和关系
 * @param text 输入文本
 * @param kbId 知识库 ID
 */
export async function extractEntities(text: string, kbId: string): Promise<ExtractionResult> {
  try {
    const result = await generateObject({
      model: zhipu('glm-4-flash'),
      schema: extractionResultSchema,
      prompt: `从以下文本中提取实体和关系。

实体类型说明：
- Person: 人物
- Organization: 组织/机构
- Location: 地点/位置
- Concept: 概念/术语
- Event: 事件
- Document: 文档

关系类型说明：
- BELONGS_TO: 属于
- RELATED_TO: 相关
- LOCATED_AT: 位于
- PART_OF: 是...的一部分
- CAUSED_BY: 由...引起

文本：
${text}

请提取所有实体及其关系，确保实体的 name 和关系中的 source/target 名称一致。`,
    })

    return result.object
  } catch (error) {
    console.error('实体提取失败:', error)
    throw new Error(`实体提取失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}
