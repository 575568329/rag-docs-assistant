/*
 * @Author: fjyu9 fjyu9@iflytek.com
 * @Date: 2026-04-30 11:04:56
 * @LastEditors: fjyu9 fjyu9@iflytek.com
 * @LastEditTime: 2026-04-30 11:13:38
 * @FilePath: \rag-docs-assistant\src\lib\chunker.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export function chunkText(text:string,chunkSize:number,overlap:number){
  const chunk = []
  if (text&&text.length) {
    const step = Math.max(chunkSize - overlap, 1)
    for (let index = 0; index < text.length; index += step) {
      chunk.push(text.slice(index,index + chunkSize)) 
    }
  }
  return chunk
}