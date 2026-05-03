/**
 * 日志模块
 *
 * 所有操作和对话记录写入 data/app.log，方便排查问题。
 * 格式：[ISO时间戳] 级别 消息 {JSON详情}
 */

import fs from 'fs'
import path from 'path'

const LOG_DIR = path.resolve('data')
const LOG_FILE = path.join(LOG_DIR, 'app.log')

/** 格式化当前时间为 ISO 字符串 */
function timestamp(): string {
  return new Date().toISOString()
}

/** 写入一行日志到文件 */
function write(level: string, msg: string, detail?: unknown): void {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  const suffix = detail ? ` ${JSON.stringify(detail)}` : ''
  fs.appendFileSync(LOG_FILE, `[${timestamp()}] ${level} ${msg}${suffix}\n`)
}

export const logger = {
  /** 记录一般信息（上传成功、对话请求等） */
  info: (msg: string, detail?: unknown) => write('INFO', msg, detail),

  /** 记录错误信息（上传失败、对话异常等） */
  error: (msg: string, detail?: unknown) => write('ERROR', msg, detail),
}
