'use client'

import { useMemo } from 'react'
import { getEntityConfig } from '@/lib/ui-constants'

interface NodeDetailProps {
  node: { id: string; label: string; type: string; properties?: Record<string, string | number | boolean> }
  edges: { target: string; label: string }[]
  onExpand: (nodeId: string) => void
  onClose: () => void
  onFavorite?: (nodeId: string, nodeLabel: string, nodeType: string) => void
  isFavorited?: boolean
}

export default function NodeDetail({ node, edges, onExpand, onClose, onFavorite, isFavorited }: NodeDetailProps) {
  const config = useMemo(() => getEntityConfig(node.type), [node.type])
  const kbId = typeof node.properties?.kbId === 'string' ? node.properties.kbId : undefined
  const docId = typeof node.properties?.docId === 'string' ? node.properties.docId : undefined
  const canDownload = node.type === 'Document' && kbId && docId

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 max-md:left-4 max-md:right-4 max-md:top-auto max-md:bottom-4 max-md:w-auto max-md:max-h-[60vh] bg-white border border-gray-200 shadow-lg overflow-y-auto transform transition-transform">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 break-words">{node.label}</h2>
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: config.color }}
            >
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {onFavorite && (
              <button
                onClick={() => onFavorite(node.id, node.label, node.type)}
                className={`p-2 rounded-lg transition-colors ${isFavorited ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500'}`}
                title={isFavorited ? '已收藏' : '收藏'}
              >
                <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )}
            {canDownload && (
              <a
                href={`/api/kb/${encodeURIComponent(kbId)}/docs/${encodeURIComponent(docId)}/download`}
                className="p-2 rounded-lg transition-colors text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                title="下载文件"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v10m0 0l4-4m-4 4l-4-4M4 20h16" />
                </svg>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="关闭"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {node.properties && Object.keys(node.properties).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">属性</h3>
              <dl className="space-y-2">
                {Object.entries(node.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start py-2 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-600">{key}</dt>
                    <dd className="text-sm text-gray-900 text-right ml-4 break-words">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {edges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                关联关系 ({edges.length})
              </h3>
              <ul className="space-y-2">
                {edges.map((edge, index) => (
                  <li key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{edge.target}</span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{edge.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => onExpand(node.id)}
            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            展开邻居
          </button>
        </div>
      </div>
    </div>
  )
}
