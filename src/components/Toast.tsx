import {useEffect} from 'react'
export default function Toast({ message, status, onClose }: { message: string; status: 'success' | 'error'; onClose: () => void }) {
  // 3秒后自动消失
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 ${status === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2 rounded`}>
      {message}
    </div>
  )
}