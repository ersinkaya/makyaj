-- Initialize Tables for Kozmetik Fiyat Karsilastirma

-- Create extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    barcode VARCHAR(50) UNIQUE, -- EAN-13 veya GTIN barkod (Urun eslestirme anahtari)
    category VARCHAR(50) NOT NULL,
    image_url TEXT,
    description TEXT,
    rating NUMERIC(3, 2) DEFAULT 0.0,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching and filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (to_tsvector('turkish', name));

-- 2. Product Prices Table (Current Store Prices)
CREATE TABLE IF NOT EXISTS product_prices (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    store_key VARCHAR(50) NOT NULL, -- 'gratis', 'watsons', 'rossmann', 'eve', 'sephora', 'trendyol', 'hepsiburada'
    price NUMERIC(10, 2), -- Null ise o magazada yok demektir
    discount_rate NUMERIC(5, 2) DEFAULT 0.00, -- İndirim yuzdesi (örn: -15.50)
    product_url TEXT, -- Magazadaki urun linki
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, store_key)
);

-- 3. Price History Table (For Charts)
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    store_key VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    recorded_at DATE DEFAULT CURRENT_DATE,
    CONSTRAINT unique_product_store_date UNIQUE (product_id, store_key, recorded_at)
);

-- Index for fast history querying
CREATE INDEX IF NOT EXISTS idx_price_history_lookup ON price_history(product_id, store_key, recorded_at);

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
