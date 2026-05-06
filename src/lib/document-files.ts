import fs from 'fs'
import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const DATA_DIR = path.resolve('data')
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')

function sanitizeFilename(filename: string): string {
  const normalized = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim()
  return normalized || 'document'
}

function resolveStoredPath(filePath: string): string {
  const resolved = path.resolve(DATA_DIR, filePath)
  const uploadRoot = path.resolve(UPLOAD_DIR)

  if (resolved !== uploadRoot && !resolved.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new Error('文件路径无效')
  }

  return resolved
}

export async function saveUploadedFile(
  kbId: string,
  file: File
): Promise<{ filePath: string; mimeType: string; fileSize: number }> {
  const safeName = sanitizeFilename(file.name)
  const dir = path.join(UPLOAD_DIR, kbId)
  const storedName = `${Date.now()}-${randomUUID()}-${safeName}`
  const absolutePath = path.join(dir, storedName)
  const buffer = Buffer.from(await file.arrayBuffer())

  await mkdir(dir, { recursive: true })
  await writeFile(absolutePath, buffer)

  return {
    filePath: path.relative(DATA_DIR, absolutePath).replace(/\\/g, '/'),
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
  }
}

export async function readStoredFile(filePath: string): Promise<Buffer> {
  return readFile(resolveStoredPath(filePath))
}

export function storedFileExists(filePath: string): boolean {
  try {
    return fs.existsSync(resolveStoredPath(filePath))
  } catch {
    return false
  }
}

export async function deleteStoredFile(filePath?: string): Promise<void> {
  if (!filePath) return

  try {
    await rm(resolveStoredPath(filePath), { force: true })
  } catch {
    // 原始文件清理失败不影响文档元数据删除
  }
}
