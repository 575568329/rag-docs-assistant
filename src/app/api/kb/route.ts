/**
 * 知识库管理接口
 *
 * GET  - 获取知识库列表（含文档数量）
 * POST - 创建新知识库
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** 获取知识库列表 */
export async function GET() {
  return NextResponse.json(db.listKB())
}

/** 创建知识库，请求体：{ name: string, description: string } */
export async function POST(request: Request) {
  const body = await request.json()
  const created = db.createKB(body.name, body.description)
  return NextResponse.json(created)
}
