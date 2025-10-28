#!/usr/bin/env tsx
import { query } from '../lib/postgres';

async function checkImages() {
  const result = await query(`
    SELECT id, product_name, product_images 
    FROM products 
    WHERE product_images IS NOT NULL 
    LIMIT 3
  `);
  
  console.log('Product images samples:\n');
  result.forEach((r: any) => {
    console.log(`Product: ${r.product_name}`);
    console.log('Images structure:', JSON.stringify(r.product_images, null, 2));
    console.log('---\n');
  });
  
  process.exit(0);
}

checkImages().catch(console.error);

