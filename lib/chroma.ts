import { ChromaClient, Collection } from 'chromadb';
import path from 'path';
import { COLLECTION_NAME } from './config';

let client: ChromaClient | null = null;
let collection: Collection | null = null;

export async function getChromaClient(): Promise<ChromaClient> {
  if (client) {
    return client;
  }

  const chromaPath = path.join(process.cwd(), 'data', 'chroma');
  
  client = new ChromaClient({
    path: chromaPath,
  });

  return client;
}

export async function getCollection(): Promise<Collection> {
  if (collection) {
    return collection;
  }

  const chromaClient = await getChromaClient();

  try {
    collection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { 
        description: 'RAK Porcelain US website content',
        'hnsw:space': 'cosine',
      },
    });
  } catch (error) {
    console.error('Error getting/creating collection:', error);
    throw error;
  }

  return collection;
}

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

  const coll = await getCollection();

  const ids = chunks.map(c => c.id);
  const documents = chunks.map(c => c.content);
  const metadatas = chunks.map(c => c.metadata);
  const embeddings = chunks
    .map(c => c.embedding)
    .filter((e): e is number[] => e !== undefined);

  await coll.upsert({
    ids,
    documents,
    metadatas,
    embeddings: embeddings.length === chunks.length ? embeddings : undefined,
  });
}

export async function queryChunks(
  queryEmbedding: number[],
  topK: number = 8
): Promise<Array<{ id: string; content: string; metadata: DocumentChunk['metadata']; score: number }>> {
  const coll = await getCollection();

  const results = await coll.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  if (!results.ids?.[0] || !results.documents?.[0] || !results.metadatas?.[0]) {
    return [];
  }

  return results.ids[0].map((id, idx) => ({
    id,
    content: results.documents![0][idx] as string,
    metadata: results.metadatas![0][idx] as DocumentChunk['metadata'],
    score: results.distances?.[0]?.[idx] ?? 0,
  }));
}

export async function getCollectionStats(): Promise<{
  count: number;
  name: string;
}> {
  const coll = await getCollection();
  const count = await coll.count();

  return {
    count,
    name: COLLECTION_NAME,
  };
}


