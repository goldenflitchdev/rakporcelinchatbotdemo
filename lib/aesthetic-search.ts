/**
 * Aesthetic-Based Product Search
 * Uses analyzed aesthetic data to find products matching style preferences
 */

import { createEmbedding } from './openai';
import fs from 'fs';
import path from 'path';

export interface AestheticSearchParams {
  colors?: string[];
  style?: string[];
  mood?: string[];
  setting?: string[];
  culturalInfluence?: string[];
  finish?: string[];
}

export async function searchByAestheticProfile(
  query: string,
  params?: AestheticSearchParams,
  limit: number = 5
): Promise<any[]> {
  try {
    // Load aesthetic database
    const aestheticPath = path.join(process.cwd(), 'data', 'aesthetic-vector-store.json');
    
    if (!fs.existsSync(aestheticPath)) {
      console.log('⚠️  Aesthetic database not built yet. Run: npm run db:analyze-aesthetics');
      return [];
    }

    const aestheticData = JSON.parse(fs.readFileSync(aestheticPath, 'utf-8'));
    const products = Object.values(aestheticData) as any[];

    console.log(`🎨 Searching ${products.length} aesthetic profiles...`);

    // Create embedding for the search query
    const queryEmbedding = await createEmbedding(query);

    // Calculate similarity scores
    const results = products.map((product: any) => {
      const similarity = cosineSimilarity(queryEmbedding, product.embedding);
      return {
        ...product,
        score: similarity
      };
    });

    // Sort by similarity and return top results
    results.sort((a, b) => b.score - a.score);

    const topResults = results.slice(0, limit);
    console.log(`✅ Found ${topResults.length} aesthetic matches`);

    return topResults.map(r => r.metadata);
  } catch (error) {
    console.error('Error in aesthetic search:', error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
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

export function extractAestheticQuery(userMessage: string): {
  hasAestheticIntent: boolean;
  aestheticQuery?: string;
  params?: AestheticSearchParams;
} {
  const lowerMessage = userMessage.toLowerCase();

  // Aesthetic keywords
  const aestheticKeywords = [
    // Style
    'elegant', 'sophisticated', 'modern', 'contemporary', 'traditional',
    'minimalist', 'rustic', 'classic', 'vintage', 'timeless', 'artistic',
    
    // Mood
    'warm', 'inviting', 'bold', 'serene', 'playful', 'refined', 'casual',
    'formal', 'luxury', 'premium',
    
    // Finish
    'glossy', 'matte', 'shiny', 'textured', 'smooth', 'satin',
    
    // Cultural
    'asian', 'european', 'middle eastern', 'fusion', 'japanese', 'chinese',
    'french', 'italian', 'arabic',
    
    // Setting
    'fine dining', 'bistro', 'hotel', 'restaurant', 'luxury hotel',
    'casual dining', 'formal event'
  ];

  const hasAestheticIntent = aestheticKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );

  if (!hasAestheticIntent) {
    return { hasAestheticIntent: false };
  }

  // Extract parameters
  const params: AestheticSearchParams = {};

  // Colors
  const colorMap: Record<string, string> = {
    'white': 'white', 'black': 'black', 'cream': 'cream', 'ivory': 'ivory',
    'grey': 'grey', 'gray': 'grey', 'blue': 'blue', 'green': 'green'
  };
  
  params.colors = Object.entries(colorMap)
    .filter(([keyword]) => lowerMessage.includes(keyword))
    .map(([, color]) => color);

  // Style
  const styleKeywords = ['modern', 'contemporary', 'traditional', 'minimalist', 'elegant', 'rustic'];
  params.style = styleKeywords.filter(style => lowerMessage.includes(style));

  // Mood
  const moodKeywords = ['sophisticated', 'warm', 'bold', 'serene', 'inviting'];
  params.mood = moodKeywords.filter(mood => lowerMessage.includes(mood));

  // Setting
  const settingKeywords = ['fine dining', 'casual', 'formal', 'bistro', 'hotel', 'restaurant'];
  params.setting = settingKeywords.filter(setting => lowerMessage.includes(setting));

  // Finish
  const finishKeywords = ['glossy', 'matte', 'satin', 'textured'];
  params.finish = finishKeywords.filter(finish => lowerMessage.includes(finish));

  return {
    hasAestheticIntent: true,
    aestheticQuery: userMessage,
    params
  };
}

