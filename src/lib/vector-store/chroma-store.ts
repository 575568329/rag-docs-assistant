import { ChromaClient } from "chromadb";
import { VectorStore } from './types'

export class ChromaStore implements VectorStore {
  private client: ChromaClient

  constructor(client: ChromaClient) {
    this.client = client
  }

  async addVectors(collectionName:string, vectors:number[][], texts:string[], ids:string[]){
    const collection = await this.client.getOrCreateCollection({ name: collectionName })
    await collection.add({
      ids,
      documents: texts,
      embeddings: vectors,  // 直接用，不需要复制
    })
  }
  async similaritySearch(collectionName:string, queryVector:number[], topK:number){
    const collection = await this.client.getOrCreateCollection({ name: collectionName })
    const results = await collection.query({
      queryEmbeddings: [queryVector],       // 注意是数组
      nResults: topK
    })

    const data = []
    for (let index = 0; index < results.documents[0].length; index++) {
      const distances = results.distances[0][index]
      data.push({
        content:results.documents[0][index] || '',
        score:distances!==null?1-distances:0
      })
      
    }

    return data
  }
  async deleteCollection(collectionName:string){
    await this.client.deleteCollection({ name: collectionName })
  }
}
