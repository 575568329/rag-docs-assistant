'use client'

import { useState, useEffect } from 'react'
import type { KnowledgeBase, Document } from '@/lib/types'
import KbCard from './KbCard'
import CreateKbDialog from './CreateKbDialog'
import Toast from '@/components/Toast'

interface DataPageProps {
  kbId?: string | null
}

export default function DataPage({ kbId }: DataPageProps) {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [docsMap, setDocsMap] = useState<Record<string, Document[]>>({})
  const [expandedKb, setExpandedKb] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; status: 'success' | 'error' } | null>(null)

  const fetchKbs = async () => {
    try {
      const res = await fetch('/api/kb')
      if (!res.ok) throw new Error('获取知识库列表失败')
      const data = await res.json()
      setKbs(data)
    } catch (err) {
      showToast('获取知识库列表失败', 'error')
    }
  }

  const fetchDocs = async (kbId: string) => {
    try {
      const res = await fetch(`/api/kb/${kbId}/docs`)
      if (!res.ok) throw new Error('获取文档列表失败')
      const data = await res.json()
      setDocsMap((prev) => ({ ...prev, [kbId]: data }))
    } catch (err) {
      showToast('获取文档列表失败', 'error')
    }
  }

  const handleCreateKb = async (name: string, description: string) => {
    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) throw new Error('创建知识库失败')
      await fetchKbs()
      showToast('知识库创建成功', 'success')
    } catch (err) {
      showToast('创建知识库失败', 'error')
    }
  }

  const handleDeleteKb = async (kbId: string) => {
    if (!confirm('确定要删除这个知识库吗？')) return
    try {
      const res = await fetch(`/api/kb/${kbId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除知识库失败')
      await fetchKbs()
      setDocsMap((prev) => {
        const { [kbId]: _, ...rest } = prev
        return rest
      })
      showToast('知识库删除成功', 'success')
    } catch (err) {
      showToast('删除知识库失败', 'error')
    }
  }

  const handleUploadDoc = async (kbId: string, file: File) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100)
        setUploadProgress((prev) => ({ ...prev, [kbId]: progress }))
      }
    })

    xhr.addEventListener('load', async () => {
      if (xhr.status === 200) {
        await fetchKbs()
        await fetchDocs(kbId)
        setUploadProgress((prev) => {
          const { [kbId]: _, ...rest } = prev
          return rest
        })
        showToast('文档上传成功', 'success')
      } else {
        showToast('文档上传失败', 'error')
        setUploadProgress((prev) => {
          const { [kbId]: _, ...rest } = prev
          return rest
        })
      }
    })

    xhr.addEventListener('error', () => {
      showToast('文档上传失败', 'error')
      setUploadProgress((prev) => {
        const { [kbId]: _, ...rest } = prev
        return rest
      })
    })

    xhr.open('POST', `/api/kb/${kbId}/upload`)
    xhr.send(formData)
  }

  const handleDeleteDoc = async (kbId: string, docId: string) => {
    if (!confirm('确定要删除这个文档吗？')) return
    try {
      const res = await fetch(`/api/kb/${kbId}/docs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId }),
      })
      if (!res.ok) throw new Error('删除文档失败')
      await fetchDocs(kbId)
      await fetchKbs()
      showToast('文档删除成功', 'success')
    } catch (err) {
      showToast('删除文档失败', 'error')
    }
  }

  const showToast = (message: string, status: 'success' | 'error') => {
    setToast({ message, status })
  }

  useEffect(() => {
    fetchKbs()
  }, [])

  useEffect(() => {
    if (kbId && kbs.find((kb) => kb.id === kbId)) {
      fetchDocs(kbId)
      setExpandedKb(kbId)
    }
  }, [kbId, kbs])

  const displayKbs = kbId ? kbs.filter((kb) => kb.id === kbId) : kbs

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">数据管理</h1>
        </div>

        {displayKbs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">暂无知识库，点击左侧按钮创建</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayKbs.map((kb) => (
              <KbCard
                key={kb.id}
                kb={kb}
                docs={docsMap[kb.id] || []}
                expanded={expandedKb === kb.id}
                uploadProgress={uploadProgress[kb.id] || 0}
                onToggleDocs={async () => {
                  if (expandedKb === kb.id) {
                    setExpandedKb(null)
                  } else {
                    setExpandedKb(kb.id)
                    await fetchDocs(kb.id)
                  }
                }}
                onUpload={(file) => handleUploadDoc(kb.id, file)}
                onDelete={() => handleDeleteKb(kb.id)}
                onDeleteDoc={(docId) => handleDeleteDoc(kb.id, docId)}
              />
            ))}
          </div>
        )}

        <CreateKbDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onCreate={handleCreateKb}
        />

        {toast && (
          <Toast
            message={toast.message}
            status={toast.status}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}
