import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVectorStore } from '@/lib/vector-store'

export async function DELETE( request: Request,{ params }: { params: Promise<{ id: string }> }){
  const {id} = await params
  try {
    db.deleteKB(id)
    await getVectorStore().deleteCollection(`kb-${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

