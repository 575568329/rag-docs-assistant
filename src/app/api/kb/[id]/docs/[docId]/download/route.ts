import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger, startTimer } from '@/lib/logger'
import { readStoredFile, storedFileExists } from '@/lib/document-files'

function encodeContentDisposition(filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const timer = startTimer()
  const { id: kbId, docId } = await params

  try {
    const doc = db.listDocs(kbId).find(item => item.id === docId)

    if (!doc) {
      logger.warn('文档下载: 文档不存在', { kbId, docId, ...timer() })
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    if (!doc.filePath || !storedFileExists(doc.filePath)) {
      logger.warn('文档下载: 原始文件不可用', { kbId, docId, filename: doc.filename, ...timer() })
      return NextResponse.json({ error: '原始文件不可用' }, { status: 404 })
    }

    const file = await readStoredFile(doc.filePath)
    logger.info('文档下载', { kbId, docId, filename: doc.filename, fileSize: doc.fileSize, ...timer() })

    const body = new Uint8Array(file)

    return new Response(body, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Length': String(file.length),
        'Content-Disposition': encodeContentDisposition(doc.filename),
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    logger.error('文档下载失败', { kbId, docId, error: String(error), ...timer() })
    return NextResponse.json({ error: '下载失败' }, { status: 500 })
  }
}
