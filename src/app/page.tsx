'use client'

import { useEffect, useState } from 'react'
import type { KnowledgeBase } from '@/lib/types'
import ChatPanel from '@/components/ChatPanel'

export default function Home() {
  const [list, setList] = useState<KnowledgeBase[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeKbId, setActiveKbId] = useState<string | null>(null)

  async function getList() {
    const res = await fetch('/api/kb')
    setList(await res.json())
  }

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

  async function handleDelete(id: string) {
    const res = await fetch(`/api/kb/${id}`, { method: 'DELETE' })
    if (res.ok) getList()
  }

  async function handleUpload(id: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/kb/${id}/upload`, { method: 'POST', body: formData })
    if (res.ok) {
      alert('上传成功')
      getList()
    } else {
      alert('上传失败')
    }
  }

  useEffect(() => { getList() }, [])

  if (activeKbId) {
    return <ChatPanel kbId={activeKbId} onBack={() => setActiveKbId(null)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">AI 知识库问答系统</h1>

        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 创建知识库
        </button>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(kb => (
            <div
              key={kb.id}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setActiveKbId(kb.id)}
            >
              <h2 className="text-lg font-semibold text-gray-900">{kb.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{kb.description || '暂无描述'}</p>
              <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
                <span>{kb.docCount} 篇文档</span>
                <span>{kb.createdAt}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                  开始对话
                </button>
                <label
                  className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  上传文档
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
                  onClick={(e) => { e.stopPropagation(); handleDelete(kb.id) }}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        {list.length === 0 && (
          <p className="text-center text-gray-400 mt-12">还没有知识库，点击上方按钮创建</p>
        )}
      </div>
    </div>
  )
}
