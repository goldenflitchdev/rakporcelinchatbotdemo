import { estimateTokens } from './openai';
import { CHUNK_SIZE, CHUNK_OVERLAP } from './config';
import { createHash } from './utils';

export interface TextChunk {
  content: string;
  index: number;
  hash: string;
}

export function chunkText(
  text: string,
  maxTokens: number = CHUNK_SIZE,
  overlapTokens: number = CHUNK_OVERLAP
): TextChunk[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);

    // If single paragraph exceeds max, split by sentences
    if (paragraphTokens > maxTokens) {
      if (currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunks.length,
          hash: createHash(currentChunk.trim()),
        });
        currentChunk = '';
        currentTokens = 0;
      }

      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence);

        if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
          chunks.push({
            content: currentChunk.trim(),
            index: chunks.length,
            hash: createHash(currentChunk.trim()),
          });

          // Keep overlap
          const words = currentChunk.split(/\s+/);
          const overlapWords = Math.floor(words.length * (overlapTokens / maxTokens));
          currentChunk = words.slice(-overlapWords).join(' ') + ' ';
          currentTokens = estimateTokens(currentChunk);
        }

        currentChunk += sentence + ' ';
        currentTokens += sentenceTokens;
      }
    } else {
      // Normal paragraph processing
      if (currentTokens + paragraphTokens > maxTokens && currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunks.length,
          hash: createHash(currentChunk.trim()),
        });

        // Keep overlap
        const words = currentChunk.split(/\s+/);
        const overlapWords = Math.floor(words.length * (overlapTokens / maxTokens));
        currentChunk = words.slice(-overlapWords).join(' ') + '\n\n';
        currentTokens = estimateTokens(currentChunk);
      }

      currentChunk += paragraph + '\n\n';
      currentTokens += paragraphTokens;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunks.length,
      hash: createHash(currentChunk.trim()),
    });
  }

  return chunks;
}


