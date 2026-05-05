/**
 * 知识库 & 文档数据管理
 *
 * 使用 JSON 文件（data/db.json）持久化知识库和文档记录。
 * 每次操作都是"读 → 改 → 写"，适合单实例开发环境。
 * 生产环境建议替换为数据库（SQLite / PostgreSQL）。
 */

import type { KnowledgeBase, Document, Conversation, Favorite } from './types'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.resolve('data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

/** 数据库文件结构 */
interface DBData {
  knowledgeBases: KnowledgeBase[]
  documents: Document[]
  conversations: Conversation[]
  favorites: Favorite[]
  knowledgeBaseId: number
  documentsId: number
  conversationsId: number
  favoritesId: number
}

/** 从文件读取数据，文件不存在则返回初始结构 */
function loadDB(): DBData {
  if (!fs.existsSync(DB_FILE)) {
    return { knowledgeBases: [], documents: [], conversations: [], favorites: [], knowledgeBaseId: 1, documentsId: 0, conversationsId: 0, favoritesId: 0 }
  }
  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  // 向后兼容：旧数据没有新字段
  if (!data.conversations) data.conversations = []
  if (!data.favorites) data.favorites = []
  if (!data.conversationsId) data.conversationsId = 0
  if (!data.favoritesId) data.favoritesId = 0
  return data
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

  // ==================== 对话记录 ====================

  /** 获取对话列表（按更新时间倒序） */
  listConversations(kbId?: string | null): Conversation[] {
    const data = loadDB()
    let convs = data.conversations
    if (kbId) convs = convs.filter(c => c.kbId === kbId)
    return convs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  },

  /** 创建新对话 */
  createConversation(title: string, kbId: string | null): Conversation {
    const data = loadDB()
    const conv: Conversation = {
      id: 'conv_' + (++data.conversationsId),
      title,
      kbId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    data.conversations.push(conv)
    saveDB(data)
    return conv
  },

  /** 更新对话标题 */
  updateConversation(convId: string, title: string): Conversation | null {
    const data = loadDB()
    const conv = data.conversations.find(c => c.id === convId)
    if (!conv) return null
    conv.title = title
    conv.updatedAt = new Date().toISOString()
    saveDB(data)
    return conv
  },

  /** 删除对话 */
  deleteConversation(convId: string): void {
    const data = loadDB()
    data.conversations = data.conversations.filter(c => c.id !== convId)
    saveDB(data)
  },

  // ==================== 收藏节点 ====================

  /** 获取收藏列表 */
  listFavorites(kbId?: string | null): Favorite[] {
    const data = loadDB()
    let favs = data.favorites
    if (kbId) favs = favs.filter(f => f.kbId === kbId)
    return favs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  /** 添加收藏 */
  addFavorite(nodeId: string, nodeLabel: string, nodeType: string, kbId: string | null): Favorite {
    const data = loadDB()
    const exists = data.favorites.find(f => f.nodeId === nodeId && f.kbId === kbId)
    if (exists) return exists

    const fav: Favorite = {
      id: 'fav_' + (++data.favoritesId),
      nodeId,
      nodeLabel,
      nodeType,
      kbId,
      createdAt: new Date().toISOString(),
    }
    data.favorites.push(fav)
    saveDB(data)
    return fav
  },

  /** 取消收藏 */
  removeFavorite(favId: string): void {
    const data = loadDB()
    data.favorites = data.favorites.filter(f => f.id !== favId)
    saveDB(data)
  },
}
