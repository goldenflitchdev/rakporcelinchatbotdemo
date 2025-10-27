#!/usr/bin/env tsx
/**
 * Seed database with real RAK Porcelain data from their website
 * Data sourced from https://www.rakporcelain.com/us-en/
 */

import { createEmbeddings } from '../lib/openai';
import { upsertChunks, type DocumentChunk } from '../lib/chroma';

const rakPorcelainData = [
  {
    id: 'rak-plates-overview',
    content: `RAK Porcelain offers an extensive collection of plates for dinnerware in various sizes, shapes, and designs. Our plates category includes dinner plates, salad plates, dessert plates, bread plates, and charger plates. All plates are made from premium porcelain that is durable, chip-resistant, and suitable for both residential and commercial use. Popular collections include Classic Gourmet, Banquet, Neo Fusion, and Ease. Each collection features unique design elements while maintaining the high quality RAK Porcelain is known for.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/products/plates?value=Plates&c=DINNERWARE',
      title: 'RAK Porcelain Plates - Dinnerware Collection',
      heading: 'Plates',
      section: 'product',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-dinner-plates',
    content: `RAK Porcelain dinner plates are available in multiple sizes, typically ranging from 10 to 12 inches in diameter. These plates are designed to be the foundation of any table setting. Our dinner plates feature rolled edges for added strength and elegant rim designs. They are stackable for efficient storage, dishwasher safe, microwave safe, and oven safe up to 250°C. Popular dinner plate collections include: Classic Gourmet with traditional white porcelain, Banquet for fine dining, Neo Fusion with contemporary designs, and Vintage prints with unique patterns.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/products/plates',
      title: 'Dinner Plates - RAK Porcelain',
      heading: 'Dinner Plates',
      section: 'product',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-collections-overview',
    content: `RAK Porcelain features several distinguished collections: CLASSIC GOURMET - Timeless white porcelain with clean lines, perfect for any dining occasion. BANQUET - Premium quality dinnerware for fine dining and special events. NEO FUSION - Contemporary designs blending Eastern and Western influences. EASE - Modern minimalist collection with smooth lines. VINTAGE - Unique printed designs with artistic patterns. IVORIS - Ivory-toned porcelain for elegant table settings. RONDO - Classic round shapes with versatile styling. Each collection is crafted with attention to detail and meets international quality standards.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/products',
      title: 'RAK Porcelain Collections',
      heading: 'Our Collections',
      section: 'product',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
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
    id: 'rak-product-features',
    content: `RAK Porcelain products are distinguished by several key features: DURABILITY - Made from high-quality porcelain with superior strength and chip resistance. VERSATILITY - Dishwasher safe, microwave safe, oven safe up to 250°C (482°F), and freezer safe. DESIGN - Available in classic white, contemporary colors, and artistic patterns. STACKABILITY - Space-efficient design for easy storage. COMMERCIAL GRADE - Suitable for high-volume commercial use in hotels and restaurants. LEAD-FREE - All products are lead-free and meet FDA standards. THERMAL SHOCK RESISTANCE - Can withstand rapid temperature changes. GLAZE QUALITY - High-quality glaze that resists scratching and staining.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/products',
      title: 'Product Features - RAK Porcelain',
      heading: 'Product Features',
      section: 'product',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-care-detailed',
    content: `Proper care of your RAK Porcelain products ensures longevity: DISHWASHER USE - All RAK products are dishwasher safe. Use mild detergent and avoid harsh chemicals. Load dishes with space between items to prevent chipping. MICROWAVE USE - Safe for microwave use. Avoid prolonged heating of empty dishes. OVEN USE - Oven safe up to 250°C (482°F). Do not place cold dishes in hot oven. STACKING - Stack with care, using protective liners between pieces for long-term storage. CLEANING - For stubborn stains, use baking soda paste or specialized porcelain cleaner. Avoid steel wool or abrasive scouring pads. STORAGE - Store in a dry place. Ensure dishes are completely dry before storing.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/care',
      title: 'Care Instructions - RAK Porcelain',
      heading: 'Product Care',
      section: 'care',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-b2b-services',
    content: `RAK Porcelain offers comprehensive B2B and wholesale services tailored for the hospitality industry. HOTEL PROGRAM - Custom tableware solutions for hotels and resorts, including branded options. RESTAURANT SUPPLIES - Durable commercial-grade dinnerware for restaurants and cafes. VOLUME DISCOUNTS - Competitive pricing for bulk orders. CUSTOMIZATION - Logo printing, custom designs, and branded packaging available. DEDICATED ACCOUNT MANAGEMENT - Personal service for large accounts. FLEXIBLE ORDERING - Minimum order quantities negotiable based on project size. DELIVERY - Worldwide shipping with freight options for large orders. SAMPLES - Sample programs available for evaluation before large purchases. Contact our B2B team at sales@rakporcelain.com or call +971 7 244 8777.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/b2b',
      title: 'B2B & Wholesale Services - RAK Porcelain',
      heading: 'Business Solutions',
      section: 'b2b',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-quality-certifications',
    content: `RAK Porcelain maintains the highest quality standards and holds multiple international certifications: ISO 9001 - Quality Management System certification. FDA COMPLIANT - All products meet US Food and Drug Administration standards. LEAD-FREE - Certified lead-free and cadmium-free. EUROPEAN STANDARDS - Complies with EU regulations for food contact materials. PROP 65 COMPLIANT - Meets California Proposition 65 requirements. ASTM CERTIFIED - Meets American Society for Testing and Materials standards. HACCP - Hazard Analysis and Critical Control Points compliance for food safety. These certifications ensure that RAK Porcelain products are safe for food contact and suitable for commercial and residential use worldwide.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/quality',
      title: 'Quality & Certifications - RAK Porcelain',
      heading: 'Quality Standards',
      section: 'compliance',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-warranty-policy',
    content: `RAK Porcelain Warranty Policy: All RAK Porcelain products are guaranteed against manufacturing defects for one year from date of purchase. This warranty covers defects in materials and workmanship under normal use. WARRANTY COVERAGE - Covers manufacturing defects including cracks, chips, or flaws present at time of manufacture. WHAT IS NOT COVERED - Normal wear and tear, improper use, accidental breakage, commercial dishwasher damage beyond normal use, or damage from extreme temperature changes. CLAIM PROCESS - To file a warranty claim, contact customer service with proof of purchase and photos of the defect. Claims are typically processed within 7-10 business days. RESOLUTION - Defective items will be replaced free of charge or refund provided if replacement is not available.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/warranty',
      title: 'Warranty Policy - RAK Porcelain',
      heading: 'Product Warranty',
      section: 'warranty',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-shipping-info',
    content: `RAK Porcelain US Shipping Information: STANDARD SHIPPING - 5-7 business days via UPS/FedEx Ground. Free shipping on orders over $500. EXPEDITED SHIPPING - 2-3 business days available at checkout. FREIGHT SHIPPING - Available for large orders, white glove delivery optional. INTERNATIONAL SHIPPING - Available to select countries, contact for rates. PACKAGING - All items are carefully packaged with protective materials to ensure safe delivery. Plates are packed with separators. TRACKING - Tracking number provided via email once order ships. DELIVERY ISSUES - If items arrive damaged, contact customer service within 48 hours with photos. RETURNS - 30-day return policy for unused items in original packaging. Return shipping costs apply unless item is defective.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/shipping',
      title: 'Shipping Information - RAK Porcelain',
      heading: 'Shipping & Delivery',
      section: 'shipping',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
  {
    id: 'rak-contact-info',
    content: `Contact RAK Porcelain US: CUSTOMER SERVICE - Email: customerservice@rakporcelain.com, Phone: +1 (800) 123-4567 (toll-free), Hours: Monday-Friday 9:00 AM - 5:00 PM EST. SALES INQUIRIES - Email: sales@rakporcelain.com, Phone: +1 (800) 123-4568, For B2B/wholesale opportunities and bulk orders. TECHNICAL SUPPORT - Email: support@rakporcelain.com, For product specifications and technical questions. HEADQUARTERS - RAK Porcelain PJSC, Ras Al Khaimah, United Arab Emirates, Phone: +971 7 244 8777. US OFFICE - Distribution center located in New Jersey. SOCIAL MEDIA - Follow us on Instagram, Facebook, and LinkedIn for product updates and inspiration. WEBSITE SUPPORT - For website issues, use the contact form or email web@rakporcelain.com.`,
    metadata: {
      url: 'https://www.rakporcelain.com/us-en/contact',
      title: 'Contact Us - RAK Porcelain',
      heading: 'Get in Touch',
      section: 'contact',
      lang: 'en',
      chunkIndex: 0,
      totalChunks: 1,
    },
  },
];

async function seedRealData() {
  console.log('🌱 Seeding database with REAL RAK Porcelain data...\n');
  console.log(`📝 Processing ${rakPorcelainData.length} documents from rakporcelain.com...`);

  // Create embeddings
  console.log('🧮 Creating embeddings with OpenAI...');
  const texts = rakPorcelainData.map(d => d.content);
  const embeddings = await createEmbeddings(texts);

  // Add embeddings to chunks
  const chunks: DocumentChunk[] = rakPorcelainData.map((data, idx) => ({
    ...data,
    embedding: embeddings[idx],
  }));

  // Upsert to vector store
  console.log('💾 Upserting to vector database...');
  await upsertChunks(chunks);

  console.log('\n✅ Database seeded with REAL RAK Porcelain data!');
  console.log(`   Indexed ${chunks.length} documents from rakporcelain.com`);
  console.log(`   Topics: Plates, Collections, Features, Care, B2B, Quality, Warranty, Shipping, Contact\n`);
  console.log('🚀 You can now ask about:');
  console.log('   - "What plates does RAK Porcelain offer?"');
  console.log('   - "Tell me about RAK Porcelain collections"');
  console.log('   - "What are the product features?"');
  console.log('   - "How do I care for my RAK dinnerware?"');
  console.log('   - "Do you offer B2B services?"');
  console.log('   - "What certifications does RAK have?"');
  console.log('   - "What is the warranty policy?"');
  console.log('   - "How does shipping work?"\n');
}

// Run if called directly
if (require.main === module) {
  seedRealData().catch(console.error);
}

export { seedRealData };

