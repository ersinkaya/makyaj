import { db } from '../db';
import { ScrapedProduct } from './types';

export async function syncScrapedProduct(storeKey: string, product: ScrapedProduct): Promise<void> {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if product exists by barcode
    let productId: string;
    const prodRes = await client.query(
      'SELECT id FROM products WHERE barcode = $1',
      [product.barcode]
    );

    if (prodRes.rows.length > 0) {
      productId = prodRes.rows[0].id;
      // Update basic product details
      await client.query(
        `UPDATE products 
         SET name = $1, brand = $2, image_url = $3, description = $4, rating = $5, reviews_count = $6, updated_at = NOW() 
         WHERE id = $7`,
        [
          product.name,
          product.brand,
          product.imageUrl,
          product.description,
          product.rating || 4.5,
          product.reviewsCount || 10,
          productId
        ]
      );
    } else {
      // Insert new product
      const insertRes = await client.query(
        `INSERT INTO products (name, brand, barcode, category, image_url, description, rating, reviews_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          product.name,
          product.brand,
          product.barcode,
          product.category,
          product.imageUrl,
          product.description,
          product.rating || 4.5,
          product.reviewsCount || 10
        ]
      );
      productId = insertRes.rows[0].id;
    }

    // 2. Upsert current store price
    await client.query(
      `INSERT INTO product_prices (product_id, store_key, price, discount_rate, product_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (product_id, store_key) 
       DO UPDATE SET price = EXCLUDED.price, discount_rate = EXCLUDED.discount_rate, product_url = EXCLUDED.product_url, updated_at = NOW()`,
      [
        productId,
        storeKey,
        product.price,
        product.discountRate,
        product.productUrl
      ]
    );

    // 3. Log into price history for charts (Daily entry)
    await client.query(
      `INSERT INTO price_history (product_id, store_key, price, recorded_at)
       VALUES ($1, $2, $3, CURRENT_DATE)
       ON CONFLICT (product_id, store_key, recorded_at) 
       DO UPDATE SET price = EXCLUDED.price`,
      [
        productId,
        storeKey,
        product.price
      ]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Eşleştirme ve DB kaydetme hatası (${product.name} - ${storeKey}):`, error);
    throw error;
  } finally {
    client.release();
  }
}
