import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getGraphStore } from '@/lib/graph-store'
import { isDemoMode } from '@/lib/demo-mode'

export async function GET() {
  const knowledgeBases = db.listKB()
  const graphStats = getGraphStore().stats()

  return NextResponse.json({
    ok: true,
    mode: isDemoMode() ? 'demo' : 'full',
    vectorStore: process.env.VECTOR_STORE || 'file',
    hasZhipuKey: Boolean(process.env.ZHIPU_API_KEY),
    knowledgeBaseCount: knowledgeBases.length,
    documentCount: knowledgeBases.reduce((sum, kb) => sum + kb.docCount, 0),
    graph: {
      nodes: graphStats.nodeCount,
      edges: graphStats.edgeCount,
    },
    time: new Date().toISOString(),
  })
}
