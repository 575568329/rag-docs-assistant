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

export default function SourceCard({ sources, expanded: initialExpanded = false }: SourceCardProps) {
  const [expanded, setExpanded] = useState(initialExpanded)

  if (!sources || sources.length === 0) return null

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
          <span>{expanded ? '收起来源' : `${sources.length} 个来源`}</span>
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
          {sources.map((source) => (
            <div
              key={source.index}
              className="flex items-center justify-between text-sm p-2 rounded-lg bg-white hover:bg-gray-50 transition-colors border-l-2 border-blue-400"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex-shrink-0 w-6 h-6 rounded bg-blue-600 text-white text-xs font-medium flex items-center justify-center">
                  {source.index}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{source.heading || source.filename}</p>
                  <p className="text-xs text-gray-400 truncate">{source.filename}</p>
                </div>
              </div>
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
