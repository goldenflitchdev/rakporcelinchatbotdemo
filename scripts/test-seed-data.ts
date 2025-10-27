#!/usr/bin/env tsx
/**
 * Quick test script to seed the database with sample RAK Porcelain data
 * This allows testing the chatbot without waiting for full website indexing
 */

import { createEmbeddings } from '../lib/openai';
import { upsertChunks, type DocumentChunk } from '../lib/chroma';

const sampleData = [
  {
    id: 'rak-about-1',
    content: `RAK Porcelain is a leading manufacturer of premium porcelain tableware and hotel supplies. Founded in the United Arab Emirates, RAK Porcelain has grown to become one of the largest porcelain manufacturers in the world. The company produces high-quality porcelain dinnerware, serveware, and complementary products for the hospitality industry and retail markets worldwide.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/about',
      title: 'About RAK Porcelain',
      heading: 'About Us',
      section: 'about',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-products-1',
    content: `RAK Porcelain offers an extensive range of products including dinnerware collections, serving dishes, bowls, plates, cups, and saucers. Our collections range from classic white porcelain to contemporary designs with various colors and patterns. Popular collections include Ease, Banquet, and Classic Gourmet. All products are made from high-quality porcelain that is durable, chip-resistant, and suitable for commercial use.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/products',
      title: 'RAK Porcelain Products',
      heading: 'Our Products',
      section: 'product',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-care-1',
    content: `RAK Porcelain products are designed for durability and ease of care. All items are dishwasher safe and can withstand high temperatures. For best results, we recommend using a mild detergent and avoiding abrasive cleaners. Our porcelain is microwave safe and oven safe up to 250°C (482°F). To maintain the beauty of your porcelain, stack carefully with protective layers between pieces. With proper care, RAK Porcelain products will maintain their quality and appearance for years.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/care-instructions',
      title: 'Care Instructions',
      heading: 'How to Care for Your RAK Porcelain',
      section: 'care',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-b2b-1',
    content: `RAK Porcelain offers comprehensive B2B and wholesale solutions for hotels, restaurants, catering companies, and retailers. We provide custom branding options, volume discounts, and dedicated account management. Our wholesale program includes flexible ordering, competitive pricing, and reliable delivery schedules. For B2B inquiries, please contact our sales team at sales@rakporcelain.com or call +971 7 244 8777. We can accommodate orders of all sizes and offer customization services.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/b2b',
      title: 'B2B & Wholesale',
      heading: 'Business Solutions',
      section: 'b2b',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-warranty-1',
    content: `RAK Porcelain stands behind the quality of our products with a comprehensive warranty. All products are guaranteed against manufacturing defects for a period of one year from the date of purchase. Our porcelain is chip-resistant and designed for commercial use. In the unlikely event of a defect, we will replace the item free of charge. Normal wear and tear, improper use, or accidental damage are not covered by warranty. For warranty claims, please contact customer service with proof of purchase.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/warranty',
      title: 'Warranty Information',
      heading: 'Product Warranty',
      section: 'warranty',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-shipping-1',
    content: `RAK Porcelain offers shipping throughout the United States. Standard shipping takes 5-7 business days. Expedited shipping options are available at checkout. We offer free shipping on orders over $500. All items are carefully packaged to ensure safe delivery. Tracking information is provided once your order ships. For large or commercial orders, freight shipping is available. International shipping is available to select countries. Please contact customer service for international shipping rates and delivery times.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/shipping',
      title: 'Shipping Information',
      heading: 'Shipping & Delivery',
      section: 'shipping',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-contact-1',
    content: `Contact RAK Porcelain US: Customer Service Email: customerservice@rakporcelain.com, Sales Inquiries: sales@rakporcelain.com, Phone: +1 (800) 123-4567 (toll-free), Business Hours: Monday-Friday, 9:00 AM - 5:00 PM EST. For product inquiries, order status, or general questions, our customer service team is here to help. You can also reach us through our website contact form. Our headquarters is located in Ras Al Khaimah, United Arab Emirates, with offices and distribution centers worldwide.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/contact',
      title: 'Contact Us',
      heading: 'Get in Touch',
      section: 'contact',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
];

async function seedDatabase() {
  console.log('🌱 Seeding database with sample RAK Porcelain data...\n');

  console.log(`📝 Processing ${sampleData.length} sample documents...`);

  // Create embeddings
  console.log('🧮 Creating embeddings...');
  const texts = sampleData.map(d => d.content);
  const embeddings = await createEmbeddings(texts);

  // Add embeddings to chunks
  const chunks: DocumentChunk[] = sampleData.map((data, idx) => ({
    ...data,
    embedding: embeddings[idx],
  }));

  // Upsert to ChromaDB
  console.log('💾 Upserting to ChromaDB...');
  await upsertChunks(chunks);

  console.log('\n✅ Database seeded successfully!');
  console.log(`   Indexed ${chunks.length} documents`);
  console.log(`   Topics: About, Products, Care, B2B, Warranty, Shipping, Contact\n`);
  console.log('🚀 You can now test the chatbot with questions like:');
  console.log('   - "What is RAK Porcelain?"');
  console.log('   - "What products do you offer?"');
  console.log('   - "How do I care for my porcelain?"');
  console.log('   - "Do you offer B2B or wholesale?"');
  console.log('   - "How can I contact customer service?"\n');
}

// Run if called directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };

