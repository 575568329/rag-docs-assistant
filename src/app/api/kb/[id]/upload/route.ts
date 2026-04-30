import { chunkText } from '@/lib/chunker'
import { getEmbedding } from '@/lib/embedding'
import { getVectorStore } from '@/lib/vector-store/index'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export async function POST(request:Request,{ params }: { params: Promise<{ id: string }> }) {
  try {
    const {id} = await params
    const kb = db.listKB().find(k => k.id === id)
    if (!kb) {
      return NextResponse.json({ error: '知识库不存在' }, { status: 404 })
    }
    const formData = await request.formData()
    const file = formData.get('file') as File
    const text = await file.text()
    const chunks = chunkText(text, 500, 50)
    const ids = chunks.map((_, i) => `kb${id}-chunk-${i}`)
    const vectors = await getEmbedding(chunks)
    const vectorStore = getVectorStore()
    await vectorStore.addVectors(`kb-${id}`,vectors,chunks,ids)
    db.addDoc(id,file.name,chunks.length)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
  
  
} 