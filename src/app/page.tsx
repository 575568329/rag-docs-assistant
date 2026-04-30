'use client'

import { useEffect, useState } from 'react'
import type { KnowledgeBase } from '@/lib/types'

export default function Home() {
  const [list, setList] = useState<KnowledgeBase[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function getList() {
    const res = await fetch('/api/kb')
    setList(await res.json())
  }

  // TODO: 你来实现创建知识库
  async function handleCreate() {
    // 1. fetch POST /api/kb，传 { name, description }
    // 2. 成功后清空表单、关闭弹窗、刷新列表
    const params = {name,description}
    const res = await fetch('/api/kb',{
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    if (res.ok) {
      setName('')
      setDescription('')
      setShowForm(false)
      getList()
    }
  }

  // TODO: 你来实现删除知识库
  async function handleDelete(id: string) {
    // 1. fetch DELETE /api/kb/${id}
    // 2. 成功后刷新列表
    const res = await fetch(`/api/kb/${id}`,{
      method:'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      getList()
    }
  }

  useEffect(() => {
    getList()
  }, [])

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
            <div key={kb.id} className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900">{kb.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{kb.description || '暂无描述'}</p>
              <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
                <span>{kb.docCount} 篇文档</span>
                <span>{kb.createdAt}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                  查看详情
                </button>
                <button
                  onClick={() => handleDelete(kb.id)}
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
