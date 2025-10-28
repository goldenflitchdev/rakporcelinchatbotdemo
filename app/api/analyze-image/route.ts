import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { searchByVisualCharacteristics } from '@/lib/visual-search';
import { query as dbQuery } from '@/lib/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const IMAGE_ANALYSIS_PROMPT = `You are an expert in porcelain and ceramic design aesthetics.

Analyze this image and describe the visual characteristics, style, and aesthetic qualities you observe.

Focus on:
1. Overall aesthetic style (minimalist, rustic, contemporary, classic, etc.)
2. Cultural influences (Japanese, European, Middle Eastern, etc.)
3. Colors and color palette
4. Finish and texture (matte, glossy, textured, smooth)
5. Form and geometry (round, organic, geometric)
6. Mood and emotional quality (elegant, warm, bold, serene)
7. Pattern or decorative elements
8. Material appearance (porcelain, stoneware, ceramic)
9. Production quality (handmade, industrial, artisanal)
10. Use context (fine dining, casual, specific cuisine type)

Provide a comprehensive description that will help match this to similar products.

Respond with JSON in this format:
{
  "summary": "Brief 2-3 sentence description of what you see",
  "aestheticStyle": ["style1", "style2"],
  "culturalInfluence": ["culture1", "culture2"],
  "colorPalette": ["color1", "color2", "color3"],
  "finish": "matte/glossy/etc",
  "texture": "description",
  "mood": ["mood1", "mood2"],
  "formGeometry": "description",
  "searchQuery": "A natural language search query to find similar products"
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('🖼️  Analyzing uploaded image...');

    const openai = getOpenAIClient();

    // Analyze image with GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: IMAGE_ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: image, // Base64 or URL
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    console.log('✅ Image analysis:', analysis);

    // Search for matching products using the analysis
    const searchQuery = analysis.searchQuery || analysis.summary;
    console.log('🔍 Searching for:', searchQuery);

    // Try visual search first
    let products: any[] = [];
    
    try {
      const visualResults = await searchByVisualCharacteristics(
        searchQuery,
        {
          aestheticStyle: analysis.aestheticStyle,
          culturalInspiration: analysis.culturalInfluence,
          colorPalette: analysis.colorPalette,
          mood: analysis.mood,
          finish: analysis.finish ? [analysis.finish] : undefined,
        },
        5
      );

      if (visualResults.length > 0) {
        // Get full product details
        const productIds = visualResults.map((r: any) => r.productId);
        
        const productDetails = await dbQuery<{
          id: number;
          product_name: string;
          product_code: string;
          product_description: string;
          product_images: any;
          locale: string;
          material: string;
          shape: string;
        }>(
          `SELECT id, product_name, product_code, product_description,
                  product_images, locale, material, shape
           FROM products
           WHERE id = ANY($1)
           LIMIT 5`,
          [productIds]
        );

        products = productDetails.map(p => {
          let imageUrl = 'https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=RAK+Porcelain';
          try {
            const images = p.product_images;
            if (typeof images === 'string') {
              const parsed = JSON.parse(images);
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].publicUrl) {
                imageUrl = parsed[0].publicUrl;
              }
            } else if (Array.isArray(images) && images.length > 0 && images[0].publicUrl) {
              imageUrl = images[0].publicUrl;
            }
          } catch (error) {
            console.error('Error extracting image:', error);
          }

          return {
            id: p.id,
            name: p.product_name,
            code: p.product_code,
            description: p.product_description || '',
            imageUrl,
            productUrl: `https://www.rakporcelain.com/${p.locale}/products/${p.product_code}`,
            material: p.material,
            shape: p.shape,
          };
        });

        console.log(`✅ Found ${products.length} matching products`);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }

    return NextResponse.json({
      analysis,
      products,
      message: products.length > 0 
        ? `Based on your image, I found ${products.length} similar products that match the ${analysis.aestheticStyle?.join(' and ')} style you're looking for.`
        : `I analyzed your image and found it has a ${analysis.aestheticStyle?.join(' and ')} aesthetic. Let me search for similar products for you.`
    });

  } catch (error: any) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

