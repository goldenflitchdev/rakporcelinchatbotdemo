#!/usr/bin/env tsx
/**
 * Build Aesthetic Vector Database
 * Analyzes products and creates vectors for aesthetic/material traits
 */

import { query } from '../lib/postgres';
import { createEmbeddings } from '../lib/openai';
import { extractAestheticTraits, createAestheticDescription, getAestheticVectorStore } from '../lib/aesthetic-vector-store';
import type { VectorDocument } from '../lib/simple-vector-store';

async function buildAestheticDatabase() {
  console.log('🎨 Building Aesthetic Vector Database...\n');

  // Get all products with images
  console.log('📦 Fetching products from database...');
  const products = await query<{
    id: number;
    product_name: string;
    product_code: string;
    material: string;
    material_finish: string;
    description: string;
    product_description: string;
    shape: string;
    locale: string;
  }>(
    `SELECT id, product_name, product_code, material, material_finish,
            description, product_description, shape, locale
     FROM products
     WHERE published_at IS NOT NULL
       AND product_images IS NOT NULL
     LIMIT 1000`
  );

  console.log(`✅ Found ${products.length} products\n`);

  console.log('🔍 Extracting aesthetic traits...');
  const aestheticDocs: VectorDocument[] = [];
  const descriptions: string[] = [];

  for (const product of products) {
    // Extract aesthetic traits
    const traits = extractAestheticTraits(product);
    
    // Create description for embedding
    const description = createAestheticDescription(traits);
    descriptions.push(description);

    // Store for later
    aestheticDocs.push({
      id: `aesthetic-${product.id}`,
      content: description,
      embedding: [], // Will be filled after creating embeddings
      metadata: {
        productId: product.id,
        productName: product.product_name,
        productCode: product.product_code,
        traits,
        locale: product.locale,
      },
    });
  }

  console.log(`✅ Extracted ${aestheticDocs.length} aesthetic profiles\n`);

  console.log('🧮 Creating embeddings for aesthetic descriptions...');
  console.log('   This will take 2-3 minutes...\n');

  // Create embeddings in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < descriptions.length; i += BATCH_SIZE) {
    const batch = descriptions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(descriptions.length / BATCH_SIZE);
    
    console.log(`   Processing batch ${batchNum}/${totalBatches} (${batch.length} items)...`);
    
    const embeddings = await createEmbeddings(batch);
    
    // Add embeddings to documents
    for (let j = 0; j < batch.length; j++) {
      aestheticDocs[i + j].embedding = embeddings[j];
    }

    // Small delay to avoid rate limits
    if (i + BATCH_SIZE < descriptions.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n✅ Embeddings created\n');

  console.log('💾 Saving to aesthetic vector store...');
  const store = getAestheticVectorStore();
  store.upsert(aestheticDocs);

  console.log(`\n✅ Aesthetic database built successfully!`);
  console.log(`   Total profiles: ${aestheticDocs.length}`);
  console.log(`   Unique materials: ${new Set(products.map(p => p.material).filter(Boolean)).size}`);
  console.log(`   Unique finishes: ${new Set(products.map(p => p.material_finish).filter(Boolean)).size}`);
  console.log('\n🎨 Aesthetic search now available!');
  console.log('\nExample queries that will work better:');
  console.log('  - "Show me elegant white porcelain"');
  console.log('  - "I want modern minimalist plates"');
  console.log('  - "Looking for glossy finish dinnerware"');
  console.log('  - "Show me rustic style bowls"');
  console.log('  - "I need matte black pieces"\n');
}

if (require.main === module) {
  buildAestheticDatabase().catch(console.error).finally(() => process.exit(0));
}

export { buildAestheticDatabase };

