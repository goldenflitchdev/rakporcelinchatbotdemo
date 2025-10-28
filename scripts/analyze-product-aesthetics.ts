#!/usr/bin/env tsx
/**
 * Advanced Product Aesthetic Analysis
 * Uses AI to analyze product images, names, descriptions for deep understanding
 * Extracts: colors, styles, cultural context, design philosophy, use cases
 */

import { query } from '../lib/postgres';
import { getOpenAIClient, createEmbeddings } from '../lib/openai';
import { getVectorStore, type VectorDocument } from '../lib/simple-vector-store';
import path from 'path';
import fs from 'fs';

interface ProductAnalysis {
  productId: number;
  productName: string;
  productCode: string;
  
  // Visual Analysis
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  
  // Aesthetic Style
  aestheticStyle: {
    era: string[]; // modern, contemporary, traditional, vintage, timeless
    philosophy: string[]; // minimalist, ornate, functional, artistic, elegant
    culturalInfluence: string[]; // asian, european, middle-eastern, fusion, global
    designLanguage: string; // clean lines, organic shapes, geometric, flowing, structured
  };
  
  // Material & Finish
  materialProperties: {
    type: string; // porcelain, ceramic, stoneware, etc.
    finish: string; // glossy, matte, satin, textured, reactive glaze
    surfaceTexture: string; // smooth, ribbed, embossed, hand-crafted
    weight: string; // lightweight, substantial, balanced
  };
  
  // Functional Aspects
  functionality: {
    primaryUse: string[]; // dining, serving, display, specialty
    setting: string[]; // casual, formal, fine dining, bistro, hotel
    cuisine: string[]; // universal, asian, european, fusion, specialty
    stackability: boolean;
    versatility: string; // multi-purpose, specialized, seasonal
  };
  
  // Emotional & Brand
  emotion: {
    mood: string[]; // sophisticated, warm, inviting, bold, serene, playful
    personality: string; // classic, edgy, refined, rustic, modern
    target: string[]; // professional chef, home cook, hotel, restaurant, caterer
  };
  
  // Regional & Demographic
  regional: {
    region: string; // us-en, eu, asia, middle-east
    demographic: string[]; // luxury, mid-range, commercial, institutional
    marketPosition: string; // premium, standard, budget, luxury
  };
  
  // AI-Generated Rich Description
  richDescription: string;
  tags: string[];
}

const ANALYSIS_PROMPT = `You are an expert in porcelain design, art history, and cultural aesthetics. 
Analyze this product and provide deep insights about its visual, cultural, and functional characteristics.

Product Information:
- Name: {product_name}
- Code: {product_code}
- Material: {material}
- Shape: {shape}
- Description: {description}
- Material Finish: {material_finish}

Analyze and respond with JSON containing:

{
  "colors": {
    "primary": ["main colors seen or implied"],
    "secondary": ["supporting colors"],
    "accent": ["detail colors if any"]
  },
  "aestheticStyle": {
    "era": ["modern/contemporary/traditional/vintage/timeless"],
    "philosophy": ["minimalist/ornate/functional/artistic/elegant"],
    "culturalInfluence": ["asian/european/middle-eastern/fusion/global"],
    "designLanguage": "describe the design approach"
  },
  "materialProperties": {
    "type": "material type",
    "finish": "glossy/matte/satin/textured",
    "surfaceTexture": "smooth/ribbed/embossed/etc",
    "weight": "lightweight/substantial/balanced"
  },
  "functionality": {
    "primaryUse": ["dining/serving/display"],
    "setting": ["casual/formal/fine dining/bistro/hotel"],
    "cuisine": ["universal/asian/european/fusion"],
    "stackability": true/false,
    "versatility": "description"
  },
  "emotion": {
    "mood": ["sophisticated/warm/inviting/bold/serene"],
    "personality": "overall character",
    "target": ["professional chef/home cook/hotel/restaurant"]
  },
  "regional": {
    "region": "primary market region",
    "demographic": ["luxury/mid-range/commercial"],
    "marketPosition": "premium/standard/luxury"
  },
  "richDescription": "A comprehensive 2-3 sentence description highlighting the product's aesthetic appeal, cultural context, and ideal use case. Make it evocative and helpful for recommendations.",
  "tags": ["searchable", "aesthetic", "keywords", "for", "discovery"]
}

Be thoughtful and detailed. Consider art history, regional design preferences, and how this product would be used in real settings.`;

async function analyzeProductWithAI(product: any): Promise<ProductAnalysis> {
  const openai = getOpenAIClient();

  const prompt = ANALYSIS_PROMPT
    .replace('{product_name}', product.product_name || 'Unknown')
    .replace('{product_code}', product.product_code || 'N/A')
    .replace('{material}', product.material || 'porcelain')
    .replace('{shape}', product.shape || 'standard')
    .replace('{description}', (product.description || product.product_description || 'No description').substring(0, 500))
    .replace('{material_finish}', product.material_finish || 'glazed');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert in porcelain design and aesthetics.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      productId: product.id,
      productName: product.product_name,
      productCode: product.product_code,
      ...analysis,
    };
  } catch (error) {
    console.error(`Error analyzing product ${product.id}:`, error);
    // Return basic analysis as fallback
    return createBasicAnalysis(product);
  }
}

function createBasicAnalysis(product: any): ProductAnalysis {
  return {
    productId: product.id,
    productName: product.product_name,
    productCode: product.product_code,
    colors: { primary: ['white'], secondary: [], accent: [] },
    aestheticStyle: {
      era: ['contemporary'],
      philosophy: ['functional'],
      culturalInfluence: ['global'],
      designLanguage: 'clean and practical'
    },
    materialProperties: {
      type: product.material || 'porcelain',
      finish: product.material_finish || 'glazed',
      surfaceTexture: 'smooth',
      weight: 'balanced'
    },
    functionality: {
      primaryUse: ['dining'],
      setting: ['casual', 'formal'],
      cuisine: ['universal'],
      stackability: true,
      versatility: 'multi-purpose'
    },
    emotion: {
      mood: ['professional'],
      personality: 'versatile',
      target: ['restaurant', 'hotel']
    },
    regional: {
      region: product.locale || 'global',
      demographic: ['commercial'],
      marketPosition: 'standard'
    },
    richDescription: `${product.product_name} - A versatile porcelain piece suitable for various dining settings.`,
    tags: ['porcelain', 'tableware', 'dining']
  };
}

async function analyzeAllProducts() {
  console.log('🎨 Starting Advanced Product Aesthetic Analysis...\n');

  // Get products with images
  console.log('📦 Fetching products from database...');
  const products = await query(`
    SELECT id, product_name, product_code, material, material_finish,
           shape, description, product_description, locale, product_images
    FROM products
    WHERE published_at IS NOT NULL
      AND product_images IS NOT NULL
    LIMIT 200
  `);

  console.log(`✅ Found ${products.length} products to analyze\n`);

  const analyses: ProductAnalysis[] = [];
  const vectorDocs: VectorDocument[] = [];

  console.log('🧠 Analyzing products with AI (this will take 10-15 minutes)...\n');

  // Process in batches to avoid rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);

    console.log(`📊 Batch ${batchNum}/${totalBatches} (${batch.length} products)...`);

    // Analyze products in parallel within batch
    const batchAnalyses = await Promise.all(
      batch.map(product => analyzeProductWithAI(product))
    );

    analyses.push(...batchAnalyses);

    // Create rich descriptions for embedding
    const descriptions = batchAnalyses.map(analysis => {
      const desc = `
Product: ${analysis.productName} (${analysis.productCode})

Aesthetic Profile:
${analysis.richDescription}

Colors: ${[...analysis.colors.primary, ...analysis.colors.secondary].join(', ')}
Style: ${analysis.aestheticStyle.philosophy.join(', ')} with ${analysis.aestheticStyle.culturalInfluence.join('/')} influences
Era: ${analysis.aestheticStyle.era.join(', ')}
Design: ${analysis.aestheticStyle.designLanguage}

Material: ${analysis.materialProperties.type} with ${analysis.materialProperties.finish} finish
Texture: ${analysis.materialProperties.surfaceTexture}

Best For: ${analysis.functionality.setting.join(', ')} settings
Cuisine: ${analysis.functionality.cuisine.join(', ')}
Use: ${analysis.functionality.primaryUse.join(', ')}

Mood: ${analysis.emotion.mood.join(', ')}
Personality: ${analysis.emotion.personality}
Target: ${analysis.emotion.target.join(', ')}

Market: ${analysis.regional.marketPosition} ${analysis.regional.demographic.join('/')}
Region: ${analysis.regional.region}

Tags: ${analysis.tags.join(', ')}
      `.trim();

      return desc;
    });

    // Create embeddings for this batch
    console.log(`   Creating embeddings...`);
    const embeddings = await createEmbeddings(descriptions);

    // Create vector documents
    batchAnalyses.forEach((analysis, idx) => {
      vectorDocs.push({
        id: `aesthetic-${analysis.productId}`,
        content: descriptions[idx],
        embedding: embeddings[idx],
        metadata: {
          productId: analysis.productId,
          productName: analysis.productName,
          productCode: analysis.productCode,
          analysis: analysis,
          type: 'aesthetic-analysis'
        }
      });
    });

    console.log(`   ✅ Analyzed ${batchAnalyses.length} products\n`);

    // Small delay to avoid rate limits
    if (i + BATCH_SIZE < products.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Save analyses to file
  const analysisPath = path.join(process.cwd(), 'data', 'product-aesthetics.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analyses, null, 2));
  console.log(`💾 Saved ${analyses.length} analyses to ${analysisPath}\n`);

  // Update aesthetic vector store
  console.log('📊 Updating aesthetic vector database...');
  const aestheticStorePath = path.join(process.cwd(), 'data', 'aesthetic-vector-store.json');
  const aestheticData = Object.fromEntries(vectorDocs.map(doc => [doc.id, doc]));
  fs.writeFileSync(aestheticStorePath, JSON.stringify(aestheticData, null, 2));

  console.log(`\n✅ Aesthetic Analysis Complete!`);
  console.log(`   Products analyzed: ${analyses.length}`);
  console.log(`   Vector documents: ${vectorDocs.length}`);
  console.log(`   Aesthetic database: ${aestheticStorePath}`);
  
  // Print summary statistics
  console.log('\n📊 Analysis Summary:');
  const allColors = new Set(analyses.flatMap(a => [...a.colors.primary, ...a.colors.secondary]));
  const allStyles = new Set(analyses.flatMap(a => a.aestheticStyle.philosophy));
  const allMoods = new Set(analyses.flatMap(a => a.emotion.mood));
  
  console.log(`   Unique colors: ${allColors.size}`);
  console.log(`   Unique styles: ${allStyles.size}`);
  console.log(`   Unique moods: ${allMoods.size}`);
  
  console.log('\n🎯 Now the chatbot can understand queries like:');
  console.log('   - "Show me sophisticated white plates for fine dining"');
  console.log('   - "I need warm, inviting pieces for a bistro"');
  console.log('   - "Looking for modern minimalist Asian-inspired bowls"');
  console.log('   - "Show me bold, contemporary pieces for a luxury hotel"');
  console.log('   - "Traditional European style plates for classic restaurant"\n');
}

if (require.main === module) {
  analyzeAllProducts().catch(console.error).finally(() => process.exit(0));
}

export { analyzeAllProducts, analyzeProductWithAI };

