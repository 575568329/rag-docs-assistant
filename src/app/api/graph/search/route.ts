/**
 * 图谱搜索 API
 *
 * GET /api/graph/search?kbId=xxx&query=xxx&limit=20
 * - 按名称模糊搜索节点
 * - 返回匹配节点列表（含类型、属性、边数）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGraphStore } from '@/lib/graph-store'
import { logger, startTimer } from '@/lib/logger'

interface SearchParams {
  kbId?: string
  query?: string
  limit?: string
}

interface SearchResultItem {
  id: string
  label: string
  type: string
  properties: Record<string, string | number | boolean>
  edgeCount: number
}

export async function GET(request: NextRequest) {
  const timer = startTimer()
  try {
    const { searchParams } = new URL(request.url)
    const kbId = searchParams.get('kbId') ?? undefined
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)

    if (!query) {
      logger.warn('图谱搜索参数错误', { kbId, reason: '缺少 query 参数' })
      return NextResponse.json({ error: '缺少 query 参数' }, { status: 400 })
    }

    const store = getGraphStore()
    const matchedNodes = store.searchNodes(query, kbId)

    // 统计每个节点的边数
    const results: SearchResultItem[] = matchedNodes.map(node => {
      // 获取节点的入边 + 出边数量
      const inDegree = store['graph'].inDegree(node.id)
      const outDegree = store['graph'].outDegree(node.id)

      return {
        ...node,
        edgeCount: inDegree + outDegree,
      }
    })

    // 按 limit 截取
    const limited = results.slice(0, limit)

    logger.info('图谱搜索', { kbId, query, matchedCount: results.length, returnedCount: limited.length, ...timer() })
    return NextResponse.json({
      results: limited,
      total: results.length,
    })
  } catch (error) {
    logger.error('图谱搜索失败', { error: error instanceof Error ? error.message : String(error), ...timer() })
    return NextResponse.json(
      { error: '图谱搜索失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
