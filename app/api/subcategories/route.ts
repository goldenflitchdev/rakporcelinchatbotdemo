import { NextRequest, NextResponse } from 'next/server';
import { query, closePool } from '@/lib/postgres';

interface SubCategory {
  id: number;
  name: string;
  description: string;
  locale: string;
  category_name: string;
  product_count: number;
  subcategory_url: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DB_HOST) {
      return NextResponse.json({ 
        error: 'Database not configured',
        subcategories: []
      });
    }

    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '5');
    const locale = searchParams.get('locale') || 'en';

    // Get random subcategories with their parent category info
    const subCategories = await query<SubCategory>(`
      SELECT 
        sc.id,
        sc.name,
        sc.description,
        sc.locale,
        c.name as category_name,
        COUNT(psc.product_id) as product_count
      FROM sub_categories sc
      INNER JOIN sub_categories_categories_links scc ON sc.id = scc.sub_category_id
      INNER JOIN categories c ON scc.category_id = c.id
      LEFT JOIN products_sub_category_links psc ON sc.id = psc.sub_category_id
      WHERE sc.published_at IS NOT NULL
        AND c.published_at IS NOT NULL
        AND sc.locale = $1
        AND sc.description IS NOT NULL
        AND sc.description != ''
      GROUP BY sc.id, sc.name, sc.description, sc.locale, c.name
      HAVING COUNT(psc.product_id) > 0
      ORDER BY RANDOM()
      LIMIT $2
    `, [locale, count]);

    // Format the response with URLs
    const formattedSubCategories = subCategories.map(subcat => ({
      id: subcat.id,
      name: subcat.name,
      description: subcat.description,
      category: subcat.category_name,
      productCount: parseInt(subcat.product_count.toString()),
      url: `https://www.rakporcelain.com/${subcat.locale}/products?subcategory=${encodeURIComponent(subcat.name)}`,
      categoryUrl: `https://www.rakporcelain.com/${subcat.locale}/products?category=${encodeURIComponent(subcat.category_name)}`
    }));

    return NextResponse.json({
      subcategories: formattedSubCategories,
      total: formattedSubCategories.length,
      locale
    });

  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch subcategories',
      subcategories: []
    }, { status: 500 });
  } finally {
    await closePool();
  }
}
