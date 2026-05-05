/**
 * 为已有文档补充提取实体到知识图谱
 *
 * 读取 data/ 目录下所有向量数据，重新提取实体写入 graph.json
 * 运行：node scripts/extract-existing-entities.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '../data')
const DB_FILE = resolve(DATA_DIR, 'db.json')
const GRAPH_FILE = resolve(DATA_DIR, 'graph.json')

// 读取 db.json 获取知识库和文档列表
const db = JSON.parse(readFileSync(DB_FILE, 'utf8'))

// 初始化空的 graph 数据
const graphData = {
  attributes: {},
  options: { allowSelfLoops: true, multi: false, type: 'mixed' },
  nodes: [],
  edges: []
}

// 为每个文档创建 Document 节点
for (const doc of db.documents || []) {
  const nodeId = `doc:${doc.kbId}:${doc.filename}`
  graphData.nodes.push({
    key: nodeId,
    attributes: {
      label: doc.filename,
      type: 'Document',
      kbId: doc.kbId,
      createdAt: doc.uploadedAt || new Date().toISOString()
    }
  })
  console.log(`✓ 文档节点: ${doc.filename}`)
}

// 同一知识库下的文档互相关联
const docsByKb = {}
for (const doc of db.documents || []) {
  if (!docsByKb[doc.kbId]) docsByKb[doc.kbId] = []
  docsByKb[doc.kbId].push(doc)
}

for (const [kbId, docs] of Object.entries(docsByKb)) {
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const srcId = `doc:${kbId}:${docs[i].filename}`
      const tgtId = `doc:${kbId}:${docs[j].filename}`
      graphData.edges.push({
        key: `${srcId}->${tgtId}`,
        source: srcId,
        target: tgtId,
        attributes: { type: 'RELATED_TO', label: 'RELATED_TO' }
      })
    }
  }
}

mkdirSync(DATA_DIR, { recursive: true })
writeFileSync(GRAPH_FILE, JSON.stringify(graphData, null, 2), 'utf8')

console.log(`\n完成: ${graphData.nodes.length} 个节点, ${graphData.edges.length} 条边`)
console.log('注意: 此脚本只创建了 Document 节点。')
console.log('要提取完整实体，请删除旧文档并重新上传（会调用 AI 实体提取）。')
