import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/graph/favorites?kbId=xxx — 获取收藏列表 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const kbId = searchParams.get('kbId') || null
  const favorites = db.listFavorites(kbId)
  return NextResponse.json(favorites)
}

/** POST /api/graph/favorites — 添加收藏 */
export async function POST(request: Request) {
  const body = await request.json()
  const { nodeId, nodeLabel, nodeType, kbId } = body
  if (!nodeId || !nodeLabel || !nodeType) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
  }
  const fav = db.addFavorite(nodeId, nodeLabel, nodeType, kbId || null)
  return NextResponse.json(fav, { status: 201 })
}

/** DELETE /api/graph/favorites?favId=xxx — 取消收藏 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const favId = searchParams.get('favId')
  if (!favId) {
    return NextResponse.json({ error: '缺少 favId' }, { status: 400 })
  }
  db.removeFavorite(favId)
  return NextResponse.json({ success: true })
}
