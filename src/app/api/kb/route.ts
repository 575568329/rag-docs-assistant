/**
 * 知识库管理接口
 *
 * GET  - 获取知识库列表（含文档数量）
 * POST - 创建新知识库
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger, startTimer } from '@/lib/logger'

/** 获取知识库列表 */
export async function GET() {
  const timer = startTimer()
  try {
    const list = db.listKB()
    logger.info('获取知识库列表', { count: list.length, ...timer() })
    return NextResponse.json(list)
  } catch (error) {
    logger.error('获取知识库列表失败', { error: String(error), ...timer() })
    return NextResponse.json({ error: '获取知识库列表失败' }, { status: 500 })
  }
}

/** 创建知识库，请求体：{ name: string, description: string } */
export async function POST(request: Request) {
  const timer = startTimer()
  try {
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      logger.warn('创建知识库参数异常', { reason: 'name 为空或类型错误' })
      return NextResponse.json({ error: '知识库名称不能为空' }, { status: 400 })
    }

    const created = db.createKB(body.name, body.description)
    if (!created) {
      logger.error('知识库创建失败', { reason: 'createKB 返回空', name: body.name, ...timer() })
      return NextResponse.json({ error: '创建知识库失败' }, { status: 500 })
    }

    logger.info('知识库创建成功', { kbId: created.id, name: created.name, ...timer() })
    return NextResponse.json(created)
  } catch (error) {
    logger.error('知识库创建失败', { error: String(error), ...timer() })
    return NextResponse.json({ error: '创建知识库失败' }, { status: 500 })
  }
}
