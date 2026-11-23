import { NextResponse } from 'next/server';
import { queryDatabase, sql } from '@/lib/db';
import { INITIAL_PRODUCTS, FlowerItem } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!sql) {
    return NextResponse.json({ success: true, products: INITIAL_PRODUCTS, source: 'local' });
  }

  try {
    const rows = await queryDatabase<{
      id: number;
      name: string;
      category: string;
      price: string | number;
      stock: number;
      description: string;
      image_url: string;
      collection_name: string;
      botanical_origin: string;
      stem_count: string;
      is_active: boolean;
    }>('SELECT * FROM bloombox_products WHERE is_active = true ORDER BY id ASC');

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, products: INITIAL_PRODUCTS, source: 'fallback' });
    }

    const products: FlowerItem[] = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      category: r.category,
      price: Number(r.price),
      stock: Number(r.stock),
      description: r.description,
      imageColor: 'from-emerald-950/40 to-black',
      accentColor: '#10b981',
      imageUrl: r.image_url,
      collectionName: r.collection_name,
      botanicalOrigin: r.botanical_origin,
      stemCount: r.stem_count,
    }));

    return NextResponse.json({ success: true, products, source: 'neon' });
  } catch (error) {
    console.error('Failed to fetch products from database:', error);
    return NextResponse.json({ success: true, products: INITIAL_PRODUCTS, source: 'error_fallback' });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, passcode, product, productId, newStock, newPrice } = body;

    // Check admin authorization
    const expectedPasscode = process.env.ADMIN_PASSCODE || 'bloombox@2026';
    if (passcode !== expectedPasscode) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Invalid admin passcode.' }, { status: 401 });
    }

    if (!sql) {
      return NextResponse.json({ success: false, error: 'Database connection unavailable.' }, { status: 503 });
    }

    if (action === 'update_stock') {
      await queryDatabase(
        'UPDATE bloombox_products SET stock = $1 WHERE id = $2',
        [Math.max(0, Number(newStock)), Number(productId)]
      );
      return NextResponse.json({ success: true, message: 'Stock updated successfully.' });
    }

    if (action === 'update_price') {
      await queryDatabase(
        'UPDATE bloombox_products SET price = $1 WHERE id = $2',
        [Number(newPrice), Number(productId)]
      );
      return NextResponse.json({ success: true, message: 'Price updated successfully.' });
    }

    if (action === 'create_product') {
      const nextId = Number(product.id) || (Date.now() % 100000);
      await queryDatabase(
        `INSERT INTO bloombox_products (id, name, category, price, stock, description, image_url, collection_name, botanical_origin, stem_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           price = EXCLUDED.price,
           stock = EXCLUDED.stock,
           description = EXCLUDED.description`,
        [
          nextId,
          product.name,
          product.category,
          Number(product.price),
          Number(product.stock),
          product.description || '',
          product.imageUrl || '',
          product.collectionName || `${product.name} Collection`,
          product.botanicalOrigin || 'Greenhouse Nursery',
          product.stemCount || 'Hand-tied Bouquet',
        ]
      );
      return NextResponse.json({ success: true, message: 'Product created successfully.', id: nextId });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Product modification error:', error);
    return NextResponse.json({ success: false, error: 'Database update failed.' }, { status: 500 });
  }
}
