import { NextRequest, NextResponse } from 'next/server';

interface DinnerwareSubCategory {
  id: string;
  name: string;
  parent: string;
  url: string;
  description?: string;
}

// Curated dinnerware subcategories from RAK Dinnerware Sitemap
const DINNERWARE_SUBCATEGORIES: DinnerwareSubCategory[] = [
  // Ivoris Collection
  { id: 'allspice', name: 'Allspice', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/allspice-1241' },
  { id: 'aurea', name: 'Aurea', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/aurea-1243' },
  { id: 'favourite', name: 'Favourite', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/favourite-1252' },
  { id: 'giro', name: 'Giro', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/giro-1254' },
  { id: 'lyra', name: 'Lyra', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/lyra-1258' },
  { id: 'minimax', name: 'Minimax', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/minimax-1263' },
  { id: 'nabur', name: 'Nabur', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/nabur-1264' },
  { id: 'nordic', name: 'Nordic', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/nordic-1266' },
  { id: 'sensate', name: 'Sensate', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/sensate-1270' },
  { id: 'white-gold', name: 'White Gold', parent: 'Ivoris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/ivoris-9/white-gold-1273' },

  // Polaris Collection
  { id: 'access', name: 'Access', parent: 'Polaris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/polaris-91/access-1282' },
  { id: 'charm', name: 'Charm', parent: 'Polaris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/polaris-91/charm-1283' },
  { id: 'classic-polaris', name: 'Classic Polaris', parent: 'Polaris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/polaris-91/classic-polaris-1291' },
  { id: 'evolution', name: 'Evolution', parent: 'Polaris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/polaris-91/evolution-1285' },
  { id: 'helm', name: 'Helm', parent: 'Polaris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/polaris-91/helm-1286' },
  { id: 'moon', name: 'Moon', parent: 'Polaris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/polaris-91/moon-1287' },
  { id: 'polaris-ska', name: 'Polaris SKA', parent: 'Polaris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/polaris-91/polaris-ska-2846' },
  { id: 'rimz', name: 'Rimz', parent: 'Polaris', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/polaris-91/rimz-2849' },

  // Opulence Collection
  { id: 'antic', name: 'Antic', parent: 'Opulence', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/opulence-86/antic-1275' },
  { id: 'cobbles', name: 'Cobbles', parent: 'Opulence', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/opulence-86/cobbles-1276' },
  { id: 'metalfusion', name: 'Metalfusion', parent: 'Opulence', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/opulence-86/metalfusion-1278' },
  { id: 'pure-ultra', name: 'Pure Ultra', parent: 'Opulence', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/opulence-86/pure-ultra-1281' },

  // Epic Collection
  { id: 'sensation', name: 'Sensation', parent: 'Epic', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/epic-18/sensation-1204' },

  // Fusion Collection
  { id: 'edge', name: 'Edge', parent: 'Fusion', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/fusion-19/edge-1220' },
  { id: 'genesis', name: 'Genesis', parent: 'Fusion', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/fusion-19/genesis-1223' },
  { id: 'kintzoo', name: 'Kintzoo', parent: 'Fusion', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/fusion-19/kintzoo-1226' },
  { id: 'lea', name: 'Lea', parent: 'Fusion', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/fusion-19/lea-1227' },
  { id: 'neofusion', name: 'Neofusion', parent: 'Fusion', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/fusion-19/neofusion-1228' },
  { id: 'neofusion-tonic', name: 'Neofusion Tonic', parent: 'Fusion', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/fusion-19/neofusion-tonic-1230' },
  { id: 'oxyd', name: 'Oxyd', parent: 'Fusion', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/fusion-19/oxyd-1231' },
  { id: 'ruby', name: 'Ruby', parent: 'Fusion', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/fusion-19/ruby-1232' },
  { id: 'woodart', name: 'Woodart', parent: 'Fusion', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/fusion-19/woodart-1239' },

  // RAK Earth Collection
  { id: 'argila', name: 'Argila', parent: 'RAK Earth', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/rak-earth-6/argila-1292' },
  { id: 'baantna', name: 'Baantna', parent: 'RAK Earth', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/rak-earth-6/baantna-1293' },
  { id: 'ghera', name: 'Ghera', parent: 'RAK Earth', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/rak-earth-6/ghera-1294' },
  { id: 'tero', name: 'Tero', parent: 'RAK Earth', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/rak-earth-6/tero-1295' },

  // Esencia Collection
  { id: 'fleur', name: 'Fleur', parent: 'Esencia', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/esencia-291/fleur-2864' },
  { id: 'paisley', name: 'Paisley', parent: 'Esencia', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/esencia-291/paisley-2867' },
  { id: 'salvia', name: 'Salvia', parent: 'Esencia', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/esencia-291/salvia-2869' },
  { id: 'fire', name: 'Fire', parent: 'Esencia', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/esencia-291/fire-2171' },

  // RAK Stone Collection
  { id: 'ease', name: 'Ease', parent: 'RAK Stone', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/rak-stone-7/ease-1296' },
  { id: 'kerrazzo', name: 'Kerrazzo', parent: 'RAK Stone', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/rak-stone-7/kerrazzo-1297' },
  { id: 'selva', name: 'Selva', parent: 'RAK Stone', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/rak-stone-7/selva-1299' },
  { id: 'spot', name: 'Spot', parent: 'RAK Stone', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/rak-stone-7/spot-1300' },
  { id: 'spring-summer', name: 'Spring & Summer', parent: 'RAK Stone', url: 'https://www.rakporcelain.com/us-en/collections/dinnerware/rak-stone-7/spring-%26-summer-1301' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '5');

    // Shuffle array and take random selection
    const shuffled = [...DINNERWARE_SUBCATEGORIES].sort(() => Math.random() - 0.5);
    const selectedSubCategories = shuffled.slice(0, Math.min(count, DINNERWARE_SUBCATEGORIES.length));

    // Format the response
    const formattedSubCategories = selectedSubCategories.map(subcategory => ({
      id: subcategory.id,
      name: subcategory.name,
      description: `${subcategory.parent} collection - Premium dinnerware design`,
      category: subcategory.parent,
      productCount: Math.floor(Math.random() * 50) + 10, // Simulated product count
      url: subcategory.url,
      categoryUrl: `https://www.rakporcelain.com/us-en/collections/dinnerware`
    }));

    return NextResponse.json({
      subcategories: formattedSubCategories,
      total: formattedSubCategories.length,
      source: 'RAK Dinnerware Sitemap'
    });

  } catch (error) {
    console.error('Error fetching dinnerware subcategories:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dinnerware subcategories',
      subcategories: []
    }, { status: 500 });
  }
}
