import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger, startTimer } from '@/lib/logger'

/** GET /api/graph/favorites?kbId=xxx — 获取收藏列表 */
export async function GET(request: Request) {
  const timer = startTimer()
  try {
    const { searchParams } = new URL(request.url)
    const kbId = searchParams.get('kbId') || null
    const favorites = db.listFavorites(kbId)
    logger.info('获取收藏列表', { kbId, count: favorites.length, ...timer() })
    return NextResponse.json(favorites)
  } catch (error) {
    logger.error('获取收藏列表失败', { error: String(error), ...timer() })
    return NextResponse.json({ error: '获取收藏列表失败' }, { status: 500 })
  }
}

/** POST /api/graph/favorites — 添加收藏 */
export async function POST(request: Request) {
  const timer = startTimer()
  try {
    const body = await request.json()
    const { nodeId, nodeLabel, nodeType, kbId } = body
    if (!nodeId || !nodeLabel || !nodeType) {
      logger.warn('添加收藏参数错误', { nodeId, nodeLabel, nodeType, reason: '缺少必要参数' })
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }
    const fav = db.addFavorite(nodeId, nodeLabel, nodeType, kbId || null)
    logger.info('添加收藏', { favId: fav.id, nodeId, nodeLabel, nodeType, kbId, ...timer() })
    return NextResponse.json(fav, { status: 201 })
  } catch (error) {
    logger.error('添加收藏失败', { error: String(error), ...timer() })
    return NextResponse.json({ error: '添加收藏失败' }, { status: 500 })
  }
}

/** DELETE /api/graph/favorites?favId=xxx — 取消收藏 */
export async function DELETE(request: Request) {
  const timer = startTimer()
  try {
    const { searchParams } = new URL(request.url)
    const favId = searchParams.get('favId')
    if (!favId) {
      logger.warn('取消收藏参数错误', { reason: '缺少 favId' })
      return NextResponse.json({ error: '缺少 favId' }, { status: 400 })
    }
    db.removeFavorite(favId)
    logger.info('取消收藏', { favId, ...timer() })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('取消收藏失败', { error: String(error), ...timer() })
    return NextResponse.json({ error: '取消收藏失败' }, { status: 500 })
  }
}
