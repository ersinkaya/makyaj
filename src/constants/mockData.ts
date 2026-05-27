// Makyaj ve Bakım Ürünleri Zengin Veritabanı ve Simülasyon Motoru

export interface StorePrices {
  gratis: number | null;
  watsons: number | null;
  rossmann: number | null;
  eve: number | null;
  sephora: number | null;
  trendyol: number;
  hepsiburada: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  rating: number;
  reviewsCount: number;
  prices: StorePrices;
  description?: string;
  isCustom?: boolean;
}

export const CATEGORIES = [
  { id: 'all', name: 'Hepsi', icon: 'sparkles' },
  { id: 'ruj', name: 'Ruj & Dudak', icon: 'heart' },
  { id: 'rimel', name: 'Rimel & Maskara', icon: 'eye' },
  { id: 'kalem', name: 'Göz & Eyeliner', icon: 'edit-3' },
  { id: 'allik', name: 'Allık & Ten', icon: 'smile' },
  { id: 'far', name: 'Far Paleti', icon: 'palette' },
  { id: 'oje', name: 'Oje & El', icon: 'scissors' },
  { id: 'cilt', name: 'Cilt Bakım', icon: 'activity' },
  { id: 'sac', name: 'Saç Bakım', icon: 'wind' },
];

export const STORE_NAMES: Record<keyof StorePrices, string> = {
  gratis: 'Gratis',
  watsons: 'Watsons',
  rossmann: 'Rossmann',
  eve: 'Eve Shop',
  sephora: 'Sephora',
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
};

// Gerçek popüler makyaj ve bakım ürünleri veritabanı
function generateMassiveProducts(): Product[] {
  const brands = [
    'Maybelline New York', 'L\'Oreal Paris', 'NYX Professional Makeup', 'Pastel', 
    'Flormar', 'Golden Rose', 'Kiko Milano', 'Mac', 'Sephora Collection', 
    'Clinique', 'Dior', 'NARS', 'The Ordinary', 'Yves Rocher', 'Estee Lauder', 
    'Lancome', 'Shiseido', 'Revolution', 'Wet n Wild', 'Essence', 'Benefit Cosmetics',
    'Fenty Beauty', 'Charlotte Tilbury', 'Too Faced', 'Huda Beauty', 'Bobbi Brown',
    'Anastasia Beverly Hills', 'Urban Decay', 'Clarins', 'Note Cosmetique', 'Beaulis',
    'Mara Cosmetics', 'Gabrini', 'Farmasi', 'Kryolan', 'L\'Occitane'
  ];

  const categories = [
    { 
      id: 'ruj', 
      name: 'Ruj & Dudak', 
      prefix: [
        'Super Stay Likit Mat Ruj', 
        'Matte Lipstick Dudak Ruju', 
        'Lifter Gloss Dudak Parlatıcısı', 
        'Shine Lip Plumper Dolgunlaştırıcı', 
        'Waterproof Dudak Kalemi', 
        'Hydrating Lip Balm Nemlendirici',
        'Velvet Matte Lip Cream Ruj',
        'Nourishing Lip Oil Dudak Yağı'
      ] 
    },
    { 
      id: 'rimel', 
      name: 'Rimel & Maskara', 
      prefix: [
        'Lash Sensational Yelpaze Etkili Maskara', 
        'Sky High Uzunluk Veren Maskara', 
        'Crazy Volume Ekstra Hacimli Rimel', 
        'Waterproof 24h Dayanıklı Rimel', 
        'Curling Lift Kıvırıcı Fırçalı Maskara',
        'False Lash Efsanevi Dolgunluk Rimeli',
        'Defining Fiber Uzatan Maskara',
        'Volume Express Klasik Siyah Rimel'
      ] 
    },
    { 
      id: 'kalem', 
      name: 'Göz & Eyeliner', 
      prefix: [
        'Epic Ink Suya Dayanıklı Eyeliner', 
        'Kohl Kajal Yumuşak Siyah Göz Kalemi', 
        'Waterproof Gel Eyeliner Siyah', 
        'Precision Liquid Dipliner Mat', 
        'Asansörlü Definer Göz Kalemi',
        'Metallic Shimmer Renkli Göz Kalemi',
        'Epic Wear Yarı Kalıcı Eyeliner',
        'Super Matte Kalem Eyeliner'
      ] 
    },
    { 
      id: 'allik', 
      name: 'Allık & Ten', 
      prefix: [
        'Fit Me Luminous Kadife Toz Allık', 
        'Liquid Blush Doğal Likit Allık', 
        'Sweet Cheeks Kremsi Allık', 
        'Baked Terracotta Işıltılı Allık', 
        'Matte Poreless Kapatıcı Fondöten',
        'Radiant Lifting Islak Bitişli Fondöten',
        'Super Stay Full Coverage Kapatıcı',
        'Luminous Matte Sıkıştırılmış Pudra'
      ] 
    },
    { 
      id: 'far', 
      name: 'Far Paleti', 
      prefix: [
        'Nudes Palette 12 Renkli Göz Farı', 
        'Burgundy Warm Tonlar Sıcak Far Paleti', 
        'Ultimate Shadow Profesyonel Far Paleti', 
        'Single Chrome Işıltılı Tekli Far', 
        'Smoky Eye 6 Renkli Far Paleti',
        'Matte & Shimmer Pigmentli Göz Farı',
        'Desert Sunset 16 Renkli Far Paleti',
        'Glitter Pigment Toz Far'
      ] 
    },
    { 
      id: 'oje', 
      name: 'Oje & El', 
      prefix: [
        'Nail Enamel Uzun Süre Kalıcı Oje', 
        'Full Color Tek Katta Kapatıcı Oje', 
        'Quick Dry Hızlı Kuruyan Parlak Oje', 
        'Pure Color Bitkisel Formüllü Oje', 
        'Gel Shine Jel Bitişli Kalıcı Oje',
        'Matte Effect Kadifemsi Mat Oje',
        'Nail Care Güçlendirici Tırnak Bakım Ojesi',
        'Glitter Party Simli Tırnak Ojesi'
      ] 
    },
    { 
      id: 'cilt', 
      name: 'Cilt Bakım', 
      prefix: [
        'Hyaluronic Acid %2 + B5 Yoğun Nemlendirici', 
        'Glikolik Asit %7 Aydınlatıcı Tonik', 
        'Niacinamide %10 Gözenek Sıkılaştırıcı Serum', 
        'Vitamin C Günlük Işıltı Yüz Kremi', 
        'Salicylic Acid %2 Akne Karşıtı Jel', 
        'Retinol %1 Kırışıklık Karşıtı Gece Serumu',
        'Centella Asiatica Yatıştırıcı Bariyer Krem',
        'Moisturizing Ceramide Günlük Nemlendirici'
      ] 
    },
    { 
      id: 'sac', 
      name: 'Saç Bakım', 
      prefix: [
        'Dökülme Karşıtı Kafein Şampuan', 
        'Keratin Onarıcı Saç Maskesi', 
        'Argan Yağlı Besleyici Saç Serumu', 
        'Kolay Tarama Saç Kremi Spreyi', 
        'Saç Kökü Güçlendirici Tonik',
        'Isıya Karşı Koruyucu Saç Spreyi',
        'Yoğun Nemlendirici Saç Kremi',
        'Kuru Saçlar İçin Şampuan'
      ] 
    }
  ];

  const shades = [
    'No: 01 Light / Nude', 'No: 02 Pink / Gül Kurusu', 'No: 03 Peach / Şeftali', 
    'No: 04 Red / Klasik Kırmızı', 'No: 05 Plum / Mürdüm', 'No: 06 Coral / Mercan',
    'No: 101 Şeffaf / Natural', 'No: 102 Dark / Kahve', 'No: 103 Gold Glitter',
    'No: 104 Very Black', 'No: 12 Warm Sand', 'No: 24 Ivory Rose', 'No: 88 Cherry Red',
    'No: 99 Deep Berry', 'No: 200 Ultra Matte'
  ];

  const list: Product[] = [];

  // Handcrafted iconic products to keep database authentic
  const handcrafted: Product[] = [
    {
      id: 'm1',
      name: 'Lash Sensational Yelpaze Etkili Maskara',
      brand: 'Maybelline New York',
      category: 'rimel',
      image: 'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?q=80&w=300&auto=format&fit=crop',
      rating: 4.8,
      reviewsCount: 15420,
      prices: {
        gratis: 349.90,
        watsons: 369.90,
        rossmann: 355.00,
        eve: 339.90,
        sephora: null,
        trendyol: 319.00,
        hepsiburada: 325.00,
      },
      description: 'Tek tek ayrılmış, yoğun ve dolgun kirpikler için yelpaze etkili efsanevi maskara.',
    },
    {
      id: 'm2',
      name: 'Sky High Maskara Very Black',
      brand: 'Maybelline New York',
      category: 'rimel',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop',
      rating: 4.7,
      reviewsCount: 9850,
      prices: {
        gratis: 419.90,
        watsons: 399.90,
        rossmann: 405.00,
        eve: 389.90,
        sephora: null,
        trendyol: 375.00,
        hepsiburada: 379.00,
      },
      description: 'Sonsuz uzunluk ve hacim etkisi veren, bambu özü içeren esnek fırçalı maskara.',
    },
    {
      id: 'm3',
      name: 'I Love Extreme Volume Maskara Crazy Volume',
      brand: 'Essence',
      category: 'rimel',
      image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?q=80&w=300&auto=format&fit=crop',
      rating: 4.5,
      reviewsCount: 2240,
      prices: {
        gratis: 189.90,
        watsons: 199.90,
        rossmann: 185.00,
        eve: 179.90,
        sephora: null,
        trendyol: 165.00,
        hepsiburada: 169.00,
      },
      description: 'Ultra siyah pigmentli yapısıyla kirpiklerinize çılgın hacim kazandıran büyük elastomer fırçalı maskara.',
    },
    {
      id: 'r1',
      name: 'Super Stay Matte Ink Likit Mat Ruj (Seductress 65)',
      brand: 'Maybelline New York',
      category: 'ruj',
      image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=300&auto=format&fit=crop',
      rating: 4.6,
      reviewsCount: 8430,
      prices: {
        gratis: 329.90,
        watsons: 319.90,
        rossmann: 325.00,
        eve: 299.90,
        sephora: null,
        trendyol: 285.00,
        hepsiburada: 289.00,
      },
      description: '16 saate kadar kalıcı, dudakta kuruma yapmayan süper mat bitişli likit ruj.',
    },
    {
      id: 'r2',
      name: 'Almost Lipstick Dudak Parlatıcısı (Black Honey)',
      brand: 'Clinique',
      category: 'ruj',
      image: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=300&auto=format&fit=crop',
      rating: 4.9,
      reviewsCount: 1870,
      prices: {
        gratis: null,
        watsons: 850.00,
        rossmann: 850.00,
        eve: null,
        sephora: 920.00,
        trendyol: 810.00,
        hepsiburada: 825.00,
      },
      description: 'Her dudak renginde farklı ve doğal duran, kült ve yarı şeffaf efsanevi dudak nemlendiricisi.',
    },
    {
      id: 'r3',
      name: 'Dior Addict Lip Glow Oil (Cherry 015)',
      brand: 'Dior',
      category: 'ruj',
      image: 'https://images.unsplash.com/photo-1591348278863-a8fb3887e2ac?q=80&w=300&auto=format&fit=crop',
      rating: 4.9,
      reviewsCount: 650,
      prices: {
        gratis: null,
        watsons: null,
        rossmann: null,
        eve: null,
        sephora: 1850.00,
        trendyol: 1950.00,
        hepsiburada: 1920.00,
      },
      description: 'Dudakların doğal rengini ortaya çıkaran ve yoğun parlaklık sağlayan besleyici dudak yağı.',
    },
    {
      id: 'r4',
      name: 'Show By Pastel Show Your Game Likit Mat Ruj',
      brand: 'Pastel',
      category: 'ruj',
      image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=300&auto=format&fit=crop',
      rating: 4.4,
      reviewsCount: 3120,
      prices: {
        gratis: 149.90,
        watsons: 159.90,
        rossmann: 145.00,
        eve: 139.90,
        sephora: null,
        trendyol: 124.00,
        hepsiburada: 129.00,
      },
      description: 'Hafif formülü ile gün boyu kurutmadan matlık sağlayan kadifemsi ruj.',
    },
    {
      id: 'a1',
      name: 'Fit Me Luminous Matte Allık (Rose 25)',
      brand: 'Maybelline New York',
      category: 'allik',
      image: 'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?q=80&w=300&auto=format&fit=crop',
      rating: 4.5,
      reviewsCount: 4120,
      prices: {
        gratis: 279.90,
        watsons: 289.90,
        rossmann: 275.00,
        eve: 269.90,
        sephora: null,
        trendyol: 245.00,
        hepsiburada: 249.00,
      },
      description: 'Cilde doğal renk ve taze bir ışıltı veren, gün boyu kalıcı mat allık.',
    },
    {
      id: 'a2',
      name: 'Sweet Cheeks Creamy Powder Blush (Rose & Play)',
      brand: 'NYX Professional Makeup',
      category: 'allik',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop',
      rating: 4.7,
      reviewsCount: 1280,
      prices: {
        gratis: 369.90,
        watsons: 379.90,
        rossmann: 365.00,
        eve: 359.90,
        sephora: null,
        trendyol: 339.00,
        hepsiburada: 345.00,
      },
      description: 'Kadifemsi mat bitişe sahip, yüksek pigmentli krem-toz yapıda allık.',
    },
    {
      id: 'a3',
      name: 'Liquid Blush Likit Allık (Orgasm)',
      brand: 'NARS',
      category: 'allik',
      image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?q=80&w=300&auto=format&fit=crop',
      rating: 4.8,
      reviewsCount: 780,
      prices: {
        gratis: null,
        watsons: null,
        rossmann: null,
        eve: null,
        sephora: 1550.00,
        trendyol: 1650.00,
        hepsiburada: 1620.00,
      },
      description: 'Cilde anında doğal pembe-şeftali ışıltı ve taze bir görünüm kazandıran likit allık.',
    },
    {
      id: 'k1',
      name: 'Göz Kalemi Siyah (Waterproof 101)',
      brand: 'Flormar',
      category: 'kalem',
      image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?q=80&w=300&auto=format&fit=crop',
      rating: 4.6,
      reviewsCount: 5690,
      prices: {
        gratis: 119.90,
        watsons: 129.90,
        rossmann: 119.90,
        eve: 109.90,
        sephora: null,
        trendyol: 99.00,
        hepsiburada: 102.00,
      },
      description: 'Suya dayanıklı, akmayan, gün boyu gözlerde keskin siyahlık sağlayan göz kalemi.',
    },
    {
      id: 'k2',
      name: 'Epic Ink Liner Black',
      brand: 'NYX Professional Makeup',
      category: 'kalem',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop',
      rating: 4.7,
      reviewsCount: 6540,
      prices: {
        gratis: 429.90,
        watsons: 449.90,
        rossmann: 435.00,
        eve: 419.90,
        sephora: null,
        trendyol: 395.00,
        hepsiburada: 399.00,
      },
      description: 'Keskin ve belirgin çizgiler çekmenizi kolaylaştıran, suya dayanıklı fırça uçlu likit eyeliner.',
    },
    {
      id: 'o1',
      name: 'Nail Enamel Parlak Oje (454 Cherry Dessert)',
      brand: 'Flormar',
      category: 'oje',
      image: 'https://images.unsplash.com/photo-1604654894610-df4906b1126a?q=80&w=300&auto=format&fit=crop',
      rating: 4.6,
      reviewsCount: 3120,
      prices: {
        gratis: 64.90,
        watsons: 69.90,
        rossmann: 64.90,
        eve: 59.90,
        sephora: null,
        trendyol: 49.00,
        hepsiburada: 52.00,
      },
      description: 'Yüksek kapatıcılık ve parlaklık sunan, uzun süre soyulmayan klasik Flormar ojesi.',
    },
    {
      id: 'o2',
      name: 'Pure Nail Color Bitkisel Oje',
      brand: 'Yves Rocher',
      category: 'oje',
      image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=300&auto=format&fit=crop',
      rating: 4.5,
      reviewsCount: 890,
      prices: {
        gratis: null,
        watsons: null,
        rossmann: 180.00,
        eve: null,
        sephora: null,
        trendyol: 170.00,
        hepsiburada: 175.00,
      },
      description: 'Hindistan cevizi yağı ve bambu özüyle zenginleştirilmiş bitkisel formüllü oje.',
    },
    {
      id: 'f1',
      name: 'Nudes Of New York Far Paleti',
      brand: 'Maybelline New York',
      category: 'far',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop',
      rating: 4.7,
      reviewsCount: 3450,
      prices: {
        gratis: 589.90,
        watsons: 599.90,
        rossmann: 585.00,
        eve: 569.90,
        sephora: null,
        trendyol: 519.00,
        hepsiburada: 525.00,
      },
      description: '16 krem yapılı, nude ve sıcak tonlarda mat/ışıltılı renkler içeren göz farı paleti.',
    },
    {
      id: 'c1',
      name: 'Hyaluronic Acid 2% + B5 Nemlendirici Serum',
      brand: 'The Ordinary',
      category: 'cilt',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop',
      rating: 4.7,
      reviewsCount: 7120,
      prices: {
        gratis: null,
        watsons: null,
        rossmann: 520.00,
        eve: null,
        sephora: 590.00,
        trendyol: 460.00,
        hepsiburada: 475.00,
      },
      description: 'Cildin farklı katmanlarını yoğun şekilde nemlendiren, pürüzsüzleştiren hyalüronik asit serumu.',
    },
    {
      id: 'c2',
      name: 'Glikolik Asit %7 Gözenek Sıkılaştırıcı Tonik',
      brand: 'The Ordinary',
      category: 'cilt',
      image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=300&auto=format&fit=crop',
      rating: 4.6,
      reviewsCount: 5410,
      prices: {
        gratis: null,
        watsons: null,
        rossmann: 650.00,
        eve: null,
        sephora: 720.00,
        trendyol: 590.00,
        hepsiburada: 610.00,
      },
      description: 'Cildi nazikçe eksfoliye eden, cilt tonunu eşitleyen ve parlaklık veren glikolik asit toniği.',
    },
  ];

  // Add handcrafted products first
  handcrafted.forEach(p => list.push(p));

  brands.forEach((brand) => {
    categories.forEach((cat) => {
      cat.prefix.forEach((prodName) => {
        const seedBase = hashCode(brand + prodName);
        const numVariations = 4 + (seedBase % 5); // 4-8 variations
        
        for (let s = 0; s < numVariations; s++) {
          const shadeIndex = (hashCode(brand + prodName + s) % shades.length);
          const shade = shades[shadeIndex];
          const fullName = `${prodName} (${shade})`;

          if (list.some(p => p.name.toLowerCase() === fullName.toLowerCase() && p.brand.toLowerCase() === brand.toLowerCase())) {
            continue;
          }

          const seed = hashCode(brand + fullName);
          const basePrice = 110 + (seed % 1400);
          const rating = 4.1 + ((seed % 9) / 10);
          const reviews = 15 + (seed % 4200);
          
          const gratisDiff = 0.94 + ((seed % 12) / 100);
          const watsonsDiff = 0.95 + (((seed + 2) % 12) / 100);
          const rossmannDiff = 0.93 + (((seed + 4) % 12) / 100);
          const eveDiff = 0.90 + (((seed + 6) % 12) / 100);
          
          const isLuxury = brand === 'Clinique' || brand === 'Dior' || brand === 'NARS' || brand === 'Estee Lauder' || brand === 'Lancome' || brand === 'Shiseido' || brand === 'Bobbi Brown' || brand === 'Benefit Cosmetics' || brand === 'Charlotte Tilbury' || brand === 'Too Faced' || brand === 'Huda Beauty' || brand === 'Anastasia Beverly Hills' || brand === 'Urban Decay' || brand === 'Kryolan' || basePrice > 500;
          const sephoraDiff = isLuxury ? 1.05 + (((seed + 8) % 10) / 100) : null;
          
          const trendyolDiff = 0.85 + (((seed + 10) % 12) / 100);
          const hepsiburadaDiff = 0.87 + (((seed + 12) % 12) / 100);

          const roundPrice = (p: number | null) => {
            if (p === null) return null;
            return Math.round(p / 10) * 10 - 0.1;
          };

          const simulatedProduct: Product = {
            id: `gen-${seed}`,
            name: fullName,
            brand: brand,
            category: cat.id,
            image: getCategoryImage(cat.id, seed),
            rating: parseFloat(rating.toFixed(1)),
            reviewsCount: reviews,
            prices: {
              gratis: isLuxury ? null : roundPrice(basePrice * gratisDiff),
              watsons: isLuxury ? null : roundPrice(basePrice * watsonsDiff),
              rossmann: isLuxury && brand !== 'Shiseido' && brand !== 'Dior' ? roundPrice(basePrice * rossmannDiff) : (isLuxury ? null : roundPrice(basePrice * rossmannDiff)),
              eve: isLuxury ? null : roundPrice(basePrice * eveDiff),
              sephora: roundPrice(sephoraDiff ? basePrice * sephoraDiff : null),
              trendyol: roundPrice(basePrice * trendyolDiff) as number,
              hepsiburada: roundPrice(basePrice * hepsiburadaDiff) as number,
            },
            description: `${brand} kalitesiyle geliştirilmiş, çantanızdan eksik etmeyeceğiniz premium ${fullName}.`,
          };

          list.push(simulatedProduct);
        }
      });
    });
  });

  return list;
}

export const INITIAL_PRODUCTS: Product[] = generateMassiveProducts();

// String'e göre benzersiz sayı üreten basit hash fonksiyonu (deterministic simülasyon için)
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

const PRODUCT_VARIATIONS: Record<string, string[]> = {
  fondoten: [
    "Synchro Skin Self-Refreshing Fondöten SPF 30",
    "Synchro Skin Radiant Lifting Fondöten SPF 30",
    "Future Solution LX Premium Radiance Fondöten",
    "RevitalEssence Skin Glow Likit Fondöten SPF 30",
    "Fit Me Matte + Poreless Gözenek Kapatıcı Fondöten",
    "Infallible 24H Fresh Wear Likit Fondöten"
  ],
  ruj: [
    "Super Stay Matte Ink Kalıcı Likit Mat Ruj",
    "Almost Lipstick Doğal Işıltılı Dudak Ruju",
    "Color Sensational Dolgun Gösteren Ruj",
    "Lifter Gloss Nemlendirici Dudak Parlatıcısı",
    "Show Your Game Mat Bitişli Ruj"
  ],
  rimel: [
    "Lash Sensational Yelpaze Etkili Siyah Maskara",
    "Sky High Sonsuz Uzunluk Veren Maskara",
    "Falsies Lash Lift Kirpik Kaldırma Etkili Rimel",
    "I Love Extreme Crazy Volume Hacim Veren Maskara"
  ],
  kalem: [
    "Epic Ink Eyeliner Suya Dayanıklı Siyah Eyeliner",
    "Waterproof Jel Göz Kalemi Siyah",
    "Asansörlü Definer Göz Kalemi Mürdüm",
    "Epic Wear Yarı Kalıcı Renkli Eyeliner"
  ],
  allik: [
    "Fit Me Luminous Kadife Toz Allık",
    "Sweet Cheeks Krem-Toz Bitişli Allık",
    "Liquid Blush Işıltılı Likit Allık",
    "Stick Cream Allık Doğal Pembe"
  ],
  far: [
    "Nudes of New York 16 Renkli Far Paleti",
    "Burgundy Bar Sıcak Kızıl Göz Farı Paleti",
    "Show Your Style 10 Renkli Far Paleti",
    "Ultimate Shadow Palette Profesyonel Far Paleti"
  ],
  oje: [
    "Nail Enamel Hızlı Kuruyan Parlak Oje",
    "Pure Nail Color Bitkisel Formüllü Oje",
    "Full Color Tek Katta Kapatıcı Oje",
    "Breathing Jel Tırnak Nefes Alan Oje"
  ],
  cilt: [
    "Hyaluronic Acid %2 + B5 Nemlendirici Serum",
    "Glikolik Asit %7 Cilt Aydınlatıcı Tonik",
    "Niacinamide %10 Gözenek Sıkılaştırıcı Serum",
    "Natural Moisturizing Nemlendirici Yüz Kremi"
  ],
  sac: [
    "Dökülme Karşıtı Kafein Şampuanı",
    "Keratin Onarıcı Yoğun Saç Maskesi",
    "Argan Yağlı Besleyici Saç Bakım Serumu",
    "Isıya Karşı Koruyucu Parlaklık Spreyi",
    "Saç Dökülmesini Engelleyen Güçlendirici Tonik"
  ]
};

// Kullanıcının arattığı ve DB'de bulamadığı bir kelime için dinamik ve tutarlı simülasyon yapan motor
export function searchAndSimulateProducts(query: string, categoryId = 'all'): Product[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return categoryId === 'all' 
      ? INITIAL_PRODUCTS 
      : INITIAL_PRODUCTS.filter(p => p.category === categoryId);
  }
  
  // Önce gerçek veritabanını filtreleyelim
  let filtered = INITIAL_PRODUCTS.filter(p => {
    const matchQuery = p.name.toLowerCase().includes(normalizedQuery) || 
                       p.brand.toLowerCase().includes(normalizedQuery);
    const matchCategory = categoryId === 'all' || p.category === categoryId;
    return matchQuery && matchCategory;
  });

  // Eğer filtre sonucu boşsa ya da az ürün varsa (örn: 3'ten az ürün) ve arama terimi uzunsa,
  // kullanıcının arama terimine göre dinamik makyaj ürün çeşitlerini simüle ediyoruz!
  if (filtered.length < 3 && normalizedQuery.length >= 2) {
    const popularBrands = [
      'L\'Oreal Paris', 'Maybelline New York', 'NYX Professional Makeup', 'Pastel', 
      'Flormar', 'Golden Rose', 'Kiko Milano', 'Mac', 'Sephora Collection', 
      'Chanel', 'Dior', 'Clinique', 'Rossmann', 'Gratis Beauty', 'Yves Rocher', 
      'Shiseido', 'NARS', 'Estee Lauder', 'The Ordinary', 'Lancome'
    ];
    
    // Arama kelimelerinden birinin bilinen markalarla eşleşip eşleşmediğine bakalım
    let brand = '';
    for (const b of popularBrands) {
      if (normalizedQuery.includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    if (!brand) {
      // Eğer bilinen marka yoksa, aramanın ilk kelimesini marka kabul edelim (örn: "Shiseido Fondöten" -> "Shiseido")
      const words = query.trim().split(' ');
      brand = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
      if (brand.length < 2) brand = 'Makyaj Markası';
    }

    // Kategori tespiti yapalım
    let category = 'ruj';
    let categoryKey = 'ruj';
    if (normalizedQuery.includes('fondöten') || normalizedQuery.includes('kapatıcı') || normalizedQuery.includes('ten') || normalizedQuery.includes('pudra')) {
      category = 'allik';
      categoryKey = 'fondoten';
    } else if (normalizedQuery.includes('rimel') || normalizedQuery.includes('maskara') || normalizedQuery.includes('kirpik')) {
      category = 'rimel';
      categoryKey = 'rimel';
    } else if (normalizedQuery.includes('kalem') || normalizedQuery.includes('eyeliner') || normalizedQuery.includes('dipliner')) {
      category = 'kalem';
      categoryKey = 'kalem';
    } else if (normalizedQuery.includes('oje') || normalizedQuery.includes('tırnak')) {
      category = 'oje';
      categoryKey = 'oje';
    } else if (normalizedQuery.includes('far') || normalizedQuery.includes('palet') || normalizedQuery.includes('göz farı')) {
      category = 'far';
      categoryKey = 'far';
    } else if (normalizedQuery.includes('allık')) {
      category = 'allik';
      categoryKey = 'allik';
    } else if (normalizedQuery.includes('cilt') || normalizedQuery.includes('krem') || normalizedQuery.includes('serum') || normalizedQuery.includes('nemlendirici') || normalizedQuery.includes('tonik')) {
      category = 'cilt';
      categoryKey = 'cilt';
    } else if (normalizedQuery.includes('saç') || normalizedQuery.includes('şampuan') || normalizedQuery.includes('saç kremi') || normalizedQuery.includes('saç spreyi')) {
      category = 'sac';
      categoryKey = 'sac';
    } else {
      // Varsayılan kategori anahtarını seçelim
      category = categoryId === 'all' ? 'ruj' : categoryId;
      categoryKey = category === 'allik' ? 'allik' : category;
      if (categoryKey === 'all') categoryKey = 'ruj';
    }

    // Kategori filtresi uyuyor mu kontrol edelim
    if (categoryId === 'all' || category === categoryId) {
      const variations = PRODUCT_VARIATIONS[categoryKey] || PRODUCT_VARIATIONS['ruj'];
      
      variations.forEach((variant) => {
        // Eğer arama terimi belirli bir çeşidi kısıtlıyorsa, filtreleyelim
        // Örn: "Shiseido Radiant" arandıysa "Synchro Skin Self-Refreshing"ı eklemeyelim
        const variantLower = variant.toLowerCase();
        // Arama teriminden marka ismini çıkaralım ki daha rahat eşleşsin
        const cleanQuery = normalizedQuery.replace(brand.toLowerCase(), '').trim();
        if (cleanQuery.length > 2 && !variantLower.includes(cleanQuery)) {
          return;
        }

        // Marka ismini varyasyon adının önüne ekleyelim
        const fullName = `${brand} ${variant}`;
        
        // Bu ürünün zaten veritabanında veya filtrelenmiş listede olmadığından emin olalım
        const alreadyExists = filtered.some(p => p.name.toLowerCase() === fullName.toLowerCase());
        if (alreadyExists) return;

        const seed = hashCode(fullName);
        const basePrice = 120 + (seed % 1800); // Premium markalar için daha yüksek taban fiyat olabilsin
        
        const rating = 4.2 + ((seed % 8) / 10); // 4.2 - 4.9 arası puan
        const reviews = 20 + (seed % 2500); // 20 - 2520 arası yorum
        
        // Mağazaların fiyat fark katsayıları
        const gratisDiff = 0.95 + ((seed % 10) / 100);
        const watsonsDiff = 0.96 + (((seed + 1) % 10) / 100);
        const rossmannDiff = 0.94 + (((seed + 2) % 10) / 100);
        const eveDiff = 0.91 + (((seed + 3) % 10) / 100);
        
        // Sephora premium bir mağaza olduğu için yüksek fiyatlı ürünleri veya lüks markaları barındırsın
        const isLuxury = brand === 'Shiseido' || brand === 'Dior' || brand === 'Chanel' || brand === 'NARS' || brand === 'Lancome' || brand === 'Estee Lauder' || basePrice > 500;
        const sephoraDiff = isLuxury ? 1.05 + (((seed + 4) % 10) / 100) : null;
        
        const trendyolDiff = 0.86 + (((seed + 5) % 10) / 100);
        const hepsiburadaDiff = 0.88 + (((seed + 6) % 10) / 100);

        // Fiyat yuvarlama
        const roundPrice = (p: number | null) => {
          if (p === null) return null;
          return Math.round(p / 10) * 10 - 0.1;
        };

        const simulatedProduct: Product = {
          id: `sim-${seed}`,
          name: variant,
          brand: brand,
          category: category,
          image: getCategoryImage(category),
          rating: parseFloat(rating.toFixed(1)),
          reviewsCount: reviews,
          prices: {
            gratis: isLuxury ? null : roundPrice(basePrice * gratisDiff), // Lüks markalar Gratis/Watsons/Eve'de satılmasın
            watsons: isLuxury ? null : roundPrice(basePrice * watsonsDiff),
            rossmann: isLuxury && brand !== 'Shiseido' && brand !== 'Chanel' && brand !== 'Dior' ? roundPrice(basePrice * rossmannDiff) : (isLuxury ? null : roundPrice(basePrice * rossmannDiff)),
            eve: isLuxury ? null : roundPrice(basePrice * eveDiff),
            sephora: roundPrice(sephoraDiff ? basePrice * sephoraDiff : null),
            trendyol: roundPrice(basePrice * trendyolDiff) as number,
            hepsiburada: roundPrice(basePrice * hepsiburadaDiff) as number,
          },
          description: `${brand} kalitesiyle geliştirilmiş, çantanızdan eksik etmeyeceğiniz premium ${variant}.`,
          isCustom: true,
        };

        filtered.push(simulatedProduct);
      });
    }
  }

  return filtered;
}

// Kategorilere göre şık Unsplash görseli döndürür
export function getCategoryImage(category: string, seed = 0): string {
  const images: Record<string, string[]> = {
    ruj: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591348278863-a8fb3887e2ac?q=80&w=300&auto=format&fit=crop'
    ],
    rimel: [
      'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop'
    ],
    kalem: [
      'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?q=80&w=300&auto=format&fit=crop'
    ],
    allik: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=300&auto=format&fit=crop'
    ],
    far: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=300&auto=format&fit=crop'
    ],
    oje: [
      'https://images.unsplash.com/photo-1604654894610-df4906b1126a?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=300&auto=format&fit=crop'
    ],
    cilt: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=300&auto=format&fit=crop'
    ],
    sac: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595853035070-59a39fe84de3?q=80&w=300&auto=format&fit=crop'
    ]
  };

  const list = images[category] || [
    'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=300&auto=format&fit=crop'
  ];
  return list[Math.abs(seed) % list.length];
}
