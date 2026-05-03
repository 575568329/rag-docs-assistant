/**
 * RAG 对话接口
 *
 * 流程：用户提问 → 向量化 → 相似度搜索 → 注入上下文 → LLM 流式回答
 *
 * 请求体：{ messages: UIMessage[], kbId: string }
 * 响应：SSE 流式文本（UI Message Stream）
 */

import { getVectorStore } from '@/lib/vector-store/index'
import { getEmbedding } from '@/lib/embedding'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { logger } from '@/lib/logger'

/** 相似度最低阈值，低于此分数视为不相关 */
const MIN_RELEVANCE_SCORE = 0.45

/** 搜索返回的最大结果数 */
const TOP_K = 5

interface ChatRequest {
  messages: { role: string; content: string }[]
  kbId: string
}

export async function POST(request: Request) {
  try {
    const { messages: rawMessages, kbId }: ChatRequest = await request.json()

    // AI SDK 的 UIMessage 格式转换为标准 message（parts → content）
    const messages = rawMessages.map((m: { role: string; parts?: { type: string; text: string }[] }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.parts?.filter(p => p.type === 'text').map(p => p.text).join('') ?? '',
    }))

    const userQuery = messages[messages.length - 1].content
    logger.info('对话请求', { kbId, query: userQuery, historyCount: messages.length - 1 })

    // Step 1: 将用户问题向量化
    const [queryVector] = await getEmbedding([userQuery])

    // Step 2: 在向量库中搜索相似文档
    const vectorStore = getVectorStore()
    const searchResults = await vectorStore.similaritySearch(`kb-${kbId}`, queryVector, TOP_K)
    logger.info('相似度搜索结果', {
      kbId,
      hits: searchResults.length,
      topScore: searchResults[0]?.score,
      results: searchResults.map((r, i) => ({ index: i + 1, score: r.score, content: r.content?.slice(0, 200) })),
    })

    // Step 3: 过滤低相关性结果，构建上下文
    const relevantResults = searchResults.filter(r => (r.score ?? 0) >= MIN_RELEVANCE_SCORE)
    const hasRelevantContext = relevantResults.length > 0
    const context = (hasRelevantContext ? relevantResults : searchResults)
      .map((r, i) => `[${i + 1}] ${r.content}`)
      .join('\n')

    logger.info('注入上下文', {
      kbId,
      relevant: relevantResults.length,
      contextLength: context.length,
      context: context.slice(0, 500),
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

    return result.toUIMessageStreamResponse()
  } catch (error) {
    logger.error('对话失败', { error: String(error) })
    return new Response('对话失败', { status: 500 })
  }
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
