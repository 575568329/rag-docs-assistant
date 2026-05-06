/**
 * 文档管理接口
 *
 * GET    - 获取指定知识库下的文档列表
 * DELETE - 删除单个文档（同时清理向量数据）
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVectorStore } from '@/lib/vector-store'
import { logger, startTimer } from '@/lib/logger'
import { deleteStoredFile } from '@/lib/document-files'

/** 获取文档列表，请求体：无 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timer = startTimer()
  const { id: kbId } = await params
  try {
    const docs = db.listDocs(kbId).map(({ filePath, ...doc }) => ({
      ...doc,
      hasFile: Boolean(filePath),
    }))
    logger.info('获取文档列表', { kbId, count: docs.length, ...timer() })
    return NextResponse.json(docs)
  } catch (error) {
    logger.error('获取文档列表失败', { kbId, error: String(error), ...timer() })
    return NextResponse.json({ error: '获取文档列表失败' }, { status: 500 })
  }
}

/** 删除单个文档，请求体：{ docId: string } */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timer = startTimer()
  try {
    const { id: kbId } = await params
    const { docId } = await request.json()
    if (typeof docId !== 'string' || !docId) {
      logger.warn('文档删除参数错误', { kbId, reason: 'docId 无效' })
      return NextResponse.json({ error: '文档 ID 无效' }, { status: 400 })
    }

    const targetDoc = db.listDocs(kbId).find(doc => doc.id === docId)
    if (!targetDoc) {
      logger.warn('文档删除: 文档不存在', { kbId, docId, ...timer() })
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    const doc = db.deleteDoc(docId)
    if (!doc) {
      logger.warn('文档删除: 文档不存在(已清除)', { kbId, docId, ...timer() })
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    // 同步清理向量数据
    const chunkIds = doc.chunkIds ?? []
    const chunkCount = chunkIds.length
    if (chunkCount > 0) {
      await getVectorStore().removeVectors(`kb-${kbId}`, chunkIds)
    }
    await deleteStoredFile(doc.filePath)

    logger.info('文档删除成功', { kbId, docId, filename: doc.filename, chunkCount, ...timer() })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('文档删除失败', { error: String(error), ...timer() })
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
