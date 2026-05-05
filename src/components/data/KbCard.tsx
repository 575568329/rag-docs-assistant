'use client'

import { useState, useEffect, useRef } from 'react'
import type { KnowledgeBase, Document } from '@/lib/types'
import Toast from '@/components/Toast'

/** 文件扩展名 → 图标颜色 */
const FILE_COLORS: Record<string, string> = {
  xlsx: '#22c55e', pdf: '#ef4444', docx: '#3b82f6',
  txt: '#6b7280', md: '#8b5cf6',
}

function getFileColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return FILE_COLORS[ext] || '#6b7280'
}

/** 文件类型 SVG 图标 */
function FileIcon({ filename }: { filename: string }) {
  const color = getFileColor(filename)
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" />
      <path d="M14 2v6h6" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

interface KbCardProps {
  kb: KnowledgeBase
  docs: Document[]
  expanded: boolean
  uploadProgress: number
  onToggleDocs: () => void
  onUpload: (file: File) => void
  onDelete: () => void
  onDeleteDoc: (docId: string) => void
}

export default function KbCard({
  kb,
  docs,
  expanded,
  uploadProgress,
  onToggleDocs,
  onUpload,
  onDelete,
  onDeleteDoc,
}: KbCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; status: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    e.target.value = ''
  }

  const handleUpload = (file: File) => {
    const validExtensions = ['.txt', '.md', '.pdf', '.docx', '.xlsx']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validExtensions.includes(ext)) {
      setToast({ message: '不支持的文件类型，请上传 .txt, .md, .pdf, .docx, .xlsx 文件', status: 'error' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: '文件大小不能超过 10MB', status: 'error' })
      return
    }
    setIsUploading(true)
    onUpload(file)
  }

  useEffect(() => {
    if (uploadProgress === 100) {
      setTimeout(() => setIsUploading(false), 500)
    }
  }, [uploadProgress])

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-5 transition-all ${
        isDragging ? 'border-2 border-blue-500' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{kb.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{kb.description || '暂无描述'}</p>
        </div>
        <span className="text-sm text-gray-600">{kb.docCount} 篇文档</span>
      </div>
      <div className="text-xs text-gray-400 mb-4">
        创建于 {new Date(kb.createdAt).toLocaleString('zh-CN')}
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? '上传中...' : '上传文档'}
        </button>
        <button
          onClick={onToggleDocs}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {expanded ? '收起列表' : '文档列表'}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          删除
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf,.docx,.xlsx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {isUploading && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">上传进度: {uploadProgress}%</div>
        </div>
      )}

      {expanded && (
        <div className="border-t pt-3 space-y-2">
          {docs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无文档</p>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
              >
                <FileIcon filename={doc.filename} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{doc.filename}</div>
                  <div className="text-xs text-gray-400">
                    {doc.chunkCount} 切片{doc.uploadedAt ? ` · ${doc.uploadedAt} 上传` : ''}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteDoc(doc.id)}
                  className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                  title="删除文档"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} status={toast.status} onClose={() => setToast(null)} />}
    </div>
  )
}
