import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVectorStore } from '@/lib/vector-store'
import { logger, startTimer } from '@/lib/logger'
import { deleteStoredFile } from '@/lib/document-files'
import { getGraphStore } from '@/lib/graph-store'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timer = startTimer()
  const { id } = await params
  try {
    const docs = db.listDocs(id)
    db.deleteKB(id)
    await getVectorStore().deleteCollection(`kb-${id}`)
    getGraphStore().deleteCollection(id)
    await Promise.all(docs.map(doc => deleteStoredFile(doc.filePath)))
    logger.info('知识库删除成功', { kbId: id, docCount: docs.length, ...timer() })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('知识库删除失败', { kbId: id, error: String(error), ...timer() })
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

