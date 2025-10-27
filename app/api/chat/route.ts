import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, createEmbedding } from '@/lib/openai';
import { queryChunks } from '@/lib/chroma';
import { SYSTEM_PROMPT, createUserPromptWithContext } from '@/lib/prompts';
import { CHAT_MODEL, TOP_K, TEMPERATURE } from '@/lib/config';
import { ensureSeeded } from '@/lib/ensure-seeded';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Step 1: Create embedding for the user query
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

    // Step 4: Call OpenAI for completion
    const openai = getOpenAIClient();
    
    console.log('Calling OpenAI for completion...');
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(0, -1), // Include conversation history (except last user message)
        { role: 'user', content: contextPrompt }, // Use context-enriched prompt
      ],
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

