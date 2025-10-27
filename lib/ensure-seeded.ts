/**
 * Ensures the vector database is seeded with RAK Porcelain data
 * Seeds automatically on first API request if database is empty
 */

import { getVectorStore } from './simple-vector-store';
import { createEmbeddings } from './openai';
import { upsertChunks, type DocumentChunk } from './chroma';

let isSeeding = false;
let isSeeded = false;

const rakPorcelainData = [
  {
    id: 'rak-about-company',
    content: `RAK Porcelain is one of the world's largest porcelain manufacturers, headquartered in Ras Al Khaimah, United Arab Emirates. Established with a commitment to quality and innovation, RAK Porcelain has grown to serve customers in over 150 countries worldwide. The company operates state-of-the-art manufacturing facilities with advanced production technology. RAK Porcelain specializes in tabletop products for the hospitality industry, including hotels, restaurants, catering companies, as well as retail consumers. Our products combine traditional craftsmanship with modern design, meeting international standards including ISO 9001 certification.`,
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
    id: 'rak-products-overview',
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
    id: 'rak-care-instructions',
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
    id: 'rak-b2b-services',
    content: `RAK Porcelain offers comprehensive B2B and wholesale solutions for hotels, restaurants, catering companies, and retailers. We provide custom branding options, volume discounts, and dedicated account management. Our wholesale program includes flexible ordering, competitive pricing, and reliable delivery schedules. For B2B inquiries, please contact our sales team at sales@rakporcelain.com or call +971 7 244 8777.`,
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
    id: 'rak-warranty-policy',
    content: `RAK Porcelain stands behind the quality of our products with a comprehensive warranty. All products are guaranteed against manufacturing defects for a period of one year from the date of purchase. Our porcelain is chip-resistant and designed for commercial use. In the unlikely event of a defect, we will replace the item free of charge. Normal wear and tear, improper use, or accidental damage are not covered by warranty.`,
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
    id: 'rak-shipping-info',
    content: `RAK Porcelain US offers shipping throughout the United States. Standard shipping takes 5-7 business days. Expedited shipping options are available. We offer free shipping on orders over $500. All items are carefully packaged to ensure safe delivery. For large or commercial orders, freight shipping is available.`,
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
    id: 'rak-contact-info',
    content: `Contact RAK Porcelain US: Customer Service - Email: customerservice@rakporcelain.com, Phone: +1 (800) 123-4567 (toll-free), Hours: Monday-Friday 9:00 AM - 5:00 PM EST. Sales Inquiries - Email: sales@rakporcelain.com. Headquarters in Ras Al Khaimah, United Arab Emirates, Phone: +971 7 244 8777.`,
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

export async function ensureSeeded(): Promise<void> {
  // Check if already seeded
  if (isSeeded) {
    return;
  }

  // Prevent concurrent seeding
  if (isSeeding) {
    // Wait for ongoing seeding to complete
    while (isSeeding) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  try {
    isSeeding = true;

    const store = getVectorStore();
    
    // Check if database has data
    if (store.count() > 0) {
      console.log('Vector store already seeded with', store.count(), 'documents');
      isSeeded = true;
      return;
    }

    console.log('Seeding vector store with RAK Porcelain data...');

    // Create embeddings
    const texts = rakPorcelainData.map(d => d.content);
    const embeddings = await createEmbeddings(texts);

    // Create chunks with embeddings
    const chunks: DocumentChunk[] = rakPorcelainData.map((data, idx) => ({
      ...data,
      embedding: embeddings[idx],
    }));

    // Upsert to store
    await upsertChunks(chunks);

    console.log('Vector store seeded successfully with', chunks.length, 'documents');
    isSeeded = true;
  } catch (error) {
    console.error('Error seeding vector store:', error);
    throw error;
  } finally {
    isSeeding = false;
  }
}

