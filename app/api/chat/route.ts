import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, createEmbedding } from '@/lib/openai';
import { queryChunks } from '@/lib/chroma';
import { SYSTEM_PROMPT, createUserPromptWithContext } from '@/lib/prompts';
import { CHAT_MODEL, TOP_K, TEMPERATURE } from '@/lib/config';
import { ensureSeeded } from '@/lib/ensure-seeded';
import { 
  detectProductIntent, 
  searchProducts, 
  getProductsByCategory,
  getProductsByCollection,
  type ProductResult 
} from '@/lib/product-search';
import { analyzeQuery, buildSmartDatabaseQuery } from '@/lib/query-analyzer';
import { query as dbQuery } from '@/lib/postgres';
import { searchByAesthetic } from '@/lib/aesthetic-vector-store';
import { getResponseCache } from '@/lib/response-cache';
import { searchByAestheticProfile, extractAestheticQuery } from '@/lib/aesthetic-search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Maximum duration in seconds for Vercel serverless function

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
}

export async function POST(req: NextRequest) {
  try {
    // Ensure vector database is seeded (only runs once on first request)
    await ensureSeeded();

    const body: ChatRequest = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    const userQuery = lastUserMessage.content;

    // Check cache first for instant responses
    const cache = getResponseCache();
    const cached = cache.get(userQuery);
    
    if (cached) {
      console.log('⚡ Returning cached response (instant!)');
      return NextResponse.json({
        message: cached.message,
        sources: cached.sources,
        products: cached.products,
        cached: true,
      });
    }

    // OPTIMIZED: Fast parallel processing
    console.log('⚡ Fast processing...');
    
    const [queryEmbedding, productIntent, aestheticIntent] = await Promise.all([
      createEmbedding(userQuery),                 // Create embedding
      detectProductIntent(userQuery),             // Detect product intent
      Promise.resolve(extractAestheticQuery(userQuery)), // Check for aesthetic query
    ]);
    
    // Search for products and context in parallel
    let products: ProductResult[] = [];
    const relevantChunksPromise = queryChunks(queryEmbedding, TOP_K);
    
    // Try aesthetic search first for style-based queries
    if (aestheticIntent.hasAestheticIntent) {
      console.log('🎨 Aesthetic search detected...');
      const aestheticResults = await searchByAestheticProfile(userQuery, aestheticIntent.params, 5);
      
      if (aestheticResults.length > 0) {
        // Get product details for aesthetic matches
        const productIds = aestheticResults.map((r: any) => r.productId);
        try {
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
             WHERE id = ANY($1)`,
            [productIds]
          );

          products = productDetails.map(p => ({
            id: p.id,
            name: p.product_name,
            code: p.product_code,
            description: p.product_description || '',
            imageUrl: extractImageUrl(p.product_images),
            productUrl: `https://www.rakporcelain.com/${p.locale}/products/${p.product_code}`,
            material: p.material,
            shape: p.shape,
          }));
          
          console.log(`✅ ${products.length} aesthetic matches`);
        } catch (error) {
          console.error('Error fetching aesthetic product details:', error);
        }
      }
    }
    
    // Fallback to regular search if no aesthetic results
    if (products.length === 0 && productIntent.hasProductIntent) {
      const searchTerm = productIntent.searchTerm || 'plate';
      
      console.log(`🔍 Searching: ${searchTerm}`);
      
      if (productIntent.collection) {
        products = await getProductsByCollection(productIntent.collection, 5);
      } else if (productIntent.category) {
        products = await getProductsByCategory(productIntent.category, 5);
      } else {
        products = await searchProducts(searchTerm, 5);
      }
      
      // Final fallback: show random plates
      if (products.length === 0) {
        console.log('🎲 Showing random products...');
        products = await searchProducts('plate', 5);
      }
      
      console.log(`✅ ${products.length} products ready`);
    }

// Helper function for image extraction
function extractImageUrl(productImages: any): string {
  const placeholder = 'https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=RAK+Porcelain';
  if (!productImages) return placeholder;
  try {
    if (typeof productImages === 'string') {
      productImages = JSON.parse(productImages);
    }
    if (Array.isArray(productImages) && productImages.length > 0) {
      if (productImages[0].publicUrl) return productImages[0].publicUrl;
      if (productImages[0].url) return productImages[0].url;
    }
    if (productImages.publicUrl) return productImages.publicUrl;
    return placeholder;
  } catch {
    return placeholder;
  }
}

    // Get context results
    const relevantChunks = await relevantChunksPromise;

    if (relevantChunks.length === 0) {
      return NextResponse.json({
        message: "I apologize, but I don't have enough information to answer your question. Please contact RAK Porcelain customer support for assistance.",
        sources: [],
      });
    }

    console.log(`Found ${relevantChunks.length} relevant chunks`);

    // Step 3: Create context-enriched prompt
    const contextPrompt = createUserPromptWithContext(
      userQuery,
      relevantChunks.map(chunk => ({
        content: chunk.content,
        metadata: {
          url: chunk.metadata.url,
          title: chunk.metadata.title,
        },
      }))
    );

    // Enhance prompt if products are found
    let finalPrompt = contextPrompt;
    if (products.length > 0) {
      finalPrompt = `${contextPrompt}

IMPORTANT: I'm showing ${products.length} product images below your response.
Mention: "Check out the products shown below" or "I've displayed some options for you".
Keep response SHORT (2-3 sentences max) and END with a follow-up question!`;
    }

    // Step 5: Call OpenAI for completion
    const openai = getOpenAIClient();
    
    console.log('Calling OpenAI for completion...');
    
    // Build conversation history with explicit context
    const conversationMessages = [];
    
    // Enhanced system prompt with conversation awareness
    const contextAwareSystemPrompt = `${SYSTEM_PROMPT}

CONVERSATION CONTEXT:
You are in an ongoing conversation. The user has already asked ${Math.floor(messages.length / 2)} question(s).
Pay attention to what has been discussed and reference it naturally in your responses.
When user asks follow-up questions like "what about...", "tell me more", "and...?", acknowledge what you previously discussed.`;
    
    conversationMessages.push({ role: 'system' as const, content: contextAwareSystemPrompt });
    
    // Add all previous messages from the conversation (maintain full history)
    for (let i = 0; i < messages.length - 1; i++) {
      conversationMessages.push({
        role: messages[i].role as 'user' | 'assistant',
        content: messages[i].content
      });
    }
    
    // Add current user message with context
    conversationMessages.push({ role: 'user' as const, content: finalPrompt });
    
    console.log(`Conversation history: ${messages.length} total messages, ${conversationMessages.length} sent to AI`);
    
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: conversationMessages,
      temperature: TEMPERATURE,
      max_tokens: 300, // Reduced for faster, shorter responses
    });

    const assistantMessage = completion.choices[0]?.message?.content || 
      'I apologize, but I was unable to generate a response. Please try again.';

    // Extract unique source URLs
    const sources = Array.from(
      new Set(relevantChunks.map(chunk => chunk.metadata.url))
    ).slice(0, 3); // Limit to top 3 sources

    // Cache the response for future instant replies
    cache.set(userQuery, assistantMessage, sources, products.length > 0 ? products : undefined);

    return NextResponse.json({
      message: assistantMessage,
      sources,
      products: products.length > 0 ? products : undefined, // Include products if found
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('ChromaDB') || error.message.includes('collection')) {
        return NextResponse.json(
          { error: 'Database not initialized. Please run: npm run index' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

