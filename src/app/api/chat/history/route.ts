import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/chat/history?kbId=xxx — 获取对话列表 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const kbId = searchParams.get('kbId') || null
  const conversations = db.listConversations(kbId)
  return NextResponse.json(conversations)
}

/** POST /api/chat/history — 创建新对话 */
export async function POST(request: Request) {
  const body = await request.json()
  const { title, kbId } = body
  if (!title?.trim()) {
    return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
  }
  const conv = db.createConversation(title, kbId || null)
  return NextResponse.json(conv, { status: 201 })
}

/** DELETE /api/chat/history?convId=xxx — 删除对话 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const convId = searchParams.get('convId')
  if (!convId) {
    return NextResponse.json({ error: '缺少 convId' }, { status: 400 })
  }
  db.deleteConversation(convId)
  return NextResponse.json({ success: true })
}
