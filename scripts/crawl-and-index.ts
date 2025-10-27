#!/usr/bin/env tsx
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import slugify from 'slugify';
import { getConfig } from '../lib/config';
import { createEmbeddings } from '../lib/openai';
import { upsertChunks, type DocumentChunk } from '../lib/chroma';
import { chunkText } from '../lib/chunker';
import { sanitizeUrl } from '../lib/utils';
import fs from 'fs';
import path from 'path';

interface CrawlResult {
  url: string;
  title: string;
  content: string;
  headings: string[];
  lastmod?: string;
  success: boolean;
  error?: string;
}

interface IndexReport {
  timestamp: string;
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  totalChunks: number;
  failedUrls: string[];
  stats: {
    avgChunksPerPage: number;
    totalTokens: number;
  };
}

const EXCLUDED_PATTERNS = [
  /\/cart/i,
  /\/checkout/i,
  /\/login/i,
  /\/register/i,
  /\/account/i,
  /\/admin/i,
  /\.(pdf|jpg|jpeg|png|gif|svg|zip|exe)$/i,
];

const RELEVANT_SECTIONS = [
  'product',
  'collection',
  'catalog',
  'care',
  'warranty',
  'shipping',
  'return',
  'certificate',
  'compliance',
  'blog',
  'article',
  'news',
  'about',
  'contact',
  'b2b',
  'wholesale',
  'store',
  'retailer',
];

function shouldCrawlUrl(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const base = new URL(baseUrl);

    // Must be same origin
    if (parsed.origin !== base.origin) {
      return false;
    }

    // Must start with base path
    if (!parsed.pathname.startsWith(base.pathname.replace(/\/$/, ''))) {
      return false;
    }

    // Check excluded patterns
    if (EXCLUDED_PATTERNS.some(pattern => pattern.test(url))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function fetchSitemap(baseUrl: string): Promise<string[]> {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      console.log(`Fetching sitemap: ${sitemapUrl}`);
      const response = await fetch(sitemapUrl);
      
      if (!response.ok) {
        continue;
      }

      const xml = await response.text();
      const urls: string[] = [];

      // Parse sitemap XML
      const $ = cheerio.load(xml, { xmlMode: true });

      // Check for sitemap index
      $('sitemap > loc').each((_, elem) => {
        const loc = $(elem).text().trim();
        if (loc) {
          urls.push(loc);
        }
      });

      // If sitemap index found, recursively fetch
      if (urls.length > 0) {
        const allUrls: string[] = [];
        for (const url of urls) {
          try {
            const nestedUrls = await fetchSitemap(url);
            allUrls.push(...nestedUrls);
          } catch {
            console.warn(`Failed to fetch nested sitemap: ${url}`);
          }
        }
        return allUrls;
      }

      // Parse regular sitemap
      $('url > loc').each((_, elem) => {
        const loc = $(elem).text().trim();
        if (loc && shouldCrawlUrl(loc, baseUrl)) {
          urls.push(loc);
        }
      });

      if (urls.length > 0) {
        console.log(`Found ${urls.length} URLs in sitemap`);
        return urls;
      }
    } catch (error) {
      console.warn(`Failed to fetch sitemap ${sitemapUrl}:`, error);
    }
  }

  return [];
}

async function crawlPage(url: string): Promise<CrawlResult> {
  try {
    console.log(`Crawling: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RAK-Porcelain-Bot/1.0 (Customer Support Chatbot)',
      },
    });

    if (!response.ok) {
      return {
        url,
        title: '',
        content: '',
        headings: [],
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove script, style, nav, footer, and other noise
    const selectorsToRemove = [
      'script',
      'style',
      'nav',
      'footer',
      'header[role="banner"]',
      '.navigation',
      '.menu',
      '.footer',
      '.cookie-notice',
      '.popup',
      '[aria-hidden="true"]',
    ];

    selectorsToRemove.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Extract title
    const title = document.querySelector('title')?.textContent?.trim() || 
                  document.querySelector('h1')?.textContent?.trim() || 
                  'Untitled';

    // Extract headings for context
    const headings: string[] = [];
    document.querySelectorAll('h1, h2, h3').forEach(h => {
      const text = h.textContent?.trim();
      if (text) {
        headings.push(text);
      }
    });

    // Extract main content
    const mainSelectors = ['main', '[role="main"]', 'article', '.content', '.main-content', 'body'];
    let contentElement: Element | null = null;

    for (const selector of mainSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }

    if (!contentElement) {
      contentElement = document.body;
    }

    // Extract text content
    let content = contentElement.textContent || '';
    
    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return {
      url,
      title,
      content,
      headings,
      success: true,
    };
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    return {
      url,
      title: '',
      content: '',
      headings: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  console.log('🚀 Starting RAK Porcelain crawler and indexer...\n');

  const config = getConfig();
  const { rakBase, crawlMaxPages, crawlConcurrency } = config;

  // Step 1: Fetch URLs from sitemap or crawl
  console.log('📋 Fetching URLs...');
  let urls = await fetchSitemap(rakBase);

  if (urls.length === 0) {
    console.log('⚠️  No sitemap found, falling back to base URL');
    urls = [rakBase];
  }

  // Limit to max pages
  urls = urls.slice(0, crawlMaxPages);
  console.log(`📊 Will crawl ${urls.length} URLs\n`);

  // Step 2: Crawl pages
  console.log('🕷️  Crawling pages...');
  const limit = pLimit(crawlConcurrency);
  const crawlResults = await Promise.all(
    urls.map(url => limit(() => crawlPage(url)))
  );

  const successfulResults = crawlResults.filter(r => r.success && r.content.length > 100);
  const failedUrls = crawlResults.filter(r => !r.success).map(r => r.url);

  console.log(`✅ Successfully crawled ${successfulResults.length} pages`);
  console.log(`❌ Failed to crawl ${failedUrls.length} pages\n`);

  // Step 3: Chunk content
  console.log('✂️  Chunking content...');
  const allChunks: DocumentChunk[] = [];
  const seenHashes = new Set<string>();

  for (const result of successfulResults) {
    const chunks = chunkText(result.content);
    
    for (const chunk of chunks) {
      // Deduplicate
      if (seenHashes.has(chunk.hash)) {
        continue;
      }
      seenHashes.add(chunk.hash);

      const docChunk: DocumentChunk = {
        id: `${slugify(result.url, { lower: true, strict: true })}-chunk-${chunk.index}`,
        content: chunk.content,
        metadata: {
          url: result.url,
          title: result.title,
          heading: result.headings[0],
          section: determineSection(result.url),
          lang: 'en',
          lastmod: result.lastmod,
          chunkIndex: chunk.index,
          totalChunks: chunks.length,
        },
      };

      allChunks.push(docChunk);
    }
  }

  console.log(`📦 Created ${allChunks.length} unique chunks\n`);

  // Step 4: Create embeddings
  console.log('🧮 Creating embeddings...');
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map(c => c.content);
    
    console.log(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allChunks.length / BATCH_SIZE)}...`);
    
    const embeddings = await createEmbeddings(texts);
    
    batch.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('✅ Embeddings created\n');

  // Step 5: Upsert to Chroma
  console.log('💾 Upserting to Chroma...');
  const UPSERT_BATCH_SIZE = 100;

  for (let i = 0; i < allChunks.length; i += UPSERT_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + UPSERT_BATCH_SIZE);
    console.log(`  Upserting batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}/${Math.ceil(allChunks.length / UPSERT_BATCH_SIZE)}...`);
    await upsertChunks(batch);
  }

  console.log('✅ Upsert complete\n');

  // Step 6: Generate report
  const report: IndexReport = {
    timestamp: new Date().toISOString(),
    totalPages: urls.length,
    successfulPages: successfulResults.length,
    failedPages: failedUrls.length,
    totalChunks: allChunks.length,
    failedUrls,
    stats: {
      avgChunksPerPage: allChunks.length / successfulResults.length,
      totalTokens: allChunks.reduce((sum, c) => sum + c.content.length / 4, 0),
    },
  };

  const reportPath = path.join(process.cwd(), 'data', 'index-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('📊 Index Report:');
  console.log(`   Total pages: ${report.totalPages}`);
  console.log(`   Successful: ${report.successfulPages}`);
  console.log(`   Failed: ${report.failedPages}`);
  console.log(`   Total chunks: ${report.totalChunks}`);
  console.log(`   Avg chunks/page: ${report.stats.avgChunksPerPage.toFixed(2)}`);
  console.log(`   Report saved to: ${reportPath}\n`);

  console.log('✨ Indexing complete!');
}

function determineSection(url: string): string {
  const urlLower = url.toLowerCase();
  
  for (const section of RELEVANT_SECTIONS) {
    if (urlLower.includes(section)) {
      return section;
    }
  }
  
  return 'general';
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as crawlAndIndex };


