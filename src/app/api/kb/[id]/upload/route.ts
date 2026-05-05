/**
 * 文档上传接口
 *
 * 流程：校验知识库 → 文件校验 → 去重检查 → 文本解析 → 切片 → 向量化 → 存入向量库 → 记录文档
 *
 * 请求：FormData { file: File }
 * 响应：{ success: true } 或 { error: string }
 *
 * 支持格式：.txt, .md, .pdf, .docx, .xlsx
 * 文件大小限制：10MB
 */

import { chunkTextWithMetadata } from '@/lib/chunker'
import { parseDocument } from '@/lib/doc-parser'
import { getEmbedding } from '@/lib/embedding'
import { getVectorStore } from '@/lib/vector-store/index'
import { extractEntities } from '@/lib/entity-extractor'
import { getGraphStore } from '@/lib/graph-store'
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

    // Step 2: 读取并校验文件
    const formData = await request.formData()
    const fileEntry = formData.get('file')
    if (!(fileEntry instanceof File)) {
      logger.error('上传失败: 未提供文件', { kbId })
      return NextResponse.json({ error: '请上传文件' }, { status: 400 })
    }

    const file = fileEntry
    if (!file.name || file.size === 0) {
      logger.error('上传失败: 文件为空', { kbId, filename: file.name, size: file.size })
      return NextResponse.json({ error: '文件不能为空' }, { status: 400 })
    }

    // 文件大小校验（10MB）
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      logger.error('上传失败: 文件超过大小限制', { kbId, filename: file.name, size: file.size })
      return NextResponse.json(
        { error: `文件超过大小限制（最大 10MB），当前 ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      )
    }

    // Step 3: 同名文件去重检查
    const existingDocs = db.listDocs(kbId)
    if (existingDocs.some(d => d.filename === file.name)) {
      logger.error('上传失败: 文件已存在', { kbId, filename: file.name })
      return NextResponse.json({ error: '该文件已上传过' }, { status: 400 })
    }

    // Step 4: 解析文档内容（支持多格式）
    const text = await parseDocument(file)

    // Step 5: 文本切片（按标题分段 + 固定大小，chunkSize=1000 保证上下文完整）
    const chunkResults = chunkTextWithMetadata(text, 1000, 100, file.name)
    if (chunkResults.length === 0) {
      logger.error('上传失败: 未解析到有效文本', { kbId, filename: file.name })
      return NextResponse.json({ error: '未解析到有效文本内容' }, { status: 400 })
    }

    const chunks = chunkResults.map(c => c.text)
    const metas = chunkResults.map(c => c.metadata)

    // Step 6: 批量向量化
    const vectors = await getEmbedding(chunks)
    const ids = chunks.map((_, i) => `kb${kbId}-chunk-${Date.now()}-${i}`)

    // Step 7: 存入向量库（含来源元数据）
    const vectorStore = getVectorStore()
    await vectorStore.addVectors(`kb-${kbId}`, vectors, chunks, ids, metas)

    // Step 8: 记录文档元数据（含 chunkIds，用于后续删除）
    db.addDoc(kbId, file.name, chunks.length, ids)

    // Step 9: 提取实体并写入知识图谱（异步，失败不影响上传结果）
    const graphStore = getGraphStore()
    const docNodeId = `doc:${kbId}:${file.name}`
    graphStore.addNode(docNodeId, file.name, 'Document', { kbId, createdAt: new Date().toISOString() })

    extractEntities(text.slice(0, 8000), kbId).then(result => {
      const entityMap = new Map<string, string>()
      for (const entity of result.entities) {
        const nodeId = `${entity.type.toLowerCase()}:${entity.name}`
        try {
          graphStore.addNode(nodeId, entity.name, entity.type, {
            kbId,
            description: entity.description ?? '',
            createdAt: new Date().toISOString(),
          })
          entityMap.set(entity.name, nodeId)
          graphStore.addEdge(docNodeId, nodeId, 'RELATED_TO')
        } catch { /* 忽略重复节点 */ }
      }
      for (const relation of result.relations) {
        const srcId = entityMap.get(relation.source)
        const tgtId = entityMap.get(relation.target)
        if (srcId && tgtId) {
          try {
            graphStore.addEdge(srcId, tgtId, relation.type)
          } catch { /* 忽略重复边 */ }
        }
      }
      logger.info('实体提取完成', { kbId, filename: file.name, entities: result.entities.length, relations: result.relations.length })
    }).catch(err => {
      logger.error('实体提取失败（不影响上传）', { error: String(err) })
    })

    logger.info('文档上传成功', { kbId, filename: file.name, chunks: chunks.length })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('上传失败', { error: String(error) })
    return NextResponse.json({ error: '上传失败', detail: String(error) }, { status: 500 })
  }
}
