'use client'

import { usePathname } from "next/navigation"
import Link from 'next/link'

export default function PlatformLayout({
  children
}:{
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: '对话', path: '/chat' },
    { name: '数据', path: '/data' },
    { name: '图谱', path: '/graph' },
  ]

  return(
    <div className="h-screen flex flex-col">
      {/* 顶部导航 */}
      <header className="h-16 border-b bg-white flex items-center px-6">
        <h1 className="text-xl font-bold mr-8">RAG 知识管理平台</h1>
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              href={tab.path}
              className={`px-4 py-2 rounded transition-colors ${
                pathname === tab.path
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 */}
        <aside className="w-64 bg-gray-50 border-r p-4">
          <div className="text-sm text-gray-500">侧边栏区域</div>
        </aside>

        {/* 主内容 */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
