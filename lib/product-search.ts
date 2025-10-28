/**
 * Product Search and Image Extraction
 * Searches database for relevant products and extracts images
 */

import { query } from './postgres';

export interface ProductResult {
  id: number;
  name: string;
  code: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  collection?: string;
  category?: string;
  material?: string;
  shape?: string;
}

export async function searchProducts(
  searchQuery: string,
  limit: number = 5
): Promise<ProductResult[]> {
  try {
    // Search products by name, code, or description
    // Prioritize products with images
    const products = await query<{
      id: number;
      product_name: string;
      product_code: string;
      product_description: string;
      description: string;
      product_images: any;
      locale: string;
      material: string;
      shape: string;
    }>(
      `SELECT id, product_name, product_code, product_description, 
              description, product_images, locale, material, shape
       FROM products
       WHERE published_at IS NOT NULL
         AND product_images IS NOT NULL
         AND (
           LOWER(product_name) LIKE LOWER($1)
           OR LOWER(product_code) LIKE LOWER($1)
           OR LOWER(product_description) LIKE LOWER($1)
           OR LOWER(description) LIKE LOWER($1)
         )
       ORDER BY updated_at DESC
       LIMIT $2`,
      [`%${searchQuery}%`, limit]
    );

    return products.map(product => {
      const imageUrl = extractImageUrl(product.product_images);
      
      return {
        id: product.id,
        name: product.product_name,
        code: product.product_code || '',
        description: product.product_description || product.description || '',
        imageUrl,
        productUrl: `https://www.rakporcelain.com/${product.locale}/products/${product.product_code || product.id}`,
        material: product.material,
        shape: product.shape,
      };
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

export async function getProductsByCategory(
  categoryName: string,
  limit: number = 5
): Promise<ProductResult[]> {
  try {
    // Get category ID
    const categories = await query<{ id: number; locale: string }>(
      `SELECT id, locale FROM categories 
       WHERE LOWER(name) LIKE LOWER($1) 
       AND published_at IS NOT NULL 
       LIMIT 1`,
      [`%${categoryName}%`]
    );

    if (categories.length === 0) {
      return searchProducts(categoryName, limit);
    }

    const category = categories[0];

    // Get products in this category via sub_categories
    // Prioritize products with images
    const products = await query<{
      id: number;
      product_name: string;
      product_code: string;
      product_description: string;
      product_images: any;
      locale: string;
      material: string;
      shape: string;
    }>(
      `SELECT DISTINCT p.id, p.product_name, p.product_code, 
              p.product_description, p.product_images, p.locale,
              p.material, p.shape
       FROM products p
       INNER JOIN products_sub_category_links psc ON p.id = psc.product_id
       INNER JOIN sub_categories_categories_links scc ON psc.sub_category_id = scc.sub_category_id
       WHERE scc.category_id = $1
         AND p.published_at IS NOT NULL
         AND p.product_images IS NOT NULL
       ORDER BY p.updated_at DESC
       LIMIT $2`,
      [category.id, limit]
    );

    return products.map(product => ({
      id: product.id,
      name: product.product_name,
      code: product.product_code || '',
      description: product.product_description || '',
      imageUrl: extractImageUrl(product.product_images),
      productUrl: `https://www.rakporcelain.com/${product.locale}/products/${product.product_code || product.id}`,
      category: categoryName,
      material: product.material,
      shape: product.shape,
    }));
  } catch (error) {
    console.error('Error getting products by category:', error);
    return searchProducts(categoryName, limit);
  }
}

export async function getProductsByCollection(
  collectionName: string,
  limit: number = 5
): Promise<ProductResult[]> {
  try {
    // Get collection ID
    const collections = await query<{ id: number; locale: string }>(
      `SELECT id, locale FROM collections 
       WHERE LOWER(collection_name) LIKE LOWER($1) 
       AND published_at IS NOT NULL 
       LIMIT 1`,
      [`%${collectionName}%`]
    );

    if (collections.length === 0) {
      return searchProducts(collectionName, limit);
    }

    const collection = collections[0];

    // Get products in this collection
    // Prioritize products with images
    const products = await query<{
      id: number;
      product_name: string;
      product_code: string;
      product_description: string;
      product_images: any;
      locale: string;
      material: string;
      shape: string;
    }>(
      `SELECT p.id, p.product_name, p.product_code, 
              p.product_description, p.product_images, p.locale,
              p.material, p.shape
       FROM products p
       INNER JOIN products_collection_links pc ON p.id = pc.product_id
       WHERE pc.collection_id = $1
         AND p.published_at IS NOT NULL
         AND p.product_images IS NOT NULL
       ORDER BY p.updated_at DESC
       LIMIT $2`,
      [collection.id, limit]
    );

    return products.map(product => ({
      id: product.id,
      name: product.product_name,
      code: product.product_code || '',
      description: product.product_description || '',
      imageUrl: extractImageUrl(product.product_images),
      productUrl: `https://www.rakporcelain.com/${product.locale}/products/${product.product_code || product.id}`,
      collection: collectionName,
      material: product.material,
      shape: product.shape,
    }));
  } catch (error) {
    console.error('Error getting products by collection:', error);
    return searchProducts(collectionName, limit);
  }
}

function extractImageUrl(productImages: any): string {
  // Default placeholder image
  const placeholder = 'https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=RAK+Porcelain';

  if (!productImages) return placeholder;

  try {
    // productImages is JSONB, could be array or object
    if (typeof productImages === 'string') {
      productImages = JSON.parse(productImages);
    }

    // Handle array of images (RAK database format)
    if (Array.isArray(productImages) && productImages.length > 0) {
      const firstImage = productImages[0];
      
      // RAK format: { publicUrl: "https://...", fileKey: "...", productCode: "..." }
      if (firstImage.publicUrl) {
        return firstImage.publicUrl;
      }
      
      // Alternative formats
      if (typeof firstImage === 'string') {
        return firstImage;
      }
      if (firstImage.url) {
        return firstImage.url;
      }
    }

    // Handle object with url property
    if (productImages.url || productImages.publicUrl) {
      return productImages.url || productImages.publicUrl;
    }

    // Handle Strapi format
    if (productImages.data && Array.isArray(productImages.data)) {
      if (productImages.data[0]?.attributes?.url) {
        return productImages.data[0].attributes.url;
      }
    }

    return placeholder;
  } catch (error) {
    console.error('Error extracting image URL:', error);
    return placeholder;
  }
}

export async function detectProductIntent(message: string): Promise<{
  hasProductIntent: boolean;
  searchTerm?: string;
  category?: string;
  collection?: string;
}> {
  const lowerMessage = message.toLowerCase();

  // Detect if user is asking about products
  const productKeywords = [
    'product', 'plate', 'bowl', 'cup', 'dish', 'show me', 'what do you have',
    'collection', 'category', 'porcelain', 'dinnerware', 'serveware'
  ];

  const hasProductIntent = productKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );

  if (!hasProductIntent) {
    return { hasProductIntent: false };
  }

  // Try to extract collection name
  const collections = [
    'classic gourmet', 'banquet', 'ease', 'neo fusion', 'vintage',
    'ivoris', 'rondo', 'shale', 'trinidad'
  ];
  
  const foundCollection = collections.find(col => lowerMessage.includes(col));

  // Try to extract category
  const categories = [
    'plate', 'bowl', 'cup', 'saucer', 'platter', 'dish', 'mug',
    'teapot', 'coffee pot', 'creamer', 'sugar bowl'
  ];
  
  const foundCategory = categories.find(cat => lowerMessage.includes(cat));

  // Extract search term (simplified)
  const words = message.split(' ').filter(w => w.length > 3);
  const searchTerm = foundCategory || foundCollection || words.slice(-2).join(' ');

  return {
    hasProductIntent: true,
    searchTerm,
    category: foundCategory,
    collection: foundCollection,
  };
}

