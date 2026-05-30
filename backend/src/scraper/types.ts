export interface ScrapedProduct {
  name: string;
  brand: string;
  barcode: string; // EAN-13 veya GTIN barkod (Urun eslestirme anahtari)
  category: string;
  imageUrl: string;
  description: string;
  price: number;
  discountRate: number; // e.g., -20.00
  productUrl: string;
  rating?: number;
  reviewsCount?: number;
}
