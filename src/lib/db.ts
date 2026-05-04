/**
 * 知识库 & 文档数据管理
 *
 * 使用 JSON 文件（data/db.json）持久化知识库和文档记录。
 * 每次操作都是"读 → 改 → 写"，适合单实例开发环境。
 * 生产环境建议替换为数据库（SQLite / PostgreSQL）。
 */

import type { KnowledgeBase, Document } from './types'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.resolve('data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

/** 数据库文件结构 */
interface DBData {
  knowledgeBases: KnowledgeBase[]
  documents: Document[]
  knowledgeBaseId: number
  documentsId: number
}

/** 从文件读取数据，文件不存在则返回初始结构 */
function loadDB(): DBData {
  if (!fs.existsSync(DB_FILE)) {
    return { knowledgeBases: [], documents: [], knowledgeBaseId: 1, documentsId: 0 }
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
}

/** 将数据写入文件（自动创建目录） */
function saveDB(data: DBData): void {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8')
}

/** 系统内置的默认知识库 */
const DEFAULT_KB: KnowledgeBase = {
  id: 'know_0',
  name: '默认知识库',
  description: '系统默认知识库，可直接上传文档使用',
  docCount: 0,
  createdAt: new Date().toLocaleString(),
}

export const db = {

  /** 获取所有知识库列表（含文档数量统计） */
  listKB(): (KnowledgeBase & { docCount: number })[] {
    const data = loadDB()
    const bases = data.knowledgeBases.length ? data.knowledgeBases : [DEFAULT_KB]

    return bases.map(kb => ({
      ...kb,
      docCount: data.documents.filter(doc => doc.kbId === kb.id).length,
    }))
  },

  /** 创建新知识库 */
  createKB(name: string, description: string) {
    const data = loadDB()
    const kb: KnowledgeBase = {
      id: 'know_' + data.knowledgeBaseId,
      name,
      description,
      docCount: 0,
      createdAt: new Date().toLocaleString(),
    }
    data.knowledgeBases.push(kb)
    data.knowledgeBaseId++
    saveDB(data)

    return this.listKB().find(k => k.id === kb.id) ?? null
  },

  /** 删除知识库及其下所有文档记录 */
  deleteKB(id: string): void {
    const data = loadDB()
    data.knowledgeBases = data.knowledgeBases.filter(kb => kb.id !== id)
    data.documents = data.documents.filter(doc => doc.kbId !== id)
    saveDB(data)
  },

  /** 获取指定知识库下的文档列表 */
  listDocs(kbId: string): Document[] {
    const data = loadDB()
    return data.documents.filter(doc => doc.kbId === kbId)
  },

  /** 添加文档记录 */
  addDoc(kbId: string, filename: string, chunkCount: number, chunkIds?: string[]): Document {
    const data = loadDB()
    const doc: Document = {
      id: 'doc_' + data.documentsId,
      kbId,
      filename,
      chunkCount,
      uploadedAt: new Date().toLocaleDateString(),
      chunkIds,
    }
    data.documents.push(doc)
    data.documentsId++
    saveDB(data)
    return doc
  },

  /** 删除指定知识库下的所有文档记录 */
  deleteDocs(kbId: string): void {
    const data = loadDB()
    data.documents = data.documents.filter(doc => doc.kbId !== kbId)
    saveDB(data)
  },

  /**
   * 删除单个文档记录并返回被删除的文档对象
   * 返回值用于获取 chunkIds，以便同步清理向量数据
   */
  deleteDoc(docId: string): Document | null {
    const data = loadDB()
    const idx = data.documents.findIndex(doc => doc.id === docId)
    if (idx === -1) return null
    const [doc] = data.documents.splice(idx, 1)
    saveDB(data)
    return doc
  },
}
