#!/usr/bin/env tsx
/**
 * Intelligent Database Crawler for RAK Porcelain
 * Crawls PostgreSQL database and builds vector embeddings
 */

import { query, testConnection, closePool } from '../lib/postgres';
import { createEmbeddings } from '../lib/openai';
import { upsertChunks, type DocumentChunk } from '../lib/chroma';
import { chunkText } from '../lib/chunker';
import fs from 'fs';
import path from 'path';

interface SyncReport {
  timestamp: string;
  tablesProcessed: number;
  totalRecords: number;
  totalChunks: number;
  errors: string[];
  stats: {
    products: number;
    categories: number;
    collections: number;
    blogs: number;
    other: number;
  };
}

async function syncDatabase() {
  console.log('🔄 Starting RAK Porcelain Database Sync...\n');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }

  const report: SyncReport = {
    timestamp: new Date().toISOString(),
    tablesProcessed: 0,
    totalRecords: 0,
    totalChunks: 0,
    errors: [],
    stats: {
      products: 0,
      categories: 0,
      collections: 0,
      blogs: 0,
      other: 0,
    },
  };

  console.log('📊 Crawling key tables...\n');

  try {
    // 1. Products
    await crawlProducts(report);

    // 2. Categories
    await crawlCategories(report);

    // 3. Collections
    await crawlCollections(report);

    // 4. Blogs/News
    await crawlBlogs(report);

    // 5. Product Types
    await crawlProductTypes(report);

    // 6. Novelties
    await crawlNovelties(report);

    // 7. Events
    await crawlEvents(report);

    // 8. Sustainability
    await crawlSustainability(report);

    // 9. Contact/Support
    await crawlContactInfo(report);

  } catch (error) {
    console.error('Error during sync:', error);
    report.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  // Save report
  const reportPath = path.join(process.cwd(), 'data', 'db-sync-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n📊 Sync Report:');
  console.log(`   Tables processed: ${report.tablesProcessed}`);
  console.log(`   Total records: ${report.totalRecords}`);
  console.log(`   Total chunks: ${report.totalChunks}`);
  console.log(`   Products: ${report.stats.products}`);
  console.log(`   Categories: ${report.stats.categories}`);
  console.log(`   Collections: ${report.stats.collections}`);
  console.log(`   Blogs: ${report.stats.blogs}`);
  console.log(`   Errors: ${report.errors.length}`);
  console.log(`   Report saved: ${reportPath}\n`);

  await closePool();
  console.log('✅ Database sync complete!\n');
}

async function crawlProducts(report: SyncReport) {
  console.log('📦 Crawling products...');
  
  const products = await query<{
    id: number;
    product_name: string;
    product_description: string;
    description: string;
    specifications: string;
    product_code: string;
    locale: string;
    updated_at: string;
    material: string;
    shape: string;
    is_microwave_safe: boolean;
    is_dishwasher_safe: boolean;
    capacity: string;
  }>(
    `SELECT id, product_name, product_description, description, specifications, 
            product_code, locale, updated_at, material, shape, 
            is_microwave_safe, is_dishwasher_safe, capacity
     FROM products
     WHERE published_at IS NOT NULL
     ORDER BY updated_at DESC
     LIMIT 500`
  );

  console.log(`   Found ${products.length} products`);
  report.stats.products = products.length;
  report.totalRecords += products.length;

  const chunks: DocumentChunk[] = [];

  for (const product of products) {
    const safetyInfo = [];
    if (product.is_microwave_safe) safetyInfo.push('Microwave safe');
    if (product.is_dishwasher_safe) safetyInfo.push('Dishwasher safe');
    
    const content = `
Product: ${product.product_name}
Code: ${product.product_code || 'N/A'}
${product.material ? `Material: ${product.material}` : ''}
${product.shape ? `Shape: ${product.shape}` : ''}
${product.capacity ? `Capacity: ${product.capacity}` : ''}
${safetyInfo.length > 0 ? `Features: ${safetyInfo.join(', ')}` : ''}
Description: ${product.product_description || product.description || ''}
Specifications: ${product.specifications || ''}
    `.trim();

    if (content.length < 50) continue;

    const textChunks = chunkText(content);

    for (const chunk of textChunks) {
      chunks.push({
        id: `product-${product.id}-chunk-${chunk.index}`,
        content: chunk.content,
        metadata: {
          url: `https://www.rakporcelain.com/${product.locale}/products/${product.product_code || product.id}`,
          title: product.product_name,
          heading: 'Product Information',
          section: 'product',
          lang: product.locale,
          chunkIndex: chunk.index,
          totalChunks: textChunks.length,
        },
        embedding: undefined,
      });
    }
  }

  if (chunks.length > 0) {
    console.log(`   Creating embeddings for ${chunks.length} chunks...`);
    const embeddings = await createEmbeddings(chunks.map(c => c.content));
    chunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });

    console.log('   Upserting to vector store...');
    await upsertChunks(chunks);
    report.totalChunks += chunks.length;
  }

  report.tablesProcessed++;
  console.log(`   ✅ Products complete (${chunks.length} chunks)\n`);
}

async function crawlCategories(report: SyncReport) {
  console.log('📂 Crawling categories...');

  const categories = await query<{
    id: number;
    name: string;
    description: string;
    locale: string;
    seo_title: string;
    seo_description: string;
  }>(
    `SELECT id, name, description, locale, seo_title, seo_description
     FROM categories
     WHERE published_at IS NOT NULL
     LIMIT 200`
  );

  console.log(`   Found ${categories.length} categories`);
  report.stats.categories = categories.length;
  report.totalRecords += categories.length;

  const chunks: DocumentChunk[] = [];

  for (const category of categories) {
    const content = `
Category: ${category.name}
Description: ${category.description || category.seo_description || 'No description'}
    `.trim();

    if (content.length < 30) continue;

    chunks.push({
      id: `category-${category.id}`,
      content,
      metadata: {
        url: `https://www.rakporcelain.com/${category.locale}/products?category=${category.name}`,
        title: category.seo_title || category.name,
        heading: 'Category',
        section: 'catalog',
        lang: category.locale,
        chunkIndex: 0,
        totalChunks: 1,
      },
      embedding: undefined,
    });
  }

  if (chunks.length > 0) {
    console.log(`   Creating embeddings for ${chunks.length} chunks...`);
    const embeddings = await createEmbeddings(chunks.map(c => c.content));
    chunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });

    await upsertChunks(chunks);
    report.totalChunks += chunks.length;
  }

  report.tablesProcessed++;
  console.log(`   ✅ Categories complete (${chunks.length} chunks)\n`);
}

async function crawlCollections(report: SyncReport) {
  console.log('🎨 Crawling collections...');

  const collections = await query<{
    id: number;
    collection_name: string;
    description: string;
    locale: string;
    seo_title: string;
    seo_description: string;
    value: string;
  }>(
    `SELECT id, collection_name, description, locale, seo_title, seo_description, value
     FROM collections
     WHERE published_at IS NOT NULL`
  );

  console.log(`   Found ${collections.length} collections`);
  report.stats.collections = collections.length;
  report.totalRecords += collections.length;

  const chunks: DocumentChunk[] = [];

  for (const collection of collections) {
    const content = `
Collection: ${collection.collection_name}
Description: ${collection.description || collection.seo_description || 'No description'}
    `.trim();

    if (content.length < 30) continue;

    chunks.push({
      id: `collection-${collection.id}`,
      content,
      metadata: {
        url: `https://www.rakporcelain.com/${collection.locale}/collections/${collection.value || collection.id}`,
        title: collection.seo_title || collection.collection_name,
        heading: 'Collection',
        section: 'collection',
        lang: collection.locale,
        chunkIndex: 0,
        totalChunks: 1,
      },
      embedding: undefined,
    });
  }

  if (chunks.length > 0) {
    console.log(`   Creating embeddings for ${chunks.length} chunks...`);
    const embeddings = await createEmbeddings(chunks.map(c => c.content));
    chunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });

    await upsertChunks(chunks);
    report.totalChunks += chunks.length;
  }

  report.tablesProcessed++;
  console.log(`   ✅ Collections complete (${chunks.length} chunks)\n`);
}

async function crawlBlogs(report: SyncReport) {
  console.log('📰 Crawling blogs/news...');

  const blogs = await query<{
    id: number;
    title: string;
    body: string;
    locale: string;
    is_trending: boolean;
    updated_at: string;
  }>(
    `SELECT id, title, body, locale, is_trending, updated_at
     FROM blogs
     WHERE published_at IS NOT NULL
     ORDER BY updated_at DESC
     LIMIT 100`
  );

  console.log(`   Found ${blogs.length} blog posts`);
  report.stats.blogs = blogs.length;
  report.totalRecords += blogs.length;

  const chunks: DocumentChunk[] = [];

  for (const blog of blogs) {
    if (!blog.body || blog.body.length < 100) continue;

    const textChunks = chunkText(blog.body);

    for (const chunk of textChunks) {
      chunks.push({
        id: `blog-${blog.id}-chunk-${chunk.index}`,
        content: `${blog.title}\n\n${chunk.content}`,
        metadata: {
          url: `https://www.rakporcelain.com/${blog.locale}/news/${blog.id}`,
          title: blog.title,
          heading: 'News & Blog',
          section: 'blog',
          lang: blog.locale,
          chunkIndex: chunk.index,
          totalChunks: textChunks.length,
        },
        embedding: undefined,
      });
    }
  }

  if (chunks.length > 0) {
    console.log(`   Creating embeddings for ${chunks.length} chunks...`);
    
    // Process in batches to avoid rate limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await createEmbeddings(batch.map(c => c.content));
      batch.forEach((chunk, idx) => {
        chunk.embedding = embeddings[idx];
      });
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    await upsertChunks(chunks);
    report.totalChunks += chunks.length;
  }

  report.tablesProcessed++;
  console.log(`   ✅ Blogs complete (${chunks.length} chunks)\n`);
}

async function crawlProductTypes(report: SyncReport) {
  console.log('🏷️  Crawling product types...');

  const productTypes = await query<{
    id: number;
    type: string;
    locale: string;
  }>(
    `SELECT id, type, locale
     FROM product_types
     WHERE published_at IS NOT NULL`
  );

  console.log(`   Found ${productTypes.length} product types`);
  report.totalRecords += productTypes.length;

  const chunks: DocumentChunk[] = [];

  for (const type of productTypes) {
    const content = `Product Type: ${type.type}`.trim();
    if (content.length < 10) continue;

    chunks.push({
      id: `product-type-${type.id}`,
      content,
      metadata: {
        url: `https://www.rakporcelain.com/${type.locale}/products`,
        title: type.type,
        heading: 'Product Types',
        section: 'product',
        lang: type.locale,
        chunkIndex: 0,
        totalChunks: 1,
      },
      embedding: undefined,
    });
  }

  if (chunks.length > 0) {
    const embeddings = await createEmbeddings(chunks.map(c => c.content));
    chunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });
    await upsertChunks(chunks);
    report.totalChunks += chunks.length;
  }

  report.tablesProcessed++;
  report.stats.other += productTypes.length;
  console.log(`   ✅ Product types complete (${chunks.length} chunks)\n`);
}

async function crawlNovelties(report: SyncReport) {
  console.log('✨ Crawling novelties...');

  const novelties = await query<{
    id: number;
    heading: string;
    description: string;
    locale: string;
  }>(
    `SELECT id, heading, description, locale
     FROM novelties
     WHERE published_at IS NOT NULL
     LIMIT 100`
  );

  console.log(`   Found ${novelties.length} novelties`);
  report.totalRecords += novelties.length;

  const chunks: DocumentChunk[] = [];

  for (const novelty of novelties) {
    const content = `
Novelty: ${novelty.heading}
Description: ${novelty.description || ''}
    `.trim();

    if (content.length < 30) continue;

    chunks.push({
      id: `novelty-${novelty.id}`,
      content,
      metadata: {
        url: `https://www.rakporcelain.com/${novelty.locale}/novelties/${novelty.id}`,
        title: novelty.heading,
        heading: 'New Products',
        section: 'novelty',
        lang: novelty.locale,
        chunkIndex: 0,
        totalChunks: 1,
      },
      embedding: undefined,
    });
  }

  if (chunks.length > 0) {
    const embeddings = await createEmbeddings(chunks.map(c => c.content));
    chunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });
    await upsertChunks(chunks);
    report.totalChunks += chunks.length;
  }

  report.tablesProcessed++;
  report.stats.other += novelties.length;
  console.log(`   ✅ Novelties complete (${chunks.length} chunks)\n`);
}

async function crawlEvents(report: SyncReport) {
  console.log('📅 Crawling events...');

  const events = await query<{
    id: number;
    heading: string;
    description: string;
    venue: string;
    locale: string;
  }>(
    `SELECT id, heading, description, venue, locale
     FROM events
     WHERE published_at IS NOT NULL
     ORDER BY date DESC
     LIMIT 50`
  );

  console.log(`   Found ${events.length} events`);
  report.totalRecords += events.length;

  const chunks: DocumentChunk[] = [];

  for (const event of events) {
    const content = `
Event: ${event.heading}
Description: ${event.description || ''}
Venue: ${event.venue || ''}
    `.trim();

    if (content.length < 30) continue;

    chunks.push({
      id: `event-${event.id}`,
      content,
      metadata: {
        url: `https://www.rakporcelain.com/${event.locale}/events/${event.id}`,
        title: event.heading,
        heading: 'Events',
        section: 'events',
        lang: event.locale,
        chunkIndex: 0,
        totalChunks: 1,
      },
      embedding: undefined,
    });
  }

  if (chunks.length > 0) {
    const embeddings = await createEmbeddings(chunks.map(c => c.content));
    chunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });
    await upsertChunks(chunks);
    report.totalChunks += chunks.length;
  }

  report.tablesProcessed++;
  report.stats.other += events.length;
  console.log(`   ✅ Events complete (${chunks.length} chunks)\n`);
}

async function crawlSustainability(report: SyncReport) {
  console.log('🌱 Crawling sustainability info...');

  const sustainability = await query<{
    id: number;
    title: string;
    description: string;
    locale: string;
  }>(
    `SELECT id, title, description, locale
     FROM sustainibilities
     WHERE published_at IS NOT NULL`
  );

  console.log(`   Found ${sustainability.length} sustainability entries`);
  report.totalRecords += sustainability.length;

  const chunks: DocumentChunk[] = [];

  for (const item of sustainability) {
    const content = `${item.title}\n\n${item.description || ''}`.trim();
    if (content.length < 50) continue;

    const textChunks = chunkText(content);
    for (const chunk of textChunks) {
      chunks.push({
        id: `sustainability-${item.id}-chunk-${chunk.index}`,
        content: chunk.content,
        metadata: {
          url: `https://www.rakporcelain.com/${item.locale}/sustainability`,
          title: item.title,
          heading: 'Sustainability',
          section: 'sustainability',
          lang: item.locale,
          chunkIndex: chunk.index,
          totalChunks: textChunks.length,
        },
        embedding: undefined,
      });
    }
  }

  if (chunks.length > 0) {
    const embeddings = await createEmbeddings(chunks.map(c => c.content));
    chunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });
    await upsertChunks(chunks);
    report.totalChunks += chunks.length;
  }

  report.tablesProcessed++;
  report.stats.other += sustainability.length;
  console.log(`   ✅ Sustainability complete (${chunks.length} chunks)\n`);
}

async function crawlContactInfo(report: SyncReport) {
  console.log('📞 Crawling contact information...');

  // Get contact pages
  const contacts = await query<{
    id: number;
    locale: string;
  }>(
    `SELECT id, locale FROM contactuses WHERE published_at IS NOT NULL`
  );

  console.log(`   Found ${contacts.length} contact pages`);

  // Contact info is usually in system constants or footer
  const systemData = await query<{
    id: number;
    contact_us: any;
    footer: any;
    locale: string;
  }>(
    `SELECT id, contact_us, footer, locale FROM systemconstants LIMIT 5`
  );

  const chunks: DocumentChunk[] = [];

  // Process contact info from system constants
  for (const sys of systemData) {
    if (sys.contact_us) {
      const content = `Contact Information: ${JSON.stringify(sys.contact_us)}`;
      chunks.push({
        id: `contact-${sys.id}`,
        content,
        metadata: {
          url: `https://www.rakporcelain.com/${sys.locale}/contact`,
          title: 'Contact Us',
          heading: 'Contact Information',
          section: 'contact',
          lang: sys.locale,
          chunkIndex: 0,
          totalChunks: 1,
        },
        embedding: undefined,
      });
    }
  }

  if (chunks.length > 0) {
    const embeddings = await createEmbeddings(chunks.map(c => c.content));
    chunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
    });
    await upsertChunks(chunks);
    report.totalChunks += chunks.length;
  }

  report.tablesProcessed++;
  report.stats.other += contacts.length;
  console.log(`   ✅ Contact info complete (${chunks.length} chunks)\n`);
}

// Run if called directly
if (require.main === module) {
  syncDatabase().catch(console.error);
}

export { syncDatabase };

