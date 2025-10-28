/**
 * Visual-Based Product Search
 * Uses AI-analyzed visual characteristics to find products
 */

import { createEmbedding } from './openai';
import fs from 'fs';
import path from 'path';

export interface VisualSearchParams {
  aestheticStyle?: string[];
  culturalInspiration?: string[];
  colorPalette?: string[];
  mood?: string[];
  finish?: string[];
  culinaryStyle?: string[];
  priceSegment?: string;
}

export async function searchByVisualCharacteristics(
  query: string,
  params?: VisualSearchParams,
  limit: number = 5
): Promise<any[]> {
  try {
    // Load visual vector database
    const visualPath = path.join(process.cwd(), 'data', 'visual-vector-store.json');
    
    if (!fs.existsSync(visualPath)) {
      console.log('⚠️  Visual database not built yet. Run: npm run db:analyze-vision');
      return [];
    }

    const visualData = JSON.parse(fs.readFileSync(visualPath, 'utf-8'));
    const products = Object.values(visualData) as any[];

    console.log(`🎨 Searching ${products.length} visual profiles...`);

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
    console.log(`✅ Found ${topResults.length} visual matches (scores: ${topResults.map(r => r.score.toFixed(3)).join(', ')})`);

    return topResults.map(r => ({
      productId: r.productId,
      productName: r.productName,
      productCode: r.productCode,
      imageUrl: r.imageUrl,
      analysis: r.analysis,
      score: r.score
    }));
  } catch (error) {
    console.error('Error in visual search:', error);
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

export function extractVisualQuery(userMessage: string): {
  hasVisualIntent: boolean;
  visualQuery?: string;
  params?: VisualSearchParams;
} {
  const lowerMessage = userMessage.toLowerCase();

  // Visual aesthetic keywords
  const visualKeywords = [
    // Styles
    'wabi-sabi', 'minimalist', 'contemporary', 'classic', 'vintage',
    'rustic', 'industrial', 'art deco', 'scandinavian', 'mediterranean',
    
    // Cultural
    'japanese', 'european', 'french', 'italian', 'chinese',
    'middle eastern', 'asian', 'fusion',
    
    // Visual qualities
    'textured', 'smooth', 'matte', 'glossy', 'reactive glaze',
    'handmade', 'hand-crafted', 'artisan', 'organic',
    
    // Mood/Theme
    'earthy', 'elegant', 'sophisticated', 'rustic', 'refined',
    'bold', 'delicate', 'warm', 'inviting', 'calm', 'serene',
    
    // Visual
    'photogenic', 'instagram', 'beautiful', 'striking', 'stunning',
    
    // Context
    'fine dining', 'casual', 'candlelight', 'natural light'
  ];

  const hasVisualIntent = visualKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );

  if (!hasVisualIntent) {
    return { hasVisualIntent: false };
  }

  // Extract parameters
  const params: VisualSearchParams = {};

  // Aesthetic styles
  const styleMap: Record<string, string> = {
    'wabi-sabi': 'Wabi-Sabi',
    'minimalist': 'Minimalist',
    'contemporary': 'Contemporary',
    'classic': 'Classic',
    'vintage': 'Vintage',
    'rustic': 'Rustic',
    'industrial': 'Industrial',
    'art deco': 'Art Deco',
    'scandinavian': 'Scandinavian'
  };
  
  params.aestheticStyle = Object.entries(styleMap)
    .filter(([keyword]) => lowerMessage.includes(keyword))
    .map(([, style]) => style);

  // Cultural inspiration
  const cultureMap: Record<string, string> = {
    'japanese': 'Japanese',
    'chinese': 'Chinese',
    'european': 'European',
    'french': 'French',
    'italian': 'Italian',
    'middle eastern': 'Middle Eastern',
    'asian': 'Asian Fusion'
  };
  
  params.culturalInspiration = Object.entries(cultureMap)
    .filter(([keyword]) => lowerMessage.includes(keyword))
    .map(([, culture]) => culture);

  // Finish
  const finishKeywords = ['matte', 'glossy', 'satin', 'reactive glaze'];
  params.finish = finishKeywords.filter(finish => lowerMessage.includes(finish));

  // Mood
  const moodKeywords = ['elegant', 'sophisticated', 'rustic', 'refined', 'bold', 'calm', 'warm'];
  params.mood = moodKeywords.filter(mood => lowerMessage.includes(mood));

  // Culinary
  const cuisineKeywords = ['japanese', 'french', 'italian', 'asian', 'fusion', 'european'];
  params.culinaryStyle = cuisineKeywords.filter(cuisine => lowerMessage.includes(cuisine));

  // Price segment
  if (lowerMessage.includes('luxury') || lowerMessage.includes('premium')) {
    params.priceSegment = 'Luxury';
  } else if (lowerMessage.includes('budget') || lowerMessage.includes('affordable')) {
    params.priceSegment = 'Budget';
  }

  return {
    hasVisualIntent: true,
    visualQuery: userMessage,
    params
  };
}

