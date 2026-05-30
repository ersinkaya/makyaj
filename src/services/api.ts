import { Platform } from 'react-native';
import { Product, INITIAL_PRODUCTS, searchAndSimulateProducts } from '@/constants/mockData';

// PWA web üzerinde çalışırken Nginx reverse proxy (/api) kullanılabilmesi için relative path ('') tercih edilir.
// Mobil cihazda çalışırken VDS sunucunuzun IP'sini veya domainini port 3001 ile belirtmeniz gerekir.
export const API_BASE_URL = Platform.OS === 'web' ? '' : 'http://localhost:3001';

export interface ApiStorePrice {
  storeKey: string;
  price: number;
  discountRate: number;
  productUrl: string;
  updatedAt: string;
}

export interface ApiProductDetail {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  category: string;
  imageUrl: string;
  description: string;
  rating: number;
  reviewsCount: number;
  prices: ApiStorePrice[];
  priceHistory: Record<string, { date: string; price: number }[]>;
}

interface ApiProductSummary {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  category: string;
  imageUrl: string;
  description: string;
  rating: number;
  reviewsCount: number;
  minPrice: number | null;
  storeCount: number;
}

export const apiService = {
  // 1. Kategorileri Çek
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) throw new Error('Kategoriler alınamadı');
      return await response.json() as string[];
    } catch (error) {
      console.warn('Backend categories API bağlantısı başarısız, mock kategorileri dönülüyor.');
      return ['ruj', 'rimel', 'kalem', 'allik', 'far', 'oje', 'cilt', 'sac'];
    }
  },

  // 2. Ürünleri Listele / Ara
  getProducts: async (filters: {
    category?: string;
    query?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.query) queryParams.append('query', filters.query);
      if (filters.sort) queryParams.append('sort', filters.sort);
      if (filters.limit) queryParams.append('limit', String(filters.limit));
      if (filters.offset) queryParams.append('offset', String(filters.offset));

      const response = await fetch(`${API_BASE_URL}/api/products?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Ürünler alınamadı');
      
      const data = await response.json() as ApiProductSummary[];
      
      // Gelen veriyi Expo modeline uyarla
      return data.map((item: ApiProductSummary): Product => {
        const pricesObj: Record<string, number | null> = {
          gratis: null, watsons: null, rossmann: null, eve: null, sephora: null, trendyol: null, hepsiburada: null
        };
        // Listeleme ekranında en ucuz fiyatı göstermek için:
        pricesObj.trendyol = item.minPrice || 100.0; 

        return {
          id: item.id,
          name: item.name,
          brand: item.brand,
          symbol: getProductSymbol(item.brand, item.name),
          change: -10.00, // Başlangıç değişimi
          category: item.category,
          image: item.imageUrl || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop',
          rating: item.rating,
          reviewsCount: item.reviewsCount,
          prices: pricesObj as any, // Fiyat detayı tıklandığında alınır
          description: item.description,
          isCustom: false
        };
      });
    } catch (error) {
      console.warn('Backend products API bağlantısı başarısız, mock data kullanılıyor.');
      return searchAndSimulateProducts(filters.query || '', filters.category || 'all');
    }
  },

  // 3. Tekil Ürün Detayı ve Karşılaştırma Fiyatlarını Çek
  getProductDetail: async (id: string): Promise<ApiProductDetail> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
      if (!response.ok) throw new Error('Ürün detayı alınamadı');
      return await response.json() as ApiProductDetail;
    } catch (error) {
      console.warn('Backend product detail API bağlantısı başarısız, mock data üretiliyor.');
      
      // Mock fallback
      const mockProd = INITIAL_PRODUCTS.find(p => p.id === id) || INITIAL_PRODUCTS[0];
      
      // Mağaza fiyatlarını formatla
      const prices: ApiStorePrice[] = [];
      Object.entries(mockProd.prices).forEach(([store, price]) => {
        if (price !== null) {
          prices.push({
            storeKey: store,
            price: price,
            discountRate: mockProd.change,
            productUrl: 'https://google.com',
            updatedAt: new Date().toISOString()
          });
        }
      });

      // Mock fiyat geçmişi üret
      const priceHistory: Record<string, { date: string; price: number }[]> = {};
      prices.forEach((p: ApiStorePrice) => {
        priceHistory[p.storeKey] = [
          { date: '10 May', price: p.price * 1.1 },
          { date: '15 May', price: p.price * 1.05 },
          { date: '20 May', price: p.price * 0.98 },
          { date: '25 May', price: p.price }
        ];
      });

      return {
        id: mockProd.id,
        name: mockProd.name,
        brand: mockProd.brand,
        barcode: mockProd.symbol, // mock barkod
        category: mockProd.category,
        imageUrl: mockProd.image,
        description: mockProd.description || '',
        rating: mockProd.rating,
        reviewsCount: mockProd.reviewsCount,
        prices,
        priceHistory
      };
    }
  }
};

function getProductSymbol(brand: string, name: string): string {
  const cleanBrand = brand.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
  const cleanName = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
  return `${cleanBrand}-${cleanName}`;
}
