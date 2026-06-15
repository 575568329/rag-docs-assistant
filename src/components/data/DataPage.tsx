'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { KnowledgeBase, Document } from '@/lib/types'
import KbCard from './KbCard'
import CreateKbDialog from './CreateKbDialog'
import Toast from '@/components/Toast'
import { apiPath } from '@/lib/api'

interface DataPageProps {
  kbId?: string | null
}

export default function DataPage({ kbId }: DataPageProps) {
  const router = useRouter()
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [docsMap, setDocsMap] = useState<Record<string, Document[]>>({})
  const [expandedKb, setExpandedKb] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; status: 'success' | 'error' } | null>(null)

  const fetchKbs = async () => {
    try {
      const res = await fetch(apiPath('/api/kb'))
      if (!res.ok) throw new Error('获取知识库列表失败')
      const data = await res.json()
      setKbs(data)
    } catch (err) {
      showToast('获取知识库列表失败', 'error')
    }
  }

  const fetchDocs = async (kbId: string) => {
    try {
      const res = await fetch(apiPath(`/api/kb/${kbId}/docs`))
      if (!res.ok) throw new Error('获取文档列表失败')
      const data = await res.json()
      setDocsMap((prev) => ({ ...prev, [kbId]: data }))
    } catch (err) {
      showToast('获取文档列表失败', 'error')
    }
  }

  const handleCreateKb = async (name: string, description: string) => {
    try {
      const res = await fetch(apiPath('/api/kb'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) throw new Error('创建知识库失败')
      const created = await res.json() as KnowledgeBase | null
      await fetchKbs()
      window.dispatchEvent(new Event('knowledge-bases-changed'))
      if (created?.id) {
        setExpandedKb(created.id)
        router.push(`/data?kbId=${created.id}`)
      }
      showToast('知识库创建成功', 'success')
    } catch (err) {
      showToast('创建知识库失败', 'error')
    }
  }

  const handleDeleteKb = async (targetKbId: string) => {
    if (!confirm('确定要删除这个知识库吗？')) return
    try {
      const res = await fetch(apiPath(`/api/kb/${targetKbId}`), { method: 'DELETE' })
      if (!res.ok) throw new Error('删除知识库失败')
      await fetchKbs()
      window.dispatchEvent(new Event('knowledge-bases-changed'))
      if (targetKbId === expandedKb) setExpandedKb(null)
      if (targetKbId === kbId) {
        router.push('/data')
      }
      setDocsMap((prev) => {
        const { [targetKbId]: _, ...rest } = prev
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
        window.dispatchEvent(new Event('knowledge-bases-changed'))
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

    xhr.open('POST', apiPath(`/api/kb/${kbId}/upload`))
    xhr.send(formData)
  }

  const handleDeleteDoc = async (kbId: string, docId: string) => {
    if (!confirm('确定要删除这个文档吗？')) return
    try {
      const res = await fetch(apiPath(`/api/kb/${kbId}/docs`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId }),
      })
      if (!res.ok) throw new Error('删除文档失败')
      await fetchDocs(kbId)
      await fetchKbs()
      window.dispatchEvent(new Event('knowledge-bases-changed'))
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
    const openDialog = () => setIsDialogOpen(true)
    window.addEventListener('open-create-kb-dialog', openDialog)
    return () => window.removeEventListener('open-create-kb-dialog', openDialog)
  }, [])

  useEffect(() => {
    if (kbId && kbs.find((kb) => kb.id === kbId)) {
      fetchDocs(kbId)
      setExpandedKb(kbId)
    }
  }, [kbId, kbs])

  const displayKbs = kbId ? kbs.filter((kb) => kb.id === kbId) : kbs

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">数据管理</h1>
            <p className="text-sm text-gray-500 mt-1">
              管理知识库、上传文档并查看处理状态
            </p>
          </div>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建知识库
          </button>
        </div>

        {displayKbs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-4">暂无知识库</p>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建第一个知识库
            </button>
          </div>
        ) : (
          <div className="space-y-3">
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
