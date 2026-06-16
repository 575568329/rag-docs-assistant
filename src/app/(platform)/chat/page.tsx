'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatPage from '@/components/chat/ChatPage'

function ChatContent() {
  const searchParams = useSearchParams()
  const kbId = searchParams.get('kbId')
  const conversationId = searchParams.get('convId')
  return <ChatPage kbId={kbId} conversationId={conversationId} />
}

export default function ChatRoute() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400">加载中...</div>}>
      <ChatContent />
    </Suspense>
  )
}
