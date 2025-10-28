#!/usr/bin/env tsx
/**
 * Advanced Visual Product Analysis with OpenAI GPT-4 Vision
 * Analyzes product images and maps to aesthetic training parameters
 */

import { query } from '../lib/postgres';
import { getOpenAIClient, createEmbeddings } from '../lib/openai';
import path from 'path';
import fs from 'fs';

interface ProductVisualAnalysis {
  productId: number;
  productName: string;
  productCode: string;
  imageUrl: string;
  
  // From CSV Template - Visual Analysis
  aestheticStyle: string[];           // e.g., Wabi-Sabi, Modern, Classic
  artMovementInfluence: string[];     // e.g., Minimalism, Art Deco, Bauhaus
  culturalInspiration: string[];      // e.g., Japanese, European, Middle Eastern
  motifPattern: string[];             // e.g., Textured/Organic, Geometric, Floral
  colorPalette: string[];             // e.g., Beige, White, Blue
  finishGlazeType: string;            // e.g., Matte, Glossy, Reactive Glaze
  texture: string;                    // e.g., Smooth, Rough, Ribbed
  edgeRimStyle: string;               // e.g., Irregular, Clean, Beveled
  formGeometry: string;               // e.g., Round, Square, Organic
  visualThemeKeywords: string[];      // e.g., Earthy, Elegant, Bold
  
  // Material & Production (from image)
  apparentMaterial: string;           // Porcelain, Stoneware, Ceramic
  productionMethod: string;           // Handmade, Industrial, Semi-handmade
  
  // Mood & Usage
  moodEmotionElicited: string[];      // e.g., Calm, Sophisticated, Playful
  culinaryCompatibility: string[];    // e.g., Japanese, French, Fusion
  lightingCompatibility: string[];    // e.g., Candlelight, Natural Light
  photographicValue: string;          // High, Medium, Low
  
  // Contextual
  intendedUse: string[];              // Fine Dining, Casual, Banquet
  targetIndustry: string[];           // Restaurant, Hotel, Home
  priceSegment: string;               // Luxury, Premium, Standard
  
  // AI Generated
  richVisualDescription: string;
  aestheticTagBundle: string[];
  keywordIndex: string[];
}

const VISION_ANALYSIS_PROMPT = `You are an expert in porcelain and ceramic design, art history, and visual aesthetics.

Analyze this product image in extreme detail and provide comprehensive aesthetic classification.

Visual Analysis Parameters:

1. AESTHETIC STYLE (choose 1-3):
   - Wabi-Sabi, Minimalist, Contemporary, Classic, Vintage, Rustic, Industrial, Art Deco, Scandinavian, Asian Fusion, Mediterranean, Middle Eastern

2. ART MOVEMENT INFLUENCE (choose 1-2):
   - Minimalism, Modernism, Bauhaus, Art Deco, Art Nouveau, Brutalism, Organic Modernism, Japanese Aesthetics, Functionalism

3. CULTURAL INSPIRATION (choose 1-3):
   - Japanese, Chinese, European, French, Italian, Middle Eastern, Scandinavian, Mediterranean, Global Fusion, American

4. MOTIF / PATTERN TYPE:
   - Textured/Organic, Geometric, Floral, Abstract, Ribbed, Embossed, Plain, Hand-painted, Reactive Glaze Pattern

5. COLOR PALETTE (list all visible colors):
   - Primary colors, Secondary colors, Accent colors

6. FINISH / GLAZE TYPE:
   - Matte, Glossy, Satin, Semi-Matte, Reactive Glaze, Textured Glaze, Crystalline

7. TEXTURE:
   - Smooth, Rough/Uneven, Ribbed, Embossed, Hand-crafted, Industrial-smooth

8. EDGE / RIM STYLE:
   - Clean/Sharp, Irregular/Organic, Beveled, Rounded, Rustic, Hand-finished

9. FORM GEOMETRY:
   - Round, Square, Rectangular, Oval, Organic/Irregular, Asymmetric

10. VISUAL THEME KEYWORDS (3-5 descriptive words):
    - e.g., Earthy, Elegant, Bold, Delicate, Rustic, Refined, Natural, Sophisticated

11. APPARENT MATERIAL:
    - Fine Porcelain, Bone China, Stoneware, Ceramic, Earthenware

12. PRODUCTION METHOD (based on visual cues):
    - Handmade (visible irregularities, organic feel)
    - Industrial (perfect symmetry, uniform)
    - Semi-handmade (handcrafted elements with industrial base)

13. MOOD / EMOTION ELICITED (2-3):
    - Calm, Sophisticated, Warm, Inviting, Bold, Serene, Rustic, Refined, Playful, Elegant

14. CULINARY COMPATIBILITY (which cuisines would this suit):
    - Japanese, French, Italian, Modern European, Asian Fusion, Middle Eastern, Contemporary American

15. LIGHTING COMPATIBILITY:
    - Candlelight, Natural Light, Bright Restaurant Lighting, Mood Lighting

16. PHOTOGRAPHIC VALUE:
    - High (very photogenic, Instagram-worthy)
    - Medium (presentable but standard)
    - Low (functional but not visually striking)

17. INTENDED USE (based on design):
    - Fine Dining, Casual Dining, Banquet, Cafe, Hotel, Home

18. TARGET INDUSTRY:
    - Fine Dining Restaurant, Casual Restaurant, Hotel, Catering, Retail/Home

19. PRICE SEGMENT (based on perceived quality):
    - Luxury, Premium, Mid-Range, Budget

20. RICH VISUAL DESCRIPTION:
    - 3-4 sentences describing the piece's aesthetic appeal, visual character, and ideal use context

21. AESTHETIC TAG BUNDLE:
    - 5-7 combined tags for search (e.g., "Wabi-Sabi + Earthy + Handmade")

22. KEYWORD INDEX:
    - 10-15 searchable keywords

Respond with JSON in this exact structure:
{
  "aestheticStyle": ["style1", "style2"],
  "artMovementInfluence": ["movement1"],
  "culturalInspiration": ["culture1", "culture2"],
  "motifPattern": ["pattern type"],
  "colorPalette": ["color1", "color2", "color3"],
  "finishGlazeType": "finish type",
  "texture": "texture description",
  "edgeRimStyle": "edge style",
  "formGeometry": "geometry",
  "visualThemeKeywords": ["keyword1", "keyword2", "keyword3"],
  "apparentMaterial": "material",
  "productionMethod": "method",
  "moodEmotionElicited": ["mood1", "mood2"],
  "culinaryCompatibility": ["cuisine1", "cuisine2", "cuisine3"],
  "lightingCompatibility": ["light1", "light2"],
  "photographicValue": "High/Medium/Low",
  "intendedUse": ["use1", "use2"],
  "targetIndustry": ["industry1", "industry2"],
  "priceSegment": "segment",
  "richVisualDescription": "detailed description here",
  "aestheticTagBundle": ["tag1", "tag2", "tag3"],
  "keywordIndex": ["keyword1", "keyword2", "..."]
}`;

async function analyzeProductImage(product: any): Promise<ProductVisualAnalysis | null> {
  const openai = getOpenAIClient();
  
  // Extract image URL
  let imageUrl = '';
  try {
    const images = product.product_images;
    if (typeof images === 'string') {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].publicUrl) {
        imageUrl = parsed[0].publicUrl;
      }
    } else if (Array.isArray(images) && images.length > 0 && images[0].publicUrl) {
      imageUrl = images[0].publicUrl;
    }
  } catch (error) {
    console.error(`Error extracting image for product ${product.id}:`, error);
  }

  if (!imageUrl) {
    console.log(`  ⚠️  No image available for ${product.product_name}`);
    return null;
  }

  console.log(`  🖼️  Analyzing: ${imageUrl.substring(0, 60)}...`);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // GPT-4 with vision
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'  // High detail for better analysis
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    return {
      productId: product.id,
      productName: product.product_name,
      productCode: product.product_code,
      imageUrl,
      ...analysis
    };
  } catch (error: any) {
    console.error(`  ❌ Error analyzing product ${product.id}:`, error.message);
    return null;
  }
}

async function analyzeAllProductsWithVision() {
  console.log('🎨 RAK Product Visual AI Analysis\n');
  console.log('📊 Training Schema: RAK Product Vector Training Data.csv\n');

  // Get products with images
  console.log('📦 Fetching products from database...');
  const products = await query(`
    SELECT id, product_name, product_code, material, material_finish,
           shape, description, product_description, locale, product_images,
           collection
    FROM products
    WHERE published_at IS NOT NULL
      AND product_images IS NOT NULL
    ORDER BY id
    LIMIT 100
  `);

  console.log(`✅ Found ${products.length} products with images\n`);

  const analyses: ProductVisualAnalysis[] = [];
  const vectorDocs: any[] = [];

  console.log('🤖 Analyzing with GPT-4 Vision (this will take 20-30 minutes)...\n');

  // Process in small batches to manage API rate limits
  const BATCH_SIZE = 3;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);

    console.log(`\n📊 Batch ${batchNum}/${totalBatches} (${batch.length} products)`);
    console.log('─'.repeat(60));

    // Analyze products sequentially within batch (vision API is heavy)
    for (const product of batch) {
      console.log(`\n  🔍 ${product.product_name} (${product.product_code})`);
      
      const analysis = await analyzeProductImage(product);
      
      if (analysis) {
        analyses.push(analysis);
        successCount++;
        console.log(`  ✅ Analysis complete`);
        
        // Create rich searchable text from analysis
        const searchableText = `
Product: ${analysis.productName} (${analysis.productCode})

VISUAL AESTHETICS:
${analysis.richVisualDescription}

Style: ${analysis.aestheticStyle.join(', ')}
Art Movement: ${analysis.artMovementInfluence.join(', ')}
Cultural Inspiration: ${analysis.culturalInspiration.join(', ')}

VISUAL CHARACTERISTICS:
Pattern: ${analysis.motifPattern.join(', ')}
Colors: ${analysis.colorPalette.join(', ')}
Finish: ${analysis.finishGlazeType}
Texture: ${analysis.texture}
Edge: ${analysis.edgeRimStyle}
Form: ${analysis.formGeometry}

MATERIAL & CRAFT:
Material: ${analysis.apparentMaterial}
Production: ${analysis.productionMethod}

EMOTIONAL & CONTEXTUAL:
Mood: ${analysis.moodEmotionElicited.join(', ')}
Theme: ${analysis.visualThemeKeywords.join(', ')}

CULINARY & USAGE:
Best for: ${analysis.culinaryCompatibility.join(', ')}
Lighting: ${analysis.lightingCompatibility.join(', ')}
Use Case: ${analysis.intendedUse.join(', ')}
Target: ${analysis.targetIndustry.join(', ')}
Segment: ${analysis.priceSegment}

PHOTOGENIC VALUE: ${analysis.photographicValue}

Tags: ${analysis.aestheticTagBundle.join(', ')}
Keywords: ${analysis.keywordIndex.join(', ')}
        `.trim();

        vectorDocs.push({
          id: `visual-${analysis.productId}`,
          content: searchableText,
          productId: analysis.productId,
          productName: analysis.productName,
          productCode: analysis.productCode,
          imageUrl: analysis.imageUrl,
          analysis: analysis,
          type: 'visual-analysis'
        });
      } else {
        failCount++;
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n  Progress: ${successCount} succeeded, ${failCount} failed`);
  }

  // Save analyses
  console.log('\n\n💾 Saving analysis results...');
  
  const analysisPath = path.join(process.cwd(), 'data', 'product-visual-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analyses, null, 2));
  console.log(`✅ Saved ${analyses.length} analyses to ${analysisPath}`);

  // Create embeddings for vector search
  console.log('\n🧠 Creating embeddings for visual search...');
  const texts = vectorDocs.map(doc => doc.content);
  const embeddings = await createEmbeddings(texts);

  vectorDocs.forEach((doc, idx) => {
    doc.embedding = embeddings[idx];
  });

  // Save visual vector database
  const vectorPath = path.join(process.cwd(), 'data', 'visual-vector-store.json');
  const vectorData = Object.fromEntries(vectorDocs.map(doc => [doc.id, doc]));
  fs.writeFileSync(vectorPath, JSON.stringify(vectorData, null, 2));

  console.log(`✅ Saved visual vector database to ${vectorPath}`);

  // Generate statistics
  console.log('\n\n📊 ANALYSIS STATISTICS');
  console.log('═'.repeat(60));
  console.log(`Total products analyzed: ${analyses.length}`);
  console.log(`Failed analyses: ${failCount}`);
  console.log(`Vector documents: ${vectorDocs.length}`);

  // Style distribution
  const allStyles = new Set(analyses.flatMap(a => a.aestheticStyle));
  const allCultures = new Set(analyses.flatMap(a => a.culturalInspiration));
  const allMoods = new Set(analyses.flatMap(a => a.moodEmotionElicited));
  
  console.log(`\nUnique aesthetic styles: ${allStyles.size}`);
  console.log(`Styles: ${Array.from(allStyles).slice(0, 10).join(', ')}...`);
  
  console.log(`\nUnique cultural inspirations: ${allCultures.size}`);
  console.log(`Cultures: ${Array.from(allCultures).join(', ')}`);
  
  console.log(`\nUnique moods: ${allMoods.size}`);
  console.log(`Moods: ${Array.from(allMoods).join(', ')}`);

  console.log('\n\n🎯 ADVANCED QUERIES NOW SUPPORTED:');
  console.log('─'.repeat(60));
  console.log('✓ "Show me Wabi-Sabi inspired pieces with earthy tones"');
  console.log('✓ "I need minimalist Japanese-style plates for fine dining"');
  console.log('✓ "Looking for bold, photogenic pieces with reactive glaze"');
  console.log('✓ "Find sophisticated European-inspired bowls for candlelight"');
  console.log('✓ "Show rustic, handmade pieces perfect for natural light"');
  console.log('✓ "Contemporary Asian fusion plates with matte finish"');

  console.log('\n✨ Visual AI Analysis Complete!\n');
}

if (require.main === module) {
  analyzeAllProductsWithVision()
    .catch(console.error)
    .finally(() => process.exit(0));
}

export { analyzeAllProductsWithVision, analyzeProductImage };

