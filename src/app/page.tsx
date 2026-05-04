/**
 * 首页 — 知识库管理
 *
 * 功能：
 * 1. 知识库列表展示（含文档数量）
 * 2. 创建 / 删除知识库
 * 3. 文档上传（带进度条）
 * 4. 文档列表展开 / 单个文档删除
 * 5. 点击卡片进入对话页
 */

'use client'

import { useEffect, useState } from 'react'
import type { KnowledgeBase, Document } from '@/lib/types'
import ChatPanel from '@/components/ChatPanel'
import Toast from '@/components/Toast'

export default function Home() {
  /* ========== 状态管理 ========== */

  /** 知识库列表 */
  const [list, setList] = useState<KnowledgeBase[]>([])
  /** 创建表单字段 */
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)
  /** 当前打开对话的知识库 ID */
  const [activeKbId, setActiveKbId] = useState<string | null>(null)
  /** 上传进度：{ [kbId]: 百分比 }，每个知识库独立追踪 */
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  /** 列表加载状态 */
  const [loading, setLoading] = useState(true)
  /** Toast 通知 */
  const [toast, setToast] = useState<{ message: string; status: 'success' | 'error' } | null>(null)
  /** 当前展开文档列表的知识库 ID */
  const [expandedKb, setExpandedKb] = useState<string | null>(null)
  /** 文档列表缓存：{ [kbId]: Document[] } */
  const [docsMap, setDocsMap] = useState<Record<string, Document[]>>({})

  /* ========== 数据请求 ========== */

  /** 获取知识库列表 */
  async function getList() {
    setLoading(true)
    const res = await fetch('/api/kb')
    setList(await res.json())
    setLoading(false)
  }

  /** 加载指定知识库的文档列表 */
  async function loadDocs(kbId: string) {
    const res = await fetch(`/api/kb/${kbId}/docs`)
    const docs = await res.json()
    setDocsMap(prev => ({ ...prev, [kbId]: docs }))
  }

  /* ========== 知识库操作 ========== */

  /** 创建知识库 */
  async function handleCreate() {
    const res = await fetch('/api/kb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    })
    if (res.ok) {
      setName('')
      setDescription('')
      setShowForm(false)
      getList()
    }
  }

  /** 删除知识库（同时清理文档和向量数据） */
  async function handleDelete(id: string) {
    const res = await fetch(`/api/kb/${id}`, { method: 'DELETE' })
    if (res.ok) getList()
  }

  /* ========== 文档操作 ========== */

  /** 删除单个文档（清理 db 记录 + 向量数据） */
  async function handleDeleteDoc(kbId: string, docId: string) {
    const res = await fetch(`/api/kb/${kbId}/docs`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId })
    })
    if (res.ok) {
      setToast({ message: '文档已删除', status: 'success' })
      loadDocs(kbId)
      getList()
    } else {
      setToast({ message: '删除失败', status: 'error' })
    }
  }

  /**
   * 上传文档（使用 XHR 以支持进度监听）
   * fetch 不支持 upload.onprogress，所以用 XMLHttpRequest
   */
  function handleUpload(id: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    // 监听上传进度
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(prev => ({ ...prev, [id]: Math.round((e.loaded / e.total) * 100) }))
      }
    }

    // 请求完成回调
    xhr.onload = () => {
      if (xhr.status === 200) {
        setToast({ message: '上传成功', status: 'success' })
        getList()
        if (expandedKb === id) loadDocs(id)
      } else {
        setToast({ message: '上传失败', status: 'error' })
      }
      setUploadProgress(prev => ({ ...prev, [id]: 0 }))
    }

    xhr.open('POST', `/api/kb/${id}/upload`)
    xhr.send(formData)
  }

  /** 展开/折叠文档列表（首次展开时自动加载数据） */
  function toggleDocs(kbId: string) {
    if (expandedKb === kbId) {
      setExpandedKb(null)
    } else {
      setExpandedKb(kbId)
      if (!docsMap[kbId]) loadDocs(kbId)
    }
  }

  /* ========== 生命周期 ========== */

  useEffect(() => { getList() }, [])

  /* ========== 渲染 ========== */

  // 对话页视图
  if (activeKbId) {
    return <ChatPanel kbId={activeKbId} onBack={() => setActiveKbId(null)} />
  }

  // 知识库列表视图
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {toast && <Toast message={toast.message} status={toast.status} onClose={() => setToast(null)} />}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">AI 知识库问答系统</h1>

        {/* 创建知识库按钮 */}
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 创建知识库
        </button>

        {/* 创建表单 */}
        {showForm && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="知识库名称"
              className="w-full mb-3 px-3 py-2 border rounded"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="描述（可选）"
              className="w-full mb-3 px-3 py-2 border rounded"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                确认创建
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                取消
              </button>
            </div>
          </div>
        )}

        {/* 三态渲染：加载中 / 空列表 / 卡片列表 */}
        {loading ? (
          <p className="text-center text-gray-400 mt-12">加载中...</p>
        ) : list.length === 0 ? (
          <p className="text-center text-gray-400 mt-12">还没有知识库，点击上方按钮创建</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map(kb => (
              <div
                key={kb.id}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveKbId(kb.id)}
              >
                {/* 知识库基本信息 */}
                <h2 className="text-lg font-semibold text-gray-900">{kb.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{kb.description || '暂无描述'}</p>
                <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
                  <span>{kb.docCount} 篇文档</span>
                  <span>{kb.createdAt}</span>
                </div>

                {/* 操作按钮 */}
                <div className="mt-3 flex gap-2">
                  <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                    开始对话
                  </button>
                  {/* 上传按钮：label 包裹隐藏 input，stopPropagation 防止冒泡到卡片 */}
                  <label
                    className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {uploadProgress[kb.id] ? `上传中 ${uploadProgress[kb.id]}%` : '上传文档'}
                    <input
                      type="file"
                      accept=".txt,.md"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(kb.id, file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleDocs(kb.id) }}
                    className="px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                  >
                    文档列表
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(kb.id) }}
                    className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    删除
                  </button>
                </div>

                {/* 展开的文档列表 */}
                {expandedKb === kb.id && (
                  <div className="mt-3 border-t pt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                    {docsMap[kb.id]?.length ? docsMap[kb.id].map(doc => (
                      <div key={doc.id} className="flex justify-between items-center text-sm text-gray-600">
                        <span>{doc.filename}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{doc.chunkCount} 切片</span>
                          <button
                            onClick={() => handleDeleteDoc(kb.id, doc.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-400">暂无文档</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
