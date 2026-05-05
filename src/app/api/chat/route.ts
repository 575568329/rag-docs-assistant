/**
 * RAG 对话接口
 *
 * 流程：用户提问 → 向量化 → 相似度搜索 → 注入上下文 → LLM 流式回答
 * 支持来源追溯：搜索结果的元数据（文件名、标题、分数）通过 messageMetadata 传递给前端
 *
 * 请求体：{ messages: UIMessage[], kbId: string }
 * 响应：SSE 流式文本（UI Message Stream），附带 sources 元数据
 */

import { getVectorStore } from '@/lib/vector-store/index'
import { FileStore } from '@/lib/vector-store/file-store'
import { getEmbedding } from '@/lib/embedding'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, UIMessage } from 'ai'
import { logger } from '@/lib/logger'
import type { SourceRef } from '@/lib/types'

/** 相似度最低阈值，低于此分数视为不相关 */
const MIN_RELEVANCE_SCORE = 0.45

/** 搜索返回的最大结果数 */
const TOP_K = 5

/** 自定义消息元数据类型（用于来源追溯） */
type ChatMetadata = {
  sources?: SourceRef[]
}

/** 自定义 UIMessage 类型（携带来源元数据） */
export type ChatUIMessage = UIMessage<ChatMetadata>

interface ChatRequest {
  messages: { role: string; content?: string; parts?: { type: string; text: string }[] }[]
  kbId: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Partial<ChatRequest>
    const { messages: rawMessages, kbId } = body

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return new Response('消息不能为空', { status: 400 })
    }

    if (typeof kbId !== 'string') {
      return new Response('知识库 ID 无效', { status: 400 })
    }

    // AI SDK 的 UIMessage 格式转换为标准 message（parts → content）
    const messages = rawMessages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.parts?.filter(p => p.type === 'text').map(p => p.text).join('') ?? m.content ?? '',
    })).filter(m => m.content.trim().length > 0)

    if (messages.length === 0) {
      return new Response('消息内容不能为空', { status: 400 })
    }

    const userQuery = messages[messages.length - 1].content
    if (!userQuery.trim()) {
      return new Response('问题不能为空', { status: 400 })
    }

    if (!process.env.ZHIPU_API_KEY) {
      logger.error('对话失败: 缺少 ZHIPU_API_KEY')
      return new Response('服务未配置 AI API Key', { status: 500 })
    }

    logger.info('对话请求', { kbId, query: userQuery, historyCount: messages.length - 1 })

    // Step 1: 将用户问题向量化
    const searchQuery = buildSearchQuery(messages)
    const [queryVector] = await getEmbedding([searchQuery])

    // Step 2: 混合检索（向量 + 关键词），FileStore 支持混合搜索
    const vectorStore = getVectorStore()
    const collectionName = `kb-${kbId}`
    const isHybrid = vectorStore instanceof FileStore
    const searchResults = isHybrid
      ? await vectorStore.hybridSearch(collectionName, queryVector, userQuery, TOP_K)
      : await vectorStore.similaritySearch(collectionName, queryVector, TOP_K)
    logger.info('搜索结果', {
      kbId,
      mode: isHybrid ? 'hybrid' : 'vector',
      hits: searchResults.length,
      topScore: searchResults[0]?.score,
      results: searchResults.map((r, i) => ({
        index: i + 1,
        score: r.score,
        source: r.metadata?.filename ?? '未知',
        content: r.content?.slice(0, 200),
      })),
    })

    // Step 3: 过滤低相关性结果，构建上下文
    // 混合搜索的 RRF 分数范围与余弦相似度不同，不做阈值过滤，直接使用 top-K 结果
    const relevantResults = isHybrid
      ? searchResults
      : searchResults.filter(r => (r.score ?? 0) >= MIN_RELEVANCE_SCORE)
    const hasRelevantContext = relevantResults.length > 0
    const usedResults = hasRelevantContext ? relevantResults : searchResults
    const context = usedResults
      .map((r, i) => `[${i + 1}] ${r.content}`)
      .join('\n')

    // 构建来源引用列表（与上下文编号一一对应）
    const sources: SourceRef[] = usedResults.map((r, i) => ({
      index: i + 1,
      filename: r.metadata?.filename ?? '未知文档',
      heading: r.metadata?.heading ?? '未知章节',
      score: r.score ?? 0,
    }))

    logger.info('注入上下文', {
      kbId,
      relevant: relevantResults.length,
      sourceCount: sources.length,
      contextLength: context.length,
    })

    // Step 4: 调用 LLM 流式生成回答
    const glm = createOpenAI({
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: process.env.ZHIPU_API_KEY,
    })

    const result = streamText({
      model: glm.chat('glm-4-flash'),
      messages,
      system: buildSystemPrompt(context, hasRelevantContext),
      onFinish: ({ text }) => {
        logger.info('LLM回答', { kbId, query: userQuery, response: text })
      },
    })

    // Step 5: 通过 messageMetadata 将来源信息传递给前端
    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === 'finish') {
          return { sources }
        }
      },
    })
  } catch (error) {
    logger.error('对话失败', { error: String(error) })
    return new Response('对话失败', { status: 500 })
  }
}

/**
 * 构建用于检索的搜索查询
 *
 * 多轮对话优化：如果有历史消息，将最近的上下文与当前查询拼接，
 * 使后续追问（如"详细说说"）也能匹配到正确的文档。
 */
function buildSearchQuery(messages: { role: string; content: string }[]): string {
  const currentQuery = messages[messages.length - 1].content

  // 无历史上下文，直接使用当前问题
  if (messages.length <= 1) return currentQuery

  // 取最近 2 轮对话（最多 4 条历史消息）作为上下文
  const recentHistory = messages.slice(-5, -1)
  const contextStr = recentHistory
    .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
    .join('\n')

  // 拼接上下文 + 当前问题，截断避免稀释 embedding
  const combined = `${contextStr}\n用户: ${currentQuery}`
  return combined.length > 500 ? combined.slice(-500) : combined
}

/**
 * 根据搜索结果相关性构建 system prompt
 * - 有相关内容：要求在句中标注引用编号，末尾不汇总
 * - 无相关内容：要求说明并标注为 AI 补充回答
 */
function buildSystemPrompt(context: string, hasRelevantContext: boolean): string {
  if (hasRelevantContext) {
    return `基于以下参考资料回答问题：

${context}

要求：
1. 只在直接引用了某条资料的内容时才标注 [编号]，标注紧跟在被引用的语句后面
2. 不要在回答末尾汇总引用编号
3. 如果参考资料不足以回答问题，先说明，再基于你的知识补充，并标注"以下为补充内容"`
  }

  return `参考资料中未找到与问题直接相关的内容。
请基于你的知识回答，并在回答开头标注"以下内容未在知识库中找到相关资料，为AI补充回答"。`
}
