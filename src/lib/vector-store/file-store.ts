
import { VectorStore } from './types'
import fs from 'fs'
const filePath = './data/vectors.json'
export class FileStore implements VectorStore {
  async addVectors(collectionName:string, vectors:number[][], texts:string[], ids:string[]){
    // 读取文件
    const collection = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : {}
    const existing = collection[collectionName] || { ids: [], texts: [], vectors: [] }
    collection[collectionName] = {
      ids: [...existing.ids, ...ids],
      texts: [...existing.texts, ...texts],
      vectors: [...existing.vectors, ...vectors],
    }
    // 写入文件
    fs.writeFileSync(filePath,JSON.stringify(collection),'utf-8')
  }
  async similaritySearch(collectionName:string, queryVector:number[], topK:number){

    function cosineSimilarity(a: number[], b: number[]): number {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
      const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
      const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
      return dot / (magA * magB)
    }
    // 读取文件
    const collection = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : {}
    
    const vectors = collection[collectionName]?collection[collectionName].vectors:[]
    const texts = collection[collectionName]?collection[collectionName].texts:[]
    const scoreAndContent =[]
    for (let index = 0; index < vectors.length; index++) {
      const similarity = cosineSimilarity(vectors[index],queryVector)
      scoreAndContent.push({
        score:similarity,
        content:texts[index]
      })
    }
    scoreAndContent.sort((a, b) => b.score - a.score)
    return scoreAndContent.slice(0, topK)
  }
  async deleteCollection(collectionName:string){
    // 读取文件
    const collection = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : {} 
    delete collection[collectionName]
    // 写入文件
    fs.writeFileSync(filePath,JSON.stringify(collection),'utf-8')
  }
}
