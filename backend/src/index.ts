import express, { Request, Response } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { db } from './db';
import { runAllScrapers } from './scraper/run';

const app = express();
const port = process.env.PORT || 4000;

// Enable CORS
app.use(cors());
app.use(express.json());

// 1. Get Categories List
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    const categories = result.rows.map((row: any) => row.category);
    res.json(categories);
  } catch (error) {
    console.error('Kategoriler çekilirken hata:', error);
    res.status(500).json({ error: 'Kategoriler listelenemedi' });
  }
});

// 2. Search & List Products (Cheapest Price & Filters)
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category, brand, query, sort = 'cheapest', limit = '20', offset = '0' } = req.query;

    let sql = `
      SELECT 
        p.*,
        MIN(pp.price) as min_price,
        COUNT(pp.store_key) as store_count
      FROM products p
      LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.price IS NOT NULL
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      sql += ` AND p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (brand) {
      sql += ` AND p.brand ILIKE $${paramIndex}`;
      params.push(`%${brand}%`);
      paramIndex++;
    }

    if (query) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex})`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    sql += ` GROUP BY p.id`;

    // Sorting
    if (sort === 'cheapest') {
      sql += ` ORDER BY min_price ASC NULLS LAST`;
    } else if (sort === 'highest-rating') {
      sql += ` ORDER BY p.rating DESC`;
    } else if (sort === 'most-reviewed') {
      sql += ` ORDER BY p.reviews_count DESC`;
    } else {
      sql += ` ORDER BY p.name ASC`;
    }

    // Pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string));
    params.push(parseInt(offset as string));

    const result = await db.query(sql, params);
    
    // Format response values
    const products = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      barcode: row.barcode,
      category: row.category,
      imageUrl: row.image_url,
      description: row.description,
      rating: parseFloat(row.rating),
      reviewsCount: parseInt(row.reviews_count),
      minPrice: row.min_price ? parseFloat(row.min_price) : null,
      storeCount: parseInt(row.store_count)
    }));

    res.json(products);
  } catch (error) {
    console.error('Ürünler listelenirken hata:', error);
    res.status(500).json({ error: 'Ürünler listelenemedi' });
  }
});

// 3. Get Single Product Details & Store Prices & Price History
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // A. Product info
    const productRes = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }
    const product = productRes.rows[0];

    // B. Store Prices Comparison
    const pricesRes = await db.query(
      `SELECT store_key, price, discount_rate, product_url, updated_at 
       FROM product_prices 
       WHERE product_id = $1 AND price IS NOT NULL
       ORDER BY price ASC`,
      [id]
    );

    // C. Price History for Charts (last 30 days)
    const historyRes = await db.query(
      `SELECT store_key, price, recorded_at 
       FROM price_history 
       WHERE product_id = $1 AND recorded_at >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY recorded_at ASC`,
      [id]
    );

    // Format results
    const prices = pricesRes.rows.map((row: any) => ({
      storeKey: row.store_key,
      price: parseFloat(row.price),
      discountRate: parseFloat(row.discount_rate),
      productUrl: row.product_url,
      updatedAt: row.updated_at
    }));

    const history: Record<string, { date: string; price: number }[]> = {};
    historyRes.rows.forEach((row: any) => {
      const store = row.store_key;
      const dateStr = new Date(row.recorded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      if (!history[store]) {
        history[store] = [];
      }
      history[store].push({
        date: dateStr,
        price: parseFloat(row.price)
      });
    });

    res.json({
      id: product.id,
      name: product.name,
      brand: product.brand,
      barcode: product.barcode,
      category: product.category,
      imageUrl: product.image_url,
      description: product.description,
      rating: parseFloat(product.rating),
      reviewsCount: parseInt(product.reviews_count),
      prices,
      priceHistory: history
    });

  } catch (error) {
    console.error('Ürün detayı çekilirken hata:', error);
    res.status(500).json({ error: 'Ürün detayı alınamadı' });
  }
});

// 4. Force Scrape trigger endpoint (Protected in real apps, public for tests)
app.post('/api/scrape/trigger', async (req: Request, res: Response) => {
  try {
    // Run async so it doesn't block the HTTP request
    runAllScrapers();
    res.json({ message: 'Kazıma işlemi arka planda başlatıldı.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Setup Cron Job: Run scrapers every night at 03:00 AM
cron.schedule('0 3 * * *', () => {
  console.log('Zamanlanmış gece kazıma işlemi (Cron) tetiklendi.');
  runAllScrapers();
});

// Start Server
app.listen(port, () => {
  console.log(`Makyaj Karşılaştırma API ${port} portunda çalışıyor.`);
});
