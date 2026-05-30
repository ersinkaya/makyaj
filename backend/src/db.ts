import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:makyajpassword123@localhost:5432/makyajdb';

const pool = new Pool({
  connectionString,
  ssl: false
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool
};

// Test the database connection and initialize schema
pool.connect((err: any, client: any, release: any) => {
  if (err) {
    return console.error('Veritabanına bağlanırken hata oluştu:', err.stack);
  }
  console.log('PostgreSQL veritabanına başarıyla bağlanıldı. Şema doğrulanıyor...');
  
  initializeSchema(client)
    .then(() => {
      console.log('Veritabanı şeması başarıyla doğrulandı/kuruldu.');
      release();
    })
    .catch((schemaErr) => {
      console.error('Veritabanı şeması doğrulanırken hata oluştu:', schemaErr);
      release();
    });
});

async function initializeSchema(client: any): Promise<void> {
  // 1. uuid-ossp eklentisini aktif et
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  // 2. products tablosu
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      brand VARCHAR(100) NOT NULL,
      barcode VARCHAR(50) UNIQUE,
      category VARCHAR(50) NOT NULL,
      image_url TEXT,
      description TEXT,
      rating NUMERIC(3, 2) DEFAULT 0.0,
      reviews_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)');

  // 3. product_prices tablosu
  await client.query(`
    CREATE TABLE IF NOT EXISTS product_prices (
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      store_key VARCHAR(50) NOT NULL,
      price NUMERIC(10, 2),
      discount_rate NUMERIC(5, 2) DEFAULT 0.00,
      product_url TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (product_id, store_key)
    )
  `);

  // 4. price_history tablosu
  await client.query(`
    CREATE TABLE IF NOT EXISTS price_history (
      id SERIAL PRIMARY KEY,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      store_key VARCHAR(50) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      recorded_at DATE DEFAULT CURRENT_DATE,
      CONSTRAINT unique_product_store_date UNIQUE (product_id, store_key, recorded_at)
    )
  `);

  await client.query('CREATE INDEX IF NOT EXISTS idx_price_history_lookup ON price_history(product_id, store_key, recorded_at)');

  // 5. Güncelleme tetikleyicisi (trigger)
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    const triggerCheck = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name = 'update_products_updated_at'
    `);
    
    if (triggerCheck.rows.length === 0) {
      await client.query(`
        CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
      `);
    }
  } catch (triggerErr) {
    console.warn('Trigger oluşturma adımı atlandı:', triggerErr);
  }
}
