/**
 * 日志模块
 *
 * 所有操作和对话记录写入 data/app.log，方便排查问题。
 * 格式：[ISO时间戳] 级别 消息 {JSON详情}
 *
 * - 支持 info / warn / error 三个级别
 * - JSON 序列化失败时回退为 safeStringify，不影响业务流程
 * - 提供 startTimer() 计时工具，用于记录 durationMs
 */

import fs from 'fs'
import path from 'path'

const LOG_DIR = path.resolve('data')
const LOG_FILE = path.join(LOG_DIR, 'app.log')

/** 格式化当前时间为 ISO 字符串 */
function timestamp(): string {
  return new Date().toISOString()
}

/**
 * 安全序列化，避免循环引用 / BigInt / 序列化异常导致业务崩溃。
 * 失败时返回 `[unserializable] typeof=xxx` 兜底。
 */
function safeStringify(value: unknown): string {
  if (value === undefined) return ''
  try {
    return JSON.stringify(value, (_, v) => {
      if (typeof v === 'bigint') return v.toString() + 'n'
      return v
    })
  } catch {
    return `[unserializable] typeof=${typeof value}`
  }
}

/** 写入一行日志到文件（写失败静默，不影响业务） */
function write(level: string, msg: string, detail?: unknown): void {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true })
    const suffix = detail ? ` ${safeStringify(detail)}` : ''
    fs.appendFileSync(LOG_FILE, `[${timestamp()}] ${level} ${msg}${suffix}\n`)
  } catch {
    // 日志写入失败不应中断业务
  }
}

export const logger = {
  /** 记录一般信息（上传成功、对话请求等） */
  info: (msg: string, detail?: unknown) => write('INFO', msg, detail),

  /** 记录警告信息（参数异常、降级处理等） */
  warn: (msg: string, detail?: unknown) => write('WARN', msg, detail),

  /** 记录错误信息（上传失败、对话异常等） */
  error: (msg: string, detail?: unknown) => write('ERROR', msg, detail),
}

/**
 * 创建一个简易计时器，用于记录操作耗时 (durationMs)。
 *
 * 用法：
 * ```ts
 * const timer = startTimer()
 * // ... do work ...
 * logger.info('操作完成', { ...timer(), otherDetail })
 * ```
 */
export function startTimer(): () => { durationMs: number } {
  const start = Date.now()
  return () => ({ durationMs: Date.now() - start })
}
