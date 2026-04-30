/*
 * @Author: fjyu9 fjyu9@iflytek.com
 * @Date: 2026-04-30 11:17:23
 * @LastEditors: fjyu9 fjyu9@iflytek.com
 * @LastEditTime: 2026-04-30 11:34:54
 * @FilePath: \rag-docs-assistant\src\api\kb\router.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { NextResponse } from 'next/server'
import { db } from '../../../lib/db'

export async function GET(){
  return NextResponse.json(db.listKB())
}

export async function POST(request:Request){
   const body = await request.json()
   const creatData = db.createKB(body.name,body.description)
  return NextResponse.json(creatData)
}