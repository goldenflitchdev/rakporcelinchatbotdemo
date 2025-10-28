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

    // OPTIMIZED: Skip AI analysis for speed, use simple detection
    console.log('⚡ Fast processing...');
    
    const [queryEmbedding, productIntent] = await Promise.all([
      createEmbedding(userQuery),                 // Create embedding
      detectProductIntent(userQuery),             // Detect product intent
    ]);
    
    // Search for products and context in parallel
    let products: ProductResult[] = [];
    const relevantChunksPromise = queryChunks(queryEmbedding, TOP_K);
    
    // ALWAYS try to find products if ANY product keyword detected
    if (productIntent.hasProductIntent) {
      const searchTerm = productIntent.searchTerm || 'plate'; // Default to plates
      
      console.log(`🔍 Searching: ${searchTerm}`);
      
      if (productIntent.collection) {
        products = await getProductsByCollection(productIntent.collection, 5);
      } else if (productIntent.category) {
        products = await getProductsByCategory(productIntent.category, 5);
      } else {
        products = await searchProducts(searchTerm, 5);
      }
      
      // Fallback: if no products found, show random plates
      if (products.length === 0) {
        console.log('🎲 No specific match, showing random products...');
        products = await searchProducts('plate', 5);
      }
      
      console.log(`✅ ${products.length} products ready`);
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

