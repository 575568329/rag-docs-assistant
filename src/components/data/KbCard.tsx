'use client'

import { useState, useEffect, useRef } from 'react'
import type { KnowledgeBase, Document } from '@/lib/types'
import Toast from '@/components/Toast'

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

  const createdAt = Number.isNaN(new Date(kb.createdAt).getTime())
    ? kb.createdAt
    : new Date(kb.createdAt).toLocaleString('zh-CN')
  const hasLoadedDocs = docs.length > 0 || kb.docCount === 0
  const totalChunks = docs.reduce((sum, doc) => sum + doc.chunkCount, 0)
  const getDownloadUrl = (doc: Document) => `/api/kb/${encodeURIComponent(kb.id)}/docs/${encodeURIComponent(doc.id)}/download`

  return (
    <div
      className={`bg-white border rounded-lg transition-all overflow-hidden ${
        isDragging ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 卡片主体 */}
      <div className="p-4">
        {/* 第一行：名称 + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{kb.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{kb.description || '暂无描述'}</p>
            <p className="text-xs text-gray-400 mt-1.5">
              创建于 {createdAt}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded">
              {kb.docCount} 文档
            </span>
            <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded">
              {hasLoadedDocs ? `${totalChunks} 切片` : '-- 切片'}
            </span>
          </div>
        </div>

        {/* 第三行：操作按钮 */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16" />
            </svg>
            {isUploading ? '上传中...' : '上传文档'}
          </button>
          <button
            onClick={onToggleDocs}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? '收起文档' : '查看文档'}
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors sm:ml-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16" />
            </svg>
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

        {/* 上传进度条 */}
        {isUploading && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>上传进度</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 展开的文档列表区 */}
      {expanded && (
        <div className="border-t border-gray-100 p-3">
          {docs.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded px-3 py-5 text-center">
              <p className="text-xs text-gray-500">暂无文档</p>
              <p className="text-xs text-gray-400 mt-1">上传 PDF、Word、Excel、TXT 或 Markdown 后开始构建知识库</p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* 表头 */}
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 font-medium">
                <span className="flex-1 min-w-0">文档名称</span>
                <span className="w-14 text-right flex-shrink-0">切片数</span>
                <span className="w-20 text-center flex-shrink-0 hidden sm:block">上传时间</span>
                <span className="w-16 flex-shrink-0" />
              </div>
              {/* 文档行 */}
              <div className="space-y-0.5">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex-1 min-w-0 text-sm text-gray-800 truncate" title={doc.filename}>
                      {doc.filename}
                    </span>
                    <span className="w-14 text-right flex-shrink-0 text-xs text-gray-500">
                      {doc.chunkCount}
                    </span>
                    <span className="w-20 text-center flex-shrink-0 text-xs text-gray-400 hidden sm:block truncate">
                      {doc.uploadedAt || '--'}
                    </span>
                    <div className="w-16 flex-shrink-0 flex items-center justify-end gap-1">
                      <a
                        href={getDownloadUrl(doc)}
                        className={`p-1 rounded transition-colors flex items-center justify-center ${
                          doc.hasFile ? 'text-gray-400 hover:text-blue-600' : 'text-gray-200 pointer-events-none'
                        }`}
                        title={doc.hasFile ? '下载文档' : '历史文档缺少原始文件'}
                        aria-disabled={!doc.hasFile}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v10m0 0l4-4m-4 4l-4-4M4 20h16" />
                        </svg>
                      </a>
                      <button
                        onClick={() => onDeleteDoc(doc.id)}
                        className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors flex items-center justify-center"
                        title="删除文档"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} status={toast.status} onClose={() => setToast(null)} />}
    </div>
  )
}
