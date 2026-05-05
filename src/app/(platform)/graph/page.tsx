'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import GraphPage from '@/components/graph/GraphPage'

function GraphContent() {
  const searchParams = useSearchParams()
  const kbId = searchParams.get('kbId')
  const focusEntityId = searchParams.get('entityId') || undefined
  return <GraphPage kbId={kbId} focusEntityId={focusEntityId} />
}

export default function GraphRoute() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-400">加载中...</div>}>
      <GraphContent />
    </Suspense>
  )
}
