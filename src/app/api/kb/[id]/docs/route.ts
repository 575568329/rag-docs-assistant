/**
 * 文档管理接口
 *
 * GET    - 获取指定知识库下的文档列表
 * DELETE - 删除单个文档（同时清理向量数据）
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVectorStore } from '@/lib/vector-store'
import { logger } from '@/lib/logger'

/** 获取文档列表，请求体：无 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: kbId } = await params
  return NextResponse.json(db.listDocs(kbId))
}

/** 删除单个文档，请求体：{ docId: string } */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kbId } = await params
    const { docId } = await request.json()

    const doc = db.deleteDoc(docId)
    if (!doc) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    // 同步清理向量数据
    if (doc.chunkIds?.length) {
      await getVectorStore().removeVectors(`kb-${kbId}`, doc.chunkIds)
    }

    logger.info('文档删除成功', { kbId, docId, filename: doc.filename })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('文档删除失败', { error: String(error) })
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
