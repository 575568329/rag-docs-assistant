'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { getEntityConfig } from '@/lib/ui-constants'

interface GraphSearchProps {
  onSearch: (query: string) => void
  results?: Array<{ id: string; label: string; type: string; edgeCount: number }>
  onSelect: (nodeId: string) => void
  loading?: boolean
}

export default function GraphSearch({ onSearch, results = [], onSelect, loading }: GraphSearchProps) {
  const [active, setActive] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Ctrl+K 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setActive(prev => !prev)
      }
      if (e.key === 'Escape') {
        setActive(false)
        setQuery('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 激活时自动聚焦输入框
  useEffect(() => {
    if (active) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [active])

  // 防抖搜索
  useEffect(() => {
    if (!active) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onSearch(query), 300)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [query, active, onSearch])

  // 点击外部关闭
  useEffect(() => {
    if (!active) return
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setActive(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [active])

  const handleResultClick = useCallback((nodeId: string) => {
    onSelect(nodeId)
    setActive(false)
    setQuery('')
  }, [onSelect])

  // 触发器（默认态）
  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm hover:border-gray-300 hover:shadow transition-all text-sm"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-gray-400">搜索图谱节点...</span>
        <kbd className="ml-4 px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">Ctrl+K</kbd>
      </button>
    )
  }

  // 激活态：搜索面板
  return (
    <div ref={panelRef} className="absolute top-4 left-4 z-20 w-96 max-w-[calc(100%-2rem)]">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* 输入框 */}
        <div className="flex items-center px-4 border-b border-gray-100">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索图谱节点..."
            className="flex-1 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          )}
          <button
            onClick={() => { setActive(false); setQuery('') }}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 结果列表 */}
        {query.length > 0 && (
          <div className="max-h-72 overflow-y-auto">
            {results.length === 0 && !loading && (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">无匹配结果</div>
            )}
            {results.map((result) => {
              const config = getEntityConfig(result.type)
              return (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">{result.label}</span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-xs flex-shrink-0"
                      style={{ backgroundColor: config.color + '15', color: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{result.edgeCount} 关联</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
