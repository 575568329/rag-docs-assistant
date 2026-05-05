'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getEntityConfig } from '@/lib/ui-constants'

interface KnowledgeBase {
  id: string
  name: string
  docCount?: number
}

interface Conversation {
  id: string
  title: string
  kbId: string | null
  createdAt: string
  updatedAt: string
}

interface Favorite {
  id: string
  nodeId: string
  nodeLabel: string
  nodeType: string
  kbId: string | null
  createdAt: string
}

interface PlatformLayoutProps {
  children: React.ReactNode
}

/** 带 Suspense 的布局入口 */
export default function PlatformLayout({ children }: PlatformLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-white text-gray-400">
          加载中...
        </div>
      }
    >
      <PlatformShell>{children}</PlatformShell>
    </Suspense>
  )
}

/** 实际布局逻辑（在 Suspense 内部，安全使用 useSearchParams） */
function PlatformShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeKbId = searchParams.get('kbId')

  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activePage = pathname.split('/').pop() || 'chat'

  const fetchKnowledgeBases = useCallback(() => {
    return fetch('/api/kb')
      .then(res => {
        if (!res.ok) throw new Error('获取知识库列表失败')
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) setKnowledgeBases(data)
      })
      .catch(err => console.error('获取知识库列表失败:', err))
  }, [])

  // 加载知识库列表，并监听数据页创建/删除/上传后的刷新通知
  useEffect(() => {
    fetchKnowledgeBases()
    window.addEventListener('knowledge-bases-changed', fetchKnowledgeBases)
    return () => window.removeEventListener('knowledge-bases-changed', fetchKnowledgeBases)
  }, [fetchKnowledgeBases])

  // 加载对话历史（仅对话页）
  useEffect(() => {
    if (activePage !== 'chat') return
    const params = new URLSearchParams()
    if (activeKbId) params.set('kbId', activeKbId)
    fetch(`/api/chat/history?${params}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setConversations(data) })
      .catch(err => console.error('获取对话历史失败:', err))
  }, [activePage, activeKbId])

  // 加载收藏列表（仅图谱页）
  useEffect(() => {
    if (activePage !== 'graph') return
    const params = new URLSearchParams()
    if (activeKbId) params.set('kbId', activeKbId)
    fetch(`/api/graph/favorites?${params}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setFavorites(data) })
      .catch(err => console.error('获取收藏列表失败:', err))
  }, [activePage, activeKbId])

  const navigateTo = (page: string) => {
    const params = activeKbId ? `?kbId=${activeKbId}` : ''
    router.push(`/${page}${params}`)
    setSidebarOpen(false)
  }

  const handleKbSelect = (kbId: string | null) => {
    const params = kbId ? `?kbId=${kbId}` : ''
    router.push(`${pathname}${params}`)
    setSidebarOpen(false)
  }

  const handleCreateKbClick = () => {
    window.dispatchEvent(new Event('open-create-kb-dialog'))
    setSidebarOpen(false)
  }

  const handleNewChat = useCallback(async () => {
    const title = '新对话 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    try {
      const res = await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, kbId: activeKbId || null }),
      })
      if (res.ok) {
        const conv = await res.json()
        setConversations(prev => [conv, ...prev])
        // 刷新页面清空对话
        window.location.reload()
      }
    } catch {
      window.location.reload()
    }
  }, [activeKbId])

  const handleDeleteConv = useCallback(async (convId: string) => {
    try {
      await fetch(`/api/chat/history?convId=${convId}`, { method: 'DELETE' })
      setConversations(prev => prev.filter(c => c.id !== convId))
    } catch { /* ignore */ }
  }, [])

  const handleRemoveFav = useCallback(async (favId: string) => {
    try {
      await fetch(`/api/graph/favorites?favId=${favId}`, { method: 'DELETE' })
      setFavorites(prev => prev.filter(f => f.id !== favId))
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部导航栏 */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="切换侧边栏"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 hidden sm:inline">智能知识管理平台</span>
        </div>
        <nav className="flex gap-1">
          {(['chat', 'data', 'graph'] as const).map(page => (
            <button
              key={page}
              onClick={() => navigateTo(page)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activePage === page
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {{ chat: '对话', data: '数据', graph: '图谱' }[page]}
            </button>
          ))}
        </nav>
      </header>

      {/* 主体内容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 移动端侧边栏遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* 左侧侧边栏 */}
        <aside className={`fixed left-0 top-14 bottom-0 md:static md:top-auto md:bottom-auto z-40 w-60 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0 transform transition-transform md:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          {/* 功能按钮区 */}
          <div className="p-4">
            {activePage === 'chat' ? (
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新对话
              </button>
            ) : activePage === 'data' ? (
              <button
                onClick={handleCreateKbClick}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建知识库
              </button>
            ) : null}
          </div>

          {/* 知识库选择区 */}
          <div className="px-2">
            <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">知识库</div>
          </div>
          <nav className="px-2 space-y-0.5">
            <button
              onClick={() => handleKbSelect(null)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                !activeKbId ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部
            </button>
            {knowledgeBases.map(kb => (
              <button
                key={kb.id}
                onClick={() => handleKbSelect(kb.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  activeKbId === kb.id ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="block truncate">{kb.name}</span>
                <span className="block text-xs text-gray-400 mt-0.5">{kb.docCount ?? 0} 文档</span>
              </button>
            ))}
          </nav>

          {/* 历史对话区（仅对话页） */}
          {activePage === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 mt-2">
              <div className="px-4 py-1.5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">历史对话</span>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                {conversations.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-gray-400">暂无对话记录</p>
                ) : (
                  conversations.map(conv => (
                    <div key={conv.id} className="group flex items-center gap-1 mb-0.5">
                      <button
                        className="flex-1 text-left px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 truncate transition-colors"
                      >
                        {conv.title}
                      </button>
                      <button
                        onClick={() => handleDeleteConv(conv.id)}
                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="删除对话"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 收藏区（仅图谱页） */}
          {activePage === 'graph' && (
            <div className="flex-1 flex flex-col min-h-0 mt-2">
              <div className="px-4 py-1.5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">收藏节点</span>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                {favorites.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-gray-400">暂无收藏</p>
                ) : (
                  favorites.map(fav => {
                    const config = getEntityConfig(fav.nodeType)
                    return (
                      <div key={fav.id} className="group flex items-center gap-2 mb-0.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: config.color }}
                        />
                        <button
                          className="flex-1 text-left px-1 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 truncate transition-colors"
                        >
                          {fav.nodeLabel}
                        </button>
                        <button
                          onClick={() => handleRemoveFav(fav.id)}
                          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          title="取消收藏"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* 数据页不需要额外区域，知识库列表占满 */}
          {activePage === 'data' && <div className="flex-1" />}
        </aside>

        {/* 右侧内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
