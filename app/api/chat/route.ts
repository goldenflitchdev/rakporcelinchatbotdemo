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

    // Step 1: Detect if user is asking about products
    const productIntent = await detectProductIntent(userQuery);
    let products: ProductResult[] = [];

    if (productIntent.hasProductIntent) {
      console.log('Product intent detected:', productIntent);
      
      // Search for relevant products
      if (productIntent.collection) {
        products = await getProductsByCollection(productIntent.collection, 5);
      } else if (productIntent.category) {
        products = await getProductsByCategory(productIntent.category, 5);
      } else if (productIntent.searchTerm) {
        products = await searchProducts(productIntent.searchTerm, 5);
      }
      
      console.log(`Found ${products.length} relevant products`);
    }

    // Step 2: Create embedding for the user query
    console.log('Creating embedding for query:', userQuery);
    const queryEmbedding = await createEmbedding(userQuery);

    // Step 2: Query ChromaDB for relevant chunks
    console.log('Querying ChromaDB for relevant chunks...');
    const relevantChunks = await queryChunks(queryEmbedding, TOP_K);

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

    // Step 4: Enhance prompt if products are found
    let finalPrompt = contextPrompt;
    if (products.length > 0) {
      finalPrompt = `${contextPrompt}

IMPORTANT: I'm showing the user ${products.length} product thumbnails below your response. 
Reference these products naturally in your answer. Mention that they can "see the products shown below" 
or "check out the items displayed" or similar natural phrasing.

Products being shown:
${products.map(p => `- ${p.name} (${p.code})`).join('\n')}

Remember: Keep your response conversational, break into short paragraphs, and end with an engaging 
follow-up question!`;
    }

    // Step 5: Call OpenAI for completion
    const openai = getOpenAIClient();
    
    console.log('Calling OpenAI for completion...');
    
    // Build conversation history properly
    const conversationMessages = [];
    
    // Add system prompt
    conversationMessages.push({ role: 'system' as const, content: SYSTEM_PROMPT });
    
    // Add all previous messages from the conversation
    for (let i = 0; i < messages.length - 1; i++) {
      conversationMessages.push({
        role: messages[i].role as 'user' | 'assistant',
        content: messages[i].content
      });
    }
    
    // Add current user message with context
    conversationMessages.push({ role: 'user' as const, content: finalPrompt });
    
    console.log(`Conversation history: ${conversationMessages.length} messages`);
    
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: conversationMessages,
      temperature: TEMPERATURE,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 
      'I apologize, but I was unable to generate a response. Please try again.';

    // Extract unique source URLs
    const sources = Array.from(
      new Set(relevantChunks.map(chunk => chunk.metadata.url))
    ).slice(0, 3); // Limit to top 3 sources

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

