'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DataPage from '@/components/data/DataPage'

function DataContent() {
  const searchParams = useSearchParams()
  const kbId = searchParams.get('kbId')
  return <DataPage kbId={kbId} />
}

export default function DataPageWrapper() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-400">加载中...</div>}>
      <DataContent />
    </Suspense>
  )
}
