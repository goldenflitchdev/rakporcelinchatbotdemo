/**
 * AI-Powered Query Analyzer
 * Uses OpenAI to understand user intent and generate optimal database queries
 */

import { getOpenAIClient } from './openai';

export interface QueryAnalysis {
  userIntent: string;
  searchStrategy: 'collection' | 'category' | 'material' | 'aesthetic' | 'feature' | 'general';
  keywords: string[];
  filters: {
    collections?: string[];
    categories?: string[];
    materials?: string[];
    colors?: string[];
    finishes?: string[]; // matte, glossy, textured
    shapes?: string[];
    features?: string[]; // microwave safe, dishwasher safe, etc.
    aesthetics?: string[]; // modern, classic, minimalist, elegant, etc.
  };
  suggestedQuery: string;
  confidence: number;
}

const ANALYSIS_PROMPT = `You are a search intent analyzer for RAK Porcelain products. 
Analyze the user's query and extract:

1. USER INTENT: What is the user really looking for?
2. SEARCH STRATEGY: Which approach will find the best products?
   - collection: User wants specific collection (Classic Gourmet, Banquet, etc.)
   - category: User wants product type (plates, bowls, cups)
   - material: User cares about material (porcelain, ceramic, stoneware)
   - aesthetic: User describes style/look (modern, elegant, minimalist, rustic)
   - feature: User wants specific features (microwave safe, stackable, chip-resistant)
   - general: Broad query

3. KEYWORDS: Extract 3-5 relevant keywords
4. FILTERS: What specific attributes to filter by?
5. SUGGESTED QUERY: Optimal database search term
6. CONFIDENCE: 0-1 score of how well you understand the intent

Respond ONLY with valid JSON matching this format:
{
  "userIntent": "string describing what user wants",
  "searchStrategy": "collection|category|material|aesthetic|feature|general",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "filters": {
    "collections": ["collection name"],
    "categories": ["category name"],
    "materials": ["material type"],
    "colors": ["color name"],
    "finishes": ["matte", "glossy", "textured"],
    "shapes": ["round", "square", "oval"],
    "features": ["feature"],
    "aesthetics": ["modern", "classic", "elegant"]
  },
  "suggestedQuery": "optimized search term",
  "confidence": 0.95
}`;

export async function analyzeQuery(userMessage: string): Promise<QueryAnalysis> {
  try {
    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ANALYSIS_PROMPT },
        { 
          role: 'user', 
          content: `Analyze this RAK Porcelain product query: "${userMessage}"` 
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    console.log('🧠 AI Query Analysis:', {
      intent: analysis.userIntent,
      strategy: analysis.searchStrategy,
      confidence: analysis.confidence
    });

    return {
      userIntent: analysis.userIntent || 'General product inquiry',
      searchStrategy: analysis.searchStrategy || 'general',
      keywords: analysis.keywords || [],
      filters: analysis.filters || {},
      suggestedQuery: analysis.suggestedQuery || userMessage,
      confidence: analysis.confidence || 0.5,
    };
  } catch (error) {
    console.error('Error analyzing query:', error);
    
    // Fallback to simple analysis
    return {
      userIntent: 'Product search',
      searchStrategy: 'general',
      keywords: userMessage.toLowerCase().split(' ').filter(w => w.length > 3),
      filters: {},
      suggestedQuery: userMessage,
      confidence: 0.3,
    };
  }
}

export async function buildSmartDatabaseQuery(
  analysis: QueryAnalysis
): Promise<{ sql: string; params: any[] }> {
  const conditions: string[] = [
    'published_at IS NOT NULL',
    'product_images IS NOT NULL'
  ];
  const params: any[] = [];
  let paramIndex = 1;

  // Build WHERE conditions based on analysis
  const whereClauses: string[] = [];

  // Material filter
  if (analysis.filters.materials && analysis.filters.materials.length > 0) {
    whereClauses.push(`LOWER(material) = ANY($${paramIndex})`);
    params.push(analysis.filters.materials.map(m => m.toLowerCase()));
    paramIndex++;
  }

  // Shape filter
  if (analysis.filters.shapes && analysis.filters.shapes.length > 0) {
    whereClauses.push(`LOWER(shape) = ANY($${paramIndex})`);
    params.push(analysis.filters.shapes.map(s => s.toLowerCase()));
    paramIndex++;
  }

  // Feature filters
  if (analysis.filters.features) {
    if (analysis.filters.features.includes('microwave safe')) {
      whereClauses.push('is_microwave_safe = true');
    }
    if (analysis.filters.features.includes('dishwasher safe')) {
      whereClauses.push('is_dishwasher_safe = true');
    }
  }

  // Keyword search
  if (analysis.keywords.length > 0) {
    const keywordConditions = analysis.keywords.map((_, idx) => {
      const pIdx = paramIndex + idx;
      return `(
        LOWER(product_name) LIKE $${pIdx}
        OR LOWER(product_description) LIKE $${pIdx}
        OR LOWER(description) LIKE $${pIdx}
      )`;
    });
    whereClauses.push(`(${keywordConditions.join(' OR ')})`);
    params.push(...analysis.keywords.map(k => `%${k.toLowerCase()}%`));
    paramIndex += analysis.keywords.length;
  }

  // Combine all conditions
  if (whereClauses.length > 0) {
    conditions.push(`(${whereClauses.join(' AND ')})`);
  }

  const sql = `
    SELECT id, product_name, product_code, product_description,
           description, product_images, locale, material, shape,
           is_microwave_safe, is_dishwasher_safe, material_finish
    FROM products
    WHERE ${conditions.join(' AND ')}
    ORDER BY RANDOM()
    LIMIT 5
  `;

  return { sql, params };
}

