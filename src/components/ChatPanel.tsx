'use client'
import { useChat } from '@ai-sdk/react'
import { useState } from 'react'
import { DefaultChatTransport } from 'ai'

export default function ChatPanel({ kbId, onBack }: { kbId: string; onBack: () => void }) {
  const { messages, sendMessage, status, stop, regenerate } = useChat({
    id: kbId,
    transport: new DefaultChatTransport({
      body: () => ({ kbId })
    })
  })
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          ← 返回
        </button>
        <h1 className="text-xl font-bold">AI 对话</h1>
      </div>

      <div className="space-y-4 mb-4 min-h-[400px]">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-20">上传文档后，提问即可开始对话</p>
        )}
        {messages.map(m => {
          const text = m.parts
            ?.filter(p => p.type === 'text')
            .map(p => p.text)
            .join('') ?? ''
          if (!text) return null
          return (
            <div key={m.id} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                {text}
              </div>
              {m.role === 'assistant' && status === 'ready' && (
                <button
                  onClick={() => regenerate()}
                  className="text-xs text-gray-400 ml-2 hover:text-gray-600"
                >
                  重新生成
                </button>
              )}
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="基于知识库提问..."
          className="flex-1 border rounded-lg px-3 py-2"
          disabled={status !== 'ready'}
        />
        {status === 'ready' || status === 'error' ? (
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            发送
          </button>
        ) : (
          <button type="button" onClick={stop} className="px-4 py-2 bg-red-600 text-white rounded-lg">
            停止
          </button>
        )}
      </form>
    </div>
  )
}