'use client'

import { useState } from 'react'
import type { SourceRef } from '@/lib/types'

interface SourceCardProps {
  sources: SourceRef[]
  expanded?: boolean
}

/** 根据分数返回对应的颜色样式 */
function getScoreStyle(score: number): string {
  if (score >= 0.8) return 'text-green-600 bg-green-50'
  if (score >= 0.6) return 'text-blue-600 bg-blue-50'
  return 'text-gray-500 bg-gray-100'
}

interface FileSource {
  key: string
  kbId?: string
  docId?: string
  filename: string
  knowledgeBaseName?: string
  score: number
}

function groupSourcesByFile(sources: SourceRef[]): FileSource[] {
  const fileMap = new Map<string, FileSource>()

  sources.forEach((source) => {
    const key = `${source.knowledgeBaseName ?? ''}::${source.filename}`
    const existing = fileMap.get(key)

    if (!existing || source.score > existing.score) {
      fileMap.set(key, {
        key,
        kbId: source.kbId,
        docId: source.docId,
        filename: source.filename,
        knowledgeBaseName: source.knowledgeBaseName,
        score: source.score,
      })
    }
  })

  return Array.from(fileMap.values()).sort((a, b) => b.score - a.score)
}

export default function SourceCard({ sources, expanded: initialExpanded = false }: SourceCardProps) {
  const [expanded, setExpanded] = useState(initialExpanded)

  if (!sources || sources.length === 0) return null

  const fileSources = groupSourcesByFile(sources)

  return (
    <div className="w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* 折叠/展开头部 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{expanded ? '收起来源' : `${fileSources.length} 个文件来源`}</span>
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 来源列表 */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2 border-t border-gray-100">
          {fileSources.map((source) => (
            <div
              key={source.key}
              className="flex items-center justify-between text-sm p-2 rounded-lg bg-white hover:bg-gray-50 transition-colors border-l-2 border-blue-400"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex-shrink-0 w-6 h-6 rounded bg-blue-600 text-white text-xs font-medium flex items-center justify-center">
                  文
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{source.filename}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {source.knowledgeBaseName || '当前知识库'}
                  </p>
                </div>
              </div>
              {source.kbId && source.docId && (
                <a
                  href={`/api/kb/${encodeURIComponent(source.kbId)}/docs/${encodeURIComponent(source.docId)}/download`}
                  className="flex-shrink-0 ml-3 p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                  title="下载文件"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v10m0 0l4-4m-4 4l-4-4M4 20h16" />
                  </svg>
                </a>
              )}
              <span className={`flex-shrink-0 ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${getScoreStyle(source.score)}`}>
                {source.score.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
