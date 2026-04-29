import type {KnowledgeBase,Document} from './types'
let knowledgeBases:KnowledgeBase[] = []
let documents:Document[] = []
let knowledgeBaseId = 0
let documentsId = 0
function getKB(id: string) {
  const kb = knowledgeBases.find(kb => kb.id === id)
  if (!kb) return null
  kb.docCount = documents.filter(doc => doc.kbId === id).length
  return kb
}
export const db = {
  
  listKB: () => knowledgeBases.map(kb => ({
    ...kb,
    docCount: documents.filter(doc => doc.kbId === kb.id).length
  })),
  createKB:(name:string,description:string)=>{
    const kb =  {
      id: 'know_'+knowledgeBaseId,
      name,
      description,
      docCount: 0,
      createdAt: new Date().toLocaleString(),
    }
    knowledgeBases.push(kb)
    knowledgeBaseId++
    return getKB(kb.id)
  },
  deleteKB:(id:string)=>{
    knowledgeBases = knowledgeBases.filter(item => item.id !== id)
    documents = documents.filter(item => item.kbId !== id)
  },
  listDocs(kbId:string){
    const docsList = documents.filter(item=>kbId === item.kbId)
    return docsList
  },
  addDoc(kbId:string, filename:string, chunkCount:number){
    const doc = {
      id: 'doc_'+documentsId,
      kbId,
      filename,
      chunkCount,
      uploadedAt: new Date().toLocaleDateString()
    }
    documents.push(doc)
    documentsId++
    return doc
  },
  deleteDocs(kbId:string){
    documents = documents.filter((item)=>{
      return item.kbId !== kbId
    })
  }
}