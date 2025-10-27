/**
 * Simple in-memory vector store as an alternative to ChromaDB
 * Uses cosine similarity for vector search
 */

import fs from 'fs';
import path from 'path';

interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

class SimpleVectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private dataPath: string;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
        this.documents = new Map(Object.entries(data));
        console.log(`Loaded ${this.documents.size} documents from ${this.dataPath}`);
      }
    } catch (error) {
      console.warn('Could not load vector store:', error);
    }
  }

  private save() {
    try {
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Object.fromEntries(this.documents);
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Could not save vector store:', error);
    }
  }

  upsert(documents: VectorDocument[]) {
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
    this.save();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  query(queryEmbedding: number[], topK: number = 8): Array<{
    id: string;
    content: string;
    metadata: Record<string, any>;
    score: number;
  }> {
    const results: Array<{
      id: string;
      content: string;
      metadata: Record<string, any>;
      score: number;
    }> = [];

    for (const [id, doc] of this.documents) {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      results.push({
        id,
        content: doc.content,
        metadata: doc.metadata,
        score: similarity,
      });
    }

    // Sort by similarity (higher is better)
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }

  count(): number {
    return this.documents.size;
  }

  clear() {
    this.documents.clear();
    this.save();
  }
}

// Singleton instance
let store: SimpleVectorStore | null = null;

export function getVectorStore(): SimpleVectorStore {
  if (!store) {
    const dataPath = path.join(process.cwd(), 'data', 'vector-store.json');
    store = new SimpleVectorStore(dataPath);
  }
  return store;
}

export type { VectorDocument };

