import { z } from 'zod';

const configSchema = z.object({
  openaiApiKey: z.string().min(1, 'OPENAI_API_KEY is required'),
  rakBase: z.string().url().default('https://www.rakporcelain.com/us-en'),
  crawlMaxPages: z.coerce.number().default(1200),
  crawlConcurrency: z.coerce.number().default(6),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  // Database configuration (optional)
  dbHost: z.string().optional(),
  dbUser: z.string().optional(),
  dbPassword: z.string().optional(),
  dbPort: z.coerce.number().optional(),
  dbDatabase: z.string().optional(),
  nightlyUpdateTime: z.string().default('02:00'),
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
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PWD,
    dbPort: process.env.DB_PORT,
    dbDatabase: process.env.DB_DATABASE,
    nightlyUpdateTime: process.env.NIGHTLY_UPDATE_TIME,
  });

  cachedConfig = config;
  return config;
}

export const EMBEDDING_MODEL = 'text-embedding-3-large';
export const CHAT_MODEL = 'gpt-4o-mini';
export const COLLECTION_NAME = 'rakporcelain_us';
export const CHUNK_SIZE = 1000; // tokens
export const CHUNK_OVERLAP = 200; // tokens
export const TOP_K = 5; // Reduced from 8 for faster processing
export const TEMPERATURE = 0.3; // Slightly higher for more natural responses


