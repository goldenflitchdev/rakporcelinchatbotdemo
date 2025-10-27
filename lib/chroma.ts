import { getVectorStore, type VectorDocument } from './simple-vector-store';

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    url: string;
    title: string;
    heading?: string;
    section?: string;
    lang?: string;
    lastmod?: string;
    chunkIndex: number;
    totalChunks: number;
  };
  embedding?: number[];
}

export async function upsertChunks(chunks: DocumentChunk[]): Promise<void> {
  if (chunks.length === 0) {
    return;
  }

  const store = getVectorStore();
  
  const docs: VectorDocument[] = chunks.map(chunk => ({
    id: chunk.id,
    content: chunk.content,
    embedding: chunk.embedding || [],
    metadata: chunk.metadata,
  }));

  store.upsert(docs);
}

export async function queryChunks(
  queryEmbedding: number[],
  topK: number = 8
): Promise<Array<{ id: string; content: string; metadata: DocumentChunk['metadata']; score: number }>> {
  const store = getVectorStore();
  const results = store.query(queryEmbedding, topK);
  
  // Cast metadata to correct type since we control what goes into the store
  return results.map(result => ({
    ...result,
    metadata: result.metadata as DocumentChunk['metadata']
  }));
}

export async function getCollectionStats(): Promise<{
  count: number;
  name: string;
}> {
  const store = getVectorStore();
  return {
    count: store.count(),
    name: 'rakporcelain_us',
  };
}


