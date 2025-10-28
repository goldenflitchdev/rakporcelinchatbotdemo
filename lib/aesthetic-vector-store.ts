/**
 * Aesthetic & Material Traits Vector Database
 * Specialized vector store for style, finish, material, and aesthetic properties
 */

import { getVectorStore, type VectorDocument } from './simple-vector-store';
import path from 'path';

interface AestheticTraits {
  productId: number;
  productName: string;
  productCode: string;
  
  // Material traits
  material: string;
  materialFinish?: string; // glossy, matte, textured, semi-matte
  
  // Aesthetic traits
  style: string[]; // modern, classic, minimalist, elegant, rustic, contemporary
  colorPalette: string[]; // white, cream, black, colored, multi-color
  pattern?: string; // solid, patterned, printed, embossed
  
  // Visual characteristics
  finish: string; // shiny, matte, satin, textured
  edgeType?: string; // rolled, plain, scalloped, beaded
  
  // Design attributes
  aesthetic: string; // elegant, casual, formal, contemporary, traditional
  useCase: string[]; // fine dining, casual dining, hotel, restaurant, home
  
  // Combined description for embedding
  aestheticDescription: string;
}

export function createAestheticDescription(traits: Partial<AestheticTraits>): string {
  const parts: string[] = [];
  
  if (traits.material) {
    parts.push(`Made from ${traits.material}`);
  }
  
  if (traits.materialFinish) {
    parts.push(`with ${traits.materialFinish} finish`);
  }
  
  if (traits.style && traits.style.length > 0) {
    parts.push(`featuring ${traits.style.join(', ')} design`);
  }
  
  if (traits.colorPalette && traits.colorPalette.length > 0) {
    parts.push(`in ${traits.colorPalette.join(', ')} colors`);
  }
  
  if (traits.aesthetic) {
    parts.push(`perfect for ${traits.aesthetic} settings`);
  }
  
  if (traits.useCase && traits.useCase.length > 0) {
    parts.push(`ideal for ${traits.useCase.join(', ')}`);
  }
  
  if (traits.edgeType) {
    parts.push(`with ${traits.edgeType} edge`);
  }

  return parts.join('. ') + '.';
}

export function extractAestheticTraits(product: {
  product_name: string;
  product_code: string;
  material?: string;
  material_finish?: string;
  description?: string;
  product_description?: string;
}): Partial<AestheticTraits> {
  const name = product.product_name?.toLowerCase() || '';
  const desc = (product.description || product.product_description || '').toLowerCase();
  const combined = `${name} ${desc}`;

  const traits: Partial<AestheticTraits> = {
    material: product.material || 'porcelain',
    materialFinish: product.material_finish,
    style: [],
    colorPalette: [],
    useCase: [],
  };

  // Detect style
  if (combined.includes('classic') || combined.includes('traditional')) {
    traits.style?.push('classic');
  }
  if (combined.includes('modern') || combined.includes('contemporary')) {
    traits.style?.push('modern');
  }
  if (combined.includes('minimalist') || combined.includes('simple')) {
    traits.style?.push('minimalist');
  }
  if (combined.includes('elegant') || combined.includes('fine')) {
    traits.style?.push('elegant');
  }
  if (combined.includes('rustic') || combined.includes('artisan')) {
    traits.style?.push('rustic');
  }

  // Detect colors
  const colors = ['white', 'black', 'cream', 'ivory', 'grey', 'gray', 'blue', 'green', 'red', 'brown'];
  colors.forEach(color => {
    if (combined.includes(color)) {
      traits.colorPalette?.push(color);
    }
  });
  if (traits.colorPalette?.length === 0) {
    traits.colorPalette = ['white']; // Default
  }

  // Detect finish
  if (combined.includes('glossy') || combined.includes('shiny') || combined.includes('glaze')) {
    traits.finish = 'glossy';
  } else if (combined.includes('matte') || combined.includes('matt')) {
    traits.finish = 'matte';
  } else if (combined.includes('satin')) {
    traits.finish = 'satin';
  } else {
    traits.finish = 'glazed'; // Default for porcelain
  }

  // Detect use case
  if (combined.includes('hotel') || combined.includes('hospitality')) {
    traits.useCase?.push('hotel');
  }
  if (combined.includes('restaurant') || combined.includes('commercial')) {
    traits.useCase?.push('restaurant');
  }
  if (combined.includes('fine dining') || combined.includes('banquet')) {
    traits.useCase?.push('fine dining');
  }
  if (combined.includes('casual') || combined.includes('everyday')) {
    traits.useCase?.push('casual dining');
  }
  if (traits.useCase?.length === 0) {
    traits.useCase = ['home', 'restaurant'];
  }

  // Detect edge type
  if (combined.includes('rolled edge') || combined.includes('rolled rim')) {
    traits.edgeType = 'rolled';
  } else if (combined.includes('plain')) {
    traits.edgeType = 'plain';
  }

  // Determine overall aesthetic
  if (traits.style?.includes('classic') || traits.style?.includes('elegant')) {
    traits.aesthetic = 'elegant';
  } else if (traits.style?.includes('modern') || traits.style?.includes('minimalist')) {
    traits.aesthetic = 'contemporary';
  } else if (traits.style?.includes('rustic')) {
    traits.aesthetic = 'rustic';
  } else {
    traits.aesthetic = 'versatile';
  }

  return traits;
}

// Singleton for aesthetic vector store
let aestheticStore: ReturnType<typeof getVectorStore> | null = null;

export function getAestheticVectorStore() {
  if (!aestheticStore) {
    const dataPath = path.join(process.cwd(), 'data', 'aesthetic-vector-store.json');
    // This will use the same SimpleVectorStore but with a different file
    const fs = require('fs');
    const SimpleVectorStore = require('./simple-vector-store');
    
    class AestheticVectorStore {
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
            console.log(`Loaded ${this.documents.size} aesthetic profiles`);
          }
        } catch (error) {
          console.warn('Could not load aesthetic vector store:', error);
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
          console.error('Could not save aesthetic vector store:', error);
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

      query(queryEmbedding: number[], topK: number = 5): Array<{
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

        results.sort((a, b) => b.score - a.score);
        return results.slice(0, topK);
      }

      count(): number {
        return this.documents.size;
      }
    }

    aestheticStore = new AestheticVectorStore(dataPath) as any;
  }
  
  return aestheticStore!;
}

export interface AestheticSearchResult {
  productId: number;
  productName: string;
  productCode: string;
  traits: Partial<AestheticTraits>;
  score: number;
}

export async function searchByAesthetic(
  aestheticQuery: string,
  topK: number = 5
): Promise<AestheticSearchResult[]> {
  try {
    const { createEmbedding } = await import('./openai');
    const queryEmbedding = await createEmbedding(aestheticQuery);
    
    const store = getAestheticVectorStore();
    const results = store.query(queryEmbedding, topK);

    return results.map(r => ({
      productId: r.metadata.productId,
      productName: r.metadata.productName,
      productCode: r.metadata.productCode,
      traits: r.metadata.traits,
      score: r.score,
    }));
  } catch (error) {
    console.error('Error in aesthetic search:', error);
    return [];
  }
}

