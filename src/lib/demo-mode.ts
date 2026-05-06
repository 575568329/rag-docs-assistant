import { NextResponse } from 'next/server'
import { logger } from './logger'

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true'
}

export function demoWriteBlocked(action: string, detail?: Record<string, unknown>) {
  logger.warn('演示模式阻止写操作', { action, ...detail })
  return NextResponse.json(
    { error: '演示环境已关闭写操作' },
    { status: 403 }
  )
}
