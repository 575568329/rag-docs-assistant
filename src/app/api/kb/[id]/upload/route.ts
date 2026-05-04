/**
 * 文档上传接口
 *
 * 流程：校验知识库 → 去重检查 → 文本切片 → 向量化 → 存入向量库 → 记录文档
 *
 * 请求：FormData { file: File }
 * 响应：{ success: true } 或 { error: string }
 */

import { chunkTextWithMetadata } from '@/lib/chunker'
import { getEmbedding } from '@/lib/embedding'
import { getVectorStore } from '@/lib/vector-store/index'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kbId } = await params

    // Step 1: 校验知识库是否存在
    const kb = db.listKB().find(k => k.id === kbId)
    if (!kb) {
      logger.error('上传失败: 知识库不存在', { id: kbId })
      return NextResponse.json({ error: '知识库不存在' }, { status: 404 })
    }

    // Step 2: 读取文件
    const formData = await request.formData()
    const file = formData.get('file') as File

    // Step 3: 同名文件去重检查
    const existingDocs = db.listDocs(kbId)
    if (existingDocs.some(d => d.filename === file.name)) {
      logger.error('上传失败: 文件已存在', { kbId, filename: file.name })
      return NextResponse.json({ error: '该文件已上传过' }, { status: 400 })
    }

    // Step 4: 文本切片（按标题分段 + 固定大小，chunkSize=1000 保证上下文完整）
    const text = await file.text()
    const chunkResults = chunkTextWithMetadata(text, 1000, 100, file.name)
    const chunks = chunkResults.map(c => c.text)
    const metas = chunkResults.map(c => c.metadata)

    // Step 5: 批量向量化
    const vectors = await getEmbedding(chunks)
    const ids = chunks.map((_, i) => `kb${kbId}-chunk-${Date.now()}-${i}`)

    // Step 6: 存入向量库（含来源元数据）
    const vectorStore = getVectorStore()
    await vectorStore.addVectors(`kb-${kbId}`, vectors, chunks, ids, metas)

    // Step 7: 记录文档元数据（含 chunkIds，用于后续删除）
    db.addDoc(kbId, file.name, chunks.length, ids)

    logger.info('文档上传成功', { kbId, filename: file.name, chunks: chunks.length })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('上传失败', { error: String(error) })
    return NextResponse.json({ error: '上传失败', detail: String(error) }, { status: 500 })
  }
}
