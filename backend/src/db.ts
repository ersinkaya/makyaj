import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:makyajpassword123@localhost:5432/makyajdb';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool
};

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Veritabanına bağlanırken hata oluştu:', err.stack);
  }
  console.log('PostgreSQL veritabanına başarıyla bağlanıldı.');
  release();
});
