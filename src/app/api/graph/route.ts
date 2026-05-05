/**
 * 图谱查询 API
 *
 * GET /api/graph?kbId=xxx&query=xxx&nodeId=xxx&depth=1
 * - query 模式：搜索匹配节点，返回其 N 层邻居
 * - nodeId 模式：获取指定节点的 N 层邻居
 * - 无参数：返回全部图谱概览（节点数/边数/类型分布）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGraphStore } from '@/lib/graph-store'

interface QueryParams {
  kbId?: string
  query?: string
  nodeId?: string
  depth?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kbId = searchParams.get('kbId') ?? undefined
    const query = searchParams.get('query') ?? undefined
    const nodeId = searchParams.get('nodeId') ?? undefined
    const depth = searchParams.get('depth') ?? '1'

    const store = getGraphStore()

    // 模式 1: 按 query 搜索节点，返回邻居
    if (query) {
      const matchedNodes = store.searchNodes(query, kbId)

      if (matchedNodes.length === 0) {
        return NextResponse.json({
          nodes: [],
          edges: [],
          stats: store.stats(kbId),
        })
      }

      // 获取第一个匹配节点的邻域
      const { nodes, edges } = store.getNeighborhood(matchedNodes[0].id, parseInt(depth, 10), kbId)

      return NextResponse.json({
        nodes,
        edges,
        stats: store.stats(kbId),
      })
    }

    // 模式 2: 按 nodeId 获取邻域
    if (nodeId) {
      const { nodes, edges } = store.getNeighborhood(nodeId, parseInt(depth, 10), kbId)

      return NextResponse.json({
        nodes,
        edges,
        stats: store.stats(kbId),
      })
    }

    // 模式 3: 返回全部图谱概览
    const snapshot = store.getGraphSnapshot(kbId)
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('图谱查询失败:', error)
    return NextResponse.json(
      { error: '图谱查询失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
