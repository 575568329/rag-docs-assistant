import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVectorStore } from '@/lib/vector-store'
import { logger, startTimer } from '@/lib/logger'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timer = startTimer()
  const { id } = await params
  try {
    db.deleteKB(id)
    await getVectorStore().deleteCollection(`kb-${id}`)
    logger.info('知识库删除成功', { kbId: id, ...timer() })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('知识库删除失败', { kbId: id, error: String(error), ...timer() })
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
