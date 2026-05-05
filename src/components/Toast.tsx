'use client'

import { useEffect } from 'react'

export default function Toast({ message, status, onClose }: { message: string; status: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  const isSuccess = status === 'success'
  const iconClass = isSuccess ? 'text-emerald-600' : 'text-red-600'
  const bgClass = isSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
  const textClass = isSuccess ? 'text-emerald-800' : 'text-red-800'

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-md border shadow-lg ${bgClass} ${textClass} text-sm font-medium`}>
      {isSuccess ? (
        <svg className={`w-4 h-4 flex-shrink-0 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className={`w-4 h-4 flex-shrink-0 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>{message}</span>
    </div>
  )
}
