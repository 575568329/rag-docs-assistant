'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect } from 'react'
import { DefaultChatTransport, UIMessage } from 'ai'
import Markdown from 'react-markdown'
import type { SourceRef } from '@/lib/types'
import SourceCard from './SourceCard'
import EntityTags from './EntityTags'
import { apiPath } from '@/lib/api'

/** 自定义消息元数据 */
type ChatMetadata = {
  sources?: SourceRef[]
  entities?: { id: string; name: string; type: string }[]
}

/** 自定义 UIMessage 类型 */
type ChatUIMessage = UIMessage<ChatMetadata>

interface ChatPageProps {
  kbId: string | null
  onBack?: () => void
}

/** 知识库摘要（仅用于底部展示） */
interface KbSummary {
  id: string
  name: string
  docCount: number
}

/** 示例问题 */
const EXAMPLE_QUESTIONS = [
  '这个项目的技术栈是什么？',
  '如何配置 RAG 对话？',
  'Vercel AI SDK 如何使用？',
  '有哪些常见的设计模式？'
]

export default function ChatPage({ kbId, onBack }: ChatPageProps) {
  const { messages, sendMessage, status, stop, regenerate } = useChat<ChatUIMessage>({
    id: kbId || 'default',
    transport: new DefaultChatTransport({
      api: apiPath('/api/chat'),
      body: { kbId: kbId || '' }
    })
  })

  const [kbSummary, setKbSummary] = useState<KbSummary | null>(null)

  /** 获取知识库列表用于底部摘要展示 */
  useEffect(() => {
    fetch(apiPath('/api/kb'))
      .then(res => res.json())
      .then((list: KbSummary[]) => {
        const match = kbId ? list.find(kb => kb.id === kbId) : null
        setKbSummary(match || null)
      })
      .catch(() => {})
  }, [kbId])

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  /** 自动滚动到底部 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /** 提取消息文本 */
  const getMessageText = (m: ChatUIMessage): string => {
    return m.parts
      ?.filter(p => p.type === 'text')
      .map(p => p.text)
      .join('') ?? ''
  }

  /** 处理示例问题点击 */
  const handleExampleClick = (question: string) => {
    setInput(question)
    setTimeout(() => {
      sendMessage({ text: question })
      setInput('')
    }, 100)
  }

  /** 处理实体点击 */
  const handleEntityClick = (entityId: string) => {
    console.log('Navigate to entity graph:', entityId)
    // TODO: 跳转到图谱页
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部导航 */}
      {onBack && (
        <header className="flex-shrink-0 px-4 py-3 border-b border-gray-100">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
        </header>
      )}

      {/* 消息列表区域 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6"
      >
        <div className="max-w-3xl mx-auto py-6 space-y-8">
          {/* 空状态：欢迎语 + 示例问题 */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  AI 知识库问答
                </h1>
                <p className="text-gray-500">
                  基于上传的文档，快速获取精准答案
                </p>
              </div>

              {/* 示例问题卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {EXAMPLE_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(question)}
                    className="p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm text-gray-700"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 消息列表 */}
          {messages.map((m) => {
            const text = getMessageText(m)
            if (!text) return null

            return (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${m.role === 'assistant' ? 'w-full' : ''}`}>
                  {/* 用户消息 */}
                  {m.role === 'user' && (
                    <div className="inline-flex px-5 py-3 rounded-lg rounded-br-md bg-blue-600 text-white text-sm leading-relaxed">
                      {text}
                    </div>
                  )}

                  {/* AI 消息 */}
                  {m.role === 'assistant' && (
                    <div className="space-y-4">
                      {/* 来源引用卡片 */}
                      {m.metadata?.sources && m.metadata.sources.length > 0 && (
                        <SourceCard sources={m.metadata.sources} />
                      )}

                      {/* 消息内容 */}
                      <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                        <Markdown>{text}</Markdown>
                      </div>

                      {/* 关联实体标签 */}
                      {m.metadata?.entities && m.metadata.entities.length > 0 && (
                        <EntityTags
                          entities={m.metadata.entities}
                          onEntityClick={handleEntityClick}
                        />
                      )}

                      {/* 重新生成按钮 */}
                      {status === 'ready' && m === messages[messages.length - 1] && (
                        <button
                          onClick={() => regenerate()}
                          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          重新生成
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部输入框 */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入问题，AI 将基于知识库回答..."
              className="w-full px-5 py-3.5 pr-14 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
              disabled={status === 'submitted'}
            />
            <button
              type={status === 'ready' || status === 'error' ? 'submit' : 'button'}
              onClick={status === 'streaming' || status === 'submitted' ? stop : undefined}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md flex items-center justify-center transition-all ${
                status === 'ready' || status === 'error'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {status === 'ready' || status === 'error' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              ) : status === 'streaming' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              ) : (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-2">
            {kbId
              ? `当前知识库：${kbSummary ? `${kbSummary.name} · ${kbSummary.docCount} 文档` : kbId}`
              : '搜索全部知识库'}
          </p>
        </div>
      </div>
    </div>
  )
}
