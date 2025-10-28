#!/usr/bin/env tsx
import { query, closePool } from '../lib/postgres';

interface SubCategory {
  id: number;
  name: string;
  description: string;
  locale: string;
  seo_title: string;
  seo_description: string;
  category_id: number;
  category_name: string;
  product_count: number;
}

interface Category {
  id: number;
  name: string;
  locale: string;
}

async function extractSubCategories() {
  console.log('🔍 Extracting Subcategories from RAK Porcelain Database...\n');

  try {
    // Get all categories first
    const categories = await query<Category>(`
      SELECT id, name, locale
      FROM categories
      WHERE published_at IS NOT NULL
      ORDER BY name
    `);

    console.log(`📂 Found ${categories.length} categories\n`);

    // Get all subcategories with their parent category info
    const subCategories = await query<SubCategory>(`
      SELECT 
        sc.id,
        sc.name,
        sc.description,
        sc.locale,
        sc.seo_title,
        sc.seo_description,
        c.id as category_id,
        c.name as category_name,
        COUNT(psc.product_id) as product_count
      FROM sub_categories sc
      INNER JOIN sub_categories_categories_links scc ON sc.id = scc.sub_category_id
      INNER JOIN categories c ON scc.category_id = c.id
      LEFT JOIN products_sub_category_links psc ON sc.id = psc.sub_category_id
      WHERE sc.published_at IS NOT NULL
        AND c.published_at IS NOT NULL
      GROUP BY sc.id, sc.name, sc.description, sc.locale, sc.seo_title, sc.seo_description, c.id, c.name
      ORDER BY c.name, sc.name
    `);

    console.log(`📋 Found ${subCategories.length} subcategories\n`);

    // Group by category
    const groupedSubCategories = categories.map(category => {
      const subcats = subCategories.filter(sc => sc.category_id === category.id);
      return {
        category: category,
        subcategories: subcats
      };
    }).filter(group => group.subcategories.length > 0);

    // Generate the comprehensive list
    console.log('🌐 RAK PORCELAIN SUBCATEGORY PAGES\n');
    console.log('=' .repeat(80));
    console.log();

    groupedSubCategories.forEach((group, index) => {
      console.log(`${index + 1}. ${group.category.name.toUpperCase()}`);
      console.log(`   Category URL: https://www.rakporcelain.com/${group.category.locale}/products?category=${encodeURIComponent(group.category.name)}`);
      console.log(`   Subcategories:`);
      
      group.subcategories.forEach((subcat, subIndex) => {
        const subcategoryUrl = `https://www.rakporcelain.com/${subcat.locale}/products?subcategory=${encodeURIComponent(subcat.name)}`;
        console.log(`   ${subIndex + 1}. ${subcat.name}`);
        console.log(`      URL: ${subcategoryUrl}`);
        console.log(`      Products: ${subcat.product_count}`);
        if (subcat.description) {
          console.log(`      Description: ${subcat.description.substring(0, 100)}${subcat.description.length > 100 ? '...' : ''}`);
        }
        console.log();
      });
      
      console.log('-'.repeat(60));
      console.log();
    });

    // Create a flat list for easy reference
    console.log('\n📋 FLAT SUBCATEGORY LIST (for easy copy-paste)\n');
    console.log('=' .repeat(80));
    
    subCategories.forEach((subcat, index) => {
      const url = `https://www.rakporcelain.com/${subcat.locale}/products?subcategory=${encodeURIComponent(subcat.name)}`;
      console.log(`${index + 1}. ${subcat.category_name} > ${subcat.name}`);
      console.log(`   ${url}`);
      console.log();
    });

    // Generate JSON output for programmatic use
    const jsonOutput = {
      timestamp: new Date().toISOString(),
      total_categories: categories.length,
      total_subcategories: subCategories.length,
      categories: groupedSubCategories.map(group => ({
        id: group.category.id,
        name: group.category.name,
        locale: group.category.locale,
        category_url: `https://www.rakporcelain.com/${group.category.locale}/products?category=${encodeURIComponent(group.category.name)}`,
        subcategories: group.subcategories.map(subcat => ({
          id: subcat.id,
          name: subcat.name,
          description: subcat.description,
          locale: subcat.locale,
          seo_title: subcat.seo_title,
          seo_description: subcat.seo_description,
          product_count: subcat.product_count,
          subcategory_url: `https://www.rakporcelain.com/${subcat.locale}/products?subcategory=${encodeURIComponent(subcat.name)}`
        }))
      }))
    };

    // Save to file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(process.cwd(), 'data', 'subcategories-list.json');
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
    
    console.log(`\n💾 JSON data saved to: ${outputPath}`);
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Subcategories: ${subCategories.length}`);
    console.log(`   - Total URLs generated: ${subCategories.length}`);

  } catch (error) {
    console.error('❌ Error extracting subcategories:', error);
  } finally {
    await closePool();
  }
}

extractSubCategories().catch(console.error).finally(() => process.exit(0));
