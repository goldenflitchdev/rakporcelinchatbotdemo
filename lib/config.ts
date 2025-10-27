import { z } from 'zod';

const configSchema = z.object({
  openaiApiKey: z.string().min(1, 'OPENAI_API_KEY is required'),
  rakBase: z.string().url().default('https://www.rakporcelain.com/us-en'),
  crawlMaxPages: z.coerce.number().default(1200),
  crawlConcurrency: z.coerce.number().default(6),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config = configSchema.parse({
    openaiApiKey: process.env.OPENAI_API_KEY,
    rakBase: process.env.RAK_BASE,
    crawlMaxPages: process.env.CRAWL_MAX_PAGES,
    crawlConcurrency: process.env.CRAWL_CONCURRENCY,
    nodeEnv: process.env.NODE_ENV,
  });

  cachedConfig = config;
  return config;
}

export const EMBEDDING_MODEL = 'text-embedding-3-large';
export const CHAT_MODEL = 'gpt-4o-mini';
export const COLLECTION_NAME = 'rakporcelain_us';
export const CHUNK_SIZE = 1000; // tokens
export const CHUNK_OVERLAP = 200; // tokens
export const TOP_K = 8;
export const TEMPERATURE = 0.2;


