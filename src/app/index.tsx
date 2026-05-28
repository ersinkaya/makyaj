import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  SafeAreaView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Sparkles, 
  Heart, 
  Eye, 
  Search, 
  Plus, 
  X, 
  Check, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShoppingCart,
  PlusCircle,
  Bookmark,
  Smile
} from 'lucide-react-native';

import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { 
  searchAndSimulateProducts, 
  CATEGORIES, 
  Product, 
  getCategoryImage, 
  getMarketIndices, 
  MarketIndex,
  getProductSymbol
} from '@/constants/mockData';
import { useWishlist } from '@/context/WishlistContext';
import packageJson from '../../package.json';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 1; // Stock-market style table layout is single-column

// Popular brands list for simulation and lookup
const POPULAR_BRANDS_LIST = [
  'Maybelline New York', 'L\'Oreal Paris', 'NYX Professional Makeup', 'Pastel', 
  'Flormar', 'Golden Rose', 'Kiko Milano', 'Mac', 'Sephora Collection', 
  'Clinique', 'Dior', 'NARS', 'The Ordinary', 'Yves Rocher', 'Estee Lauder', 
  'Lancome', 'Shiseido', 'Revolution', 'Wet n Wild', 'Essence', 'Benefit Cosmetics',
  'Fenty Beauty', 'Charlotte Tilbury', 'Too Faced', 'Huda Beauty', 'Bobbi Brown',
  'Anastasia Beverly Hills', 'Urban Decay', 'Clarins', 'Note Cosmetique', 'Beaulis',
  'Mara Cosmetics', 'Gabrini', 'Farmasi', 'Kryolan', 'L\'Occitane'
];

type MarketTab = 'bist' | 'brand' | 'category' | 'opportunity';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Navigation and Tab states
  const [activeTab, setActiveTab] = useState<MarketTab>('bist');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  
  // Sort states
  const [sortBy, setSortBy] = useState<'symbol' | 'discount' | 'reviews' | 'priceUp' | 'priceDown'>('symbol');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customCategory, setCustomCategory] = useState('ruj');

  // Infinite Scroll limit
  const [visibleLimit, setVisibleLimit] = useState(25);

  // Live indices state
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch indices and refresh lists
  const handleRefresh = () => {
    setRefreshing(true);
    setIndices(getMarketIndices());
    setTimeout(() => setRefreshing(false), 800);
  };

  useEffect(() => {
    setIndices(getMarketIndices());
  }, []);

  // Reset lazy load limit when filters change
  useEffect(() => {
    setVisibleLimit(25);
  }, [searchQuery, selectedCategory, selectedBrand, activeTab, sortBy]);

  // Caching filtered list to avoid performance drops
  const baseProducts = useMemo(() => {
    return searchAndSimulateProducts(searchQuery, 'all');
  }, [searchQuery]);

  // Filter products based on active tab and category/brand filters
  const filteredProducts = useMemo(() => {
    let list = [...baseProducts];

    // Under BIST tab, filter by selected category and brand
    if (activeTab === 'bist') {
      if (selectedCategory !== 'all') {
        list = list.filter(p => p.category === selectedCategory);
      }
      if (selectedBrand) {
        list = list.filter(p => p.brand.toLowerCase() === selectedBrand.toLowerCase());
      }
    } else if (activeTab === 'opportunity') {
      // Opportunities tab: filter only discounted products (change < 0)
      list = list.filter(p => p.change < 0);
    }

    return list;
  }, [baseProducts, selectedCategory, selectedBrand, activeTab]);

  // Find cheapest price helper
  const getCheapestPriceInfo = (prices: Product['prices']) => {
    let minPrice = Infinity;
    let storeKey = '';
    
    Object.entries(prices).forEach(([key, val]) => {
      if (val !== null && val < minPrice) {
        minPrice = val;
        storeKey = key;
      }
    });

    if (minPrice === Infinity) return null;

    const storeNames: Record<string, string> = {
      gratis: 'Gratis',
      watsons: 'Watsons',
      rossmann: 'Rossmann',
      eve: 'Eve',
      sephora: 'Sephora',
      trendyol: 'Trendyol',
      hepsiburada: 'HB',
    };

    return {
      price: minPrice,
      store: storeNames[storeKey] || storeKey,
    };
  };

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const aCheapest = getCheapestPriceInfo(a.prices)?.price || 0;
      const bCheapest = getCheapestPriceInfo(b.prices)?.price || 0;

      switch (sortBy) {
        case 'discount':
          // Sort by highest discount (most negative change first)
          return a.change - b.change;
        case 'reviews':
          return b.reviewsCount - a.reviewsCount;
        case 'priceUp':
          return aCheapest - bCheapest;
        case 'priceDown':
          return bCheapest - aCheapest;
        default:
          // A-Z symbol sort
          return a.symbol.localeCompare(b.symbol);
      }
    });
  }, [filteredProducts, sortBy]);

  const displayedProducts = useMemo(() => {
    return sortedProducts.slice(0, visibleLimit);
  }, [sortedProducts, visibleLimit]);

  // Compute Brand Index Values (dynamic list of brands and average prices)
  const brandIndices = useMemo(() => {
    const list: { brand: string; symbol: string; value: number; change: number; count: number }[] = [];
    
    POPULAR_BRANDS_LIST.forEach((br, index) => {
      const brandProducts = baseProducts.filter(p => p.brand.toLowerCase().includes(br.toLowerCase()));
      if (brandProducts.length === 0) return;

      let sumCheapest = 0;
      let sumChange = 0;
      let count = 0;

      brandProducts.forEach(p => {
        const cheapest = getCheapestPriceInfo(p.prices)?.price;
        if (cheapest) {
          sumCheapest += cheapest;
          sumChange += p.change;
          count++;
        }
      });

      if (count > 0) {
        const cleanBrand = br.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
        list.push({
          brand: br,
          symbol: `${cleanBrand}X`,
          value: parseFloat((sumCheapest / count).toFixed(2)),
          change: parseFloat((sumChange / count).toFixed(2)),
          count,
        });
      }
    });

    // Sort by largest brand indexes
    return list.sort((a, b) => b.count - a.count);
  }, [baseProducts]);

  // Compute Category Index Values
  const categoryIndices = useMemo(() => {
    const list: { categoryId: string; name: string; icon: string; value: number; change: number; count: number }[] = [];

    CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return;
      const catProducts = baseProducts.filter(p => p.category === cat.id);
      if (catProducts.length === 0) return;

      let sumCheapest = 0;
      let sumChange = 0;
      let count = 0;

      catProducts.forEach(p => {
        const cheapest = getCheapestPriceInfo(p.prices)?.price;
        if (cheapest) {
          sumCheapest += cheapest;
          sumChange += p.change;
          count++;
        }
      });

      if (count > 0) {
        list.push({
          categoryId: cat.id,
          name: cat.name,
          icon: cat.icon,
          value: parseFloat((sumCheapest / count).toFixed(2)),
          change: parseFloat((sumChange / count).toFixed(2)),
          count,
        });
      }
    });

    return list;
  }, [baseProducts]);

  const handleAddCustomProduct = () => {
    if (!customName.trim()) return;
    const basePrice = 120 + (Math.random() * 300);
    const roundPrice = (p: number) => Math.round(p / 5) * 5 - 0.1;

    const brandName = customBrand.trim() || 'Özel Marka';
    const cleanBrand = brandName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
    const cleanName = customName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
    const newProductSymbol = `${cleanBrand}-${cleanName}`;

    const newProduct: Product = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      brand: brandName,
      symbol: newProductSymbol,
      change: -Math.floor(Math.random() * 20),
      category: customCategory,
      image: getCategoryImage(customCategory),
      rating: 5.0,
      reviewsCount: 1,
      prices: {
        gratis: roundPrice(basePrice * 0.95),
        watsons: roundPrice(basePrice * 0.98),
        rossmann: roundPrice(basePrice * 0.96),
        eve: roundPrice(basePrice * 0.93),
        sephora: customCategory === 'parfum' ? roundPrice(basePrice * 1.5) : null,
        trendyol: roundPrice(basePrice * 0.90),
        hepsiburada: roundPrice(basePrice * 0.92),
      },
      isCustom: true,
      description: 'Kullanıcı tarafından eklenen özel ürün.',
    };

    addToWishlist(newProduct, 'Kendi listemden ekledim');
    setCustomName('');
    setCustomBrand('');
    setModalVisible(false);
  };

  const SORT_OPTIONS = [
    { key: 'symbol' as const, label: 'A-Z Sembol', icon: Sparkles },
    { key: 'discount' as const, label: 'En Yüksek İndirim', icon: TrendingDown },
    { key: 'priceUp' as const, label: 'En Düşük Fiyat', icon: ChevronDown },
    { key: 'priceDown' as const, label: 'En Yüksek Fiyat', icon: ChevronUp },
    { key: 'reviews' as const, label: 'Popülerlik (Yorum)', icon: Heart },
  ];

  const currentSort = SORT_OPTIONS.find(s => s.key === sortBy)!;

  // Render borsa index cards at the top
  const renderIndicesRow = () => (
    <View style={[styles.indicesRow, { backgroundColor: themeColors.backgroundElement, borderBottomColor: themeColors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.indicesScroll}>
        {indices.map(idx => {
          const isDrop = idx.change < 0;
          return (
            <View key={idx.symbol} style={[styles.indexCard, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
              <View style={styles.indexHeader}>
                <Text style={[styles.indexName, { color: themeColors.textSecondary }]}>{idx.name}</Text>
                <Text style={styles.indexSymbol}>{idx.symbol}</Text>
              </View>
              <Text style={[styles.indexValue, { color: themeColors.text }]}>
                ₺{idx.value.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </Text>
              <View style={[styles.indexChangeBadge, { backgroundColor: isDrop ? themeColors.success + '15' : themeColors.danger + '15' }]}>
                {isDrop ? (
                  <TrendingDown size={10} color={themeColors.success} />
                ) : (
                  <TrendingUp size={10} color={themeColors.danger} />
                )}
                <Text style={[styles.indexChangeText, { color: isDrop ? themeColors.success : themeColors.danger }]}>
                  %{Math.abs(idx.change).toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  // Render product item in borsa-takip style
  const renderProductItem = ({ item }: { item: Product }) => {
    const cheapest = getCheapestPriceInfo(item.prices);
    const inWatchlist = isInWishlist(item.id);
    const isDrop = item.change < 0;

    return (
      <Pressable 
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
        style={({ pressed }) => [
          styles.stockItem, 
          { 
            backgroundColor: pressed ? themeColors.backgroundSelected : themeColors.backgroundElement,
            borderBottomColor: themeColors.border
          }
        ]}
      >
        {/* Left Column: Ticker & Brand */}
        <View style={styles.stockLeft}>
          <View style={styles.stockSymbolRow}>
            <Text style={[styles.stockSymbol, { color: themeColors.text }]}>{item.symbol}</Text>
            <View style={[styles.brandBadge, { backgroundColor: themeColors.primary + '20', borderColor: themeColors.primary }]}>
              <Text style={[styles.brandBadgeText, { color: themeColors.accent }]}>{item.brand.split(' ')[0]}</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={[styles.stockName, { color: themeColors.textSecondary }]}>
            {item.name}
          </Text>
        </View>

        {/* Center Column: Price & Store */}
        <View style={styles.stockCenter}>
          {cheapest ? (
            <>
              <Text style={[styles.stockPrice, { color: themeColors.text }]}>
                ₺{cheapest.price.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </Text>
              <Text style={[styles.stockStore, { color: themeColors.textSecondary }]}>
                {cheapest.store}
              </Text>
            </>
          ) : (
            <Text style={[styles.stockPrice, { color: themeColors.textSecondary }]}>Fiyat Yok</Text>
          )}
        </View>

        {/* Right Column: Discount Change Badge */}
        <View style={styles.stockRight}>
          <View style={[styles.changeBadge, { backgroundColor: isDrop ? themeColors.success + '20' : themeColors.danger + '20' }]}>
            <Text style={[styles.changeText, { color: isDrop ? themeColors.success : themeColors.danger }]}>
              {isDrop ? '' : '+'}{item.change.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Watchlist toggle action */}
        <Pressable
          onPress={() => {
            if (inWatchlist) {
              removeFromWishlist(item.id);
            } else {
              addToWishlist(item, 'BIST Makyaj Listesinden Takip');
            }
          }}
          style={styles.actionIcon}
        >
          <Eye size={18} color={inWatchlist ? themeColors.accent : themeColors.textSecondary} fill={inWatchlist ? themeColors.accent + '30' : 'transparent'} />
        </Pressable>

        {/* Compare / Cart Action */}
        <Pressable
          onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
          style={styles.actionIcon}
        >
          <ShoppingCart size={18} color={themeColors.accent} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.logoText, { color: themeColors.text }]}>GlowPrice ✨</Text>
          <Text style={[styles.subtitleText, { color: themeColors.textSecondary }]}>Makyaj Fiyat Karşılaştırma Borsası</Text>
        </View>
        <Pressable 
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: themeColors.primary }]}
        >
          <Plus color="#4A3538" size={18} />
          <Text style={styles.addButtonText}>Hisse Ekle</Text>
        </Pressable>
      </View>

      {/* Makyaj Endeksleri */}
      {renderIndicesRow()}

      {/* Borsa Tabları */}
      <View style={[styles.tabBar, { backgroundColor: themeColors.backgroundElement, borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => setActiveTab('bist')}
          style={[styles.tabItem, activeTab === 'bist' && { borderBottomColor: themeColors.accent }]}
        >
          <Sparkles size={14} color={activeTab === 'bist' ? themeColors.accent : themeColors.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'bist' ? themeColors.text : themeColors.textSecondary }]}>
            BIST Makyaj
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('brand')}
          style={[styles.tabItem, activeTab === 'brand' && { borderBottomColor: themeColors.accent }]}
        >
          <Smile size={14} color={activeTab === 'brand' ? themeColors.accent : themeColors.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'brand' ? themeColors.text : themeColors.textSecondary }]}>
            Markalar
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('category')}
          style={[styles.tabItem, activeTab === 'category' && { borderBottomColor: themeColors.accent }]}
        >
          <Layers size={14} color={activeTab === 'category' ? themeColors.accent : themeColors.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'category' ? themeColors.text : themeColors.textSecondary }]}>
            Kategoriler
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('opportunity')}
          style={[styles.tabItem, activeTab === 'opportunity' && { borderBottomColor: themeColors.accent }]}
        >
          <TrendingDown size={14} color={activeTab === 'opportunity' ? themeColors.accent : themeColors.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'opportunity' ? themeColors.text : themeColors.textSecondary }]}>
            Fırsatlar
          </Text>
        </Pressable>
      </View>

      {/* SEARCH AND SORT BAR */}
      {activeTab === 'bist' && (
        <View style={styles.filterSection}>
          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
            <Search color={themeColors.textSecondary} size={16} style={styles.searchIcon} />
            <TextInput
              placeholder="Ürün veya marka ara... (örn: MAYB-LASH)"
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: themeColors.text }]}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X color={themeColors.textSecondary} size={16} />
              </Pressable>
            )}
          </View>

          {/* Quick Categories filter buttons under BIST tab */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[
                    styles.categoryChip,
                    { 
                      backgroundColor: isSelected ? themeColors.primary : themeColors.backgroundElement,
                      borderColor: isSelected ? themeColors.accent : themeColors.border 
                    }
                  ]}
                >
                  <Text style={[styles.categoryChipText, { color: isSelected ? '#4A3538' : themeColors.text, fontWeight: isSelected ? '700' : '500' }]}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sort row */}
          <View style={styles.sortRow}>
            <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
              {sortedProducts.length} Hisse Listeleniyor
            </Text>
            
            <Pressable 
              onPress={() => setShowSortMenu(!showSortMenu)}
              style={[styles.sortButton, { backgroundColor: themeColors.primary + '20' }]}
            >
              <currentSort.icon size={12} color={themeColors.accent} />
              <Text style={[styles.sortButtonText, { color: themeColors.accent }]}>{currentSort.label}</Text>
              {showSortMenu ? <ChevronUp size={10} color={themeColors.accent} /> : <ChevronDown size={10} color={themeColors.accent} />}
            </Pressable>
          </View>

          {/* Sort Dropdown */}
          {showSortMenu && (
            <View style={[styles.sortMenu, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
              {SORT_OPTIONS.map(opt => (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    setSortBy(opt.key);
                    setShowSortMenu(false);
                  }}
                  style={[styles.sortMenuItem, sortBy === opt.key && { backgroundColor: themeColors.primary + '20' }]}
                >
                  <opt.icon size={14} color={sortBy === opt.key ? themeColors.accent : themeColors.textSecondary} />
                  <Text style={[styles.sortMenuItemText, { color: sortBy === opt.key ? themeColors.text : themeColors.textSecondary }]}>
                    {opt.label}
                  </Text>
                  {sortBy === opt.key && <Check size={14} color={themeColors.accent} />}
                </Pressable>
              ))}
            </View>
          )}

          {/* Active Filter Indicator */}
          {selectedBrand && (
            <View style={styles.activeFilterContainer}>
              <Text style={[styles.activeFilterText, { color: themeColors.textSecondary }]}>
                Aktif Marka Filtresi: <Text style={{ fontWeight: 'bold', color: themeColors.text }}>{selectedBrand}</Text>
              </Text>
              <Pressable onPress={() => setSelectedBrand(null)} style={[styles.clearFilterBadge, { backgroundColor: themeColors.primary }]}>
                <Text style={styles.clearFilterBadgeText}>Kaldır</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* TAB CONTENT */}
      {activeTab === 'bist' && (
        <FlatList
          data={displayedProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: themeColors.border }]} />}
          contentContainerStyle={[styles.listContainer, { paddingBottom: BottomTabInset + Spacing.five }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={themeColors.accent} />}
          onEndReached={() => {
            if (visibleLimit < sortedProducts.length) {
              setVisibleLimit(prev => prev + 25);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertCircle size={40} color={themeColors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Eşleşen Hisse Bulunamadı</Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
                Arama kelimenize uygun makyaj ürünü borsada bulunamadı.
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'brand' && (
        <ScrollView 
          contentContainerStyle={[styles.gridContainer, { paddingBottom: BottomTabInset + Spacing.six }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionHeader, { color: themeColors.text }]}>Marka Fiyat Endeksleri (Forex)</Text>
          {brandIndices.map(item => {
            const isDrop = item.change < 0;
            return (
              <Pressable
                key={item.brand}
                onPress={() => {
                  setSelectedBrand(item.brand);
                  setActiveTab('bist');
                }}
                style={({ pressed }) => [
                  styles.indexRowCard,
                  { 
                    backgroundColor: pressed ? themeColors.backgroundSelected : themeColors.backgroundElement,
                    borderColor: themeColors.border
                  }
                ]}
              >
                <View style={styles.indexRowLeft}>
                  <Text style={[styles.indexRowSymbol, { color: themeColors.text }]}>{item.symbol}</Text>
                  <Text style={[styles.indexRowName, { color: themeColors.textSecondary }]}>{item.brand}</Text>
                </View>
                <View style={styles.indexRowCenter}>
                  <Text style={[styles.indexRowPrice, { color: themeColors.text }]}>
                    ₺{item.value.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </Text>
                  <Text style={[styles.indexRowCount, { color: themeColors.textSecondary }]}>
                    {item.count} Ürün
                  </Text>
                </View>
                <View style={[styles.indexRowBadge, { backgroundColor: isDrop ? themeColors.success + '20' : themeColors.danger + '20' }]}>
                  <Text style={[styles.indexRowBadgeText, { color: isDrop ? themeColors.success : themeColors.danger }]}>
                    {isDrop ? '' : '+'}{item.change.toFixed(1)}%
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {activeTab === 'category' && (
        <ScrollView 
          contentContainerStyle={[styles.gridContainer, { paddingBottom: BottomTabInset + Spacing.six }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionHeader, { color: themeColors.text }]}>Kategori Fiyat Endeksleri (Emtia)</Text>
          {categoryIndices.map(item => {
            const isDrop = item.change < 0;
            return (
              <Pressable
                key={item.categoryId}
                onPress={() => {
                  setSelectedCategory(item.categoryId);
                  setSelectedBrand(null);
                  setActiveTab('bist');
                }}
                style={({ pressed }) => [
                  styles.indexRowCard,
                  { 
                    backgroundColor: pressed ? themeColors.backgroundSelected : themeColors.backgroundElement,
                    borderColor: themeColors.border
                  }
                ]}
              >
                <View style={styles.indexRowLeft}>
                  <Text style={[styles.indexRowSymbol, { color: themeColors.text }]}>
                    {item.categoryId.toUpperCase().padEnd(6, 'X')}
                  </Text>
                  <Text style={[styles.indexRowName, { color: themeColors.textSecondary }]}>{item.name}</Text>
                </View>
                <View style={styles.indexRowCenter}>
                  <Text style={[styles.indexRowPrice, { color: themeColors.text }]}>
                    ₺{item.value.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </Text>
                  <Text style={[styles.indexRowCount, { color: themeColors.textSecondary }]}>
                    {item.count} Kalem
                  </Text>
                </View>
                <View style={[styles.indexRowBadge, { backgroundColor: isDrop ? themeColors.success + '20' : themeColors.danger + '20' }]}>
                  <Text style={[styles.indexRowBadgeText, { color: isDrop ? themeColors.success : themeColors.danger }]}>
                    {isDrop ? '' : '+'}{item.change.toFixed(1)}%
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {activeTab === 'opportunity' && (
        <FlatList
          data={displayedProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: themeColors.border }]} />}
          contentContainerStyle={[styles.listContainer, { paddingBottom: BottomTabInset + Spacing.five }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.opportunityBanner, { backgroundColor: themeColors.success + '10', borderColor: themeColors.success }]}>
              <TrendingDown size={24} color={themeColors.success} />
              <View style={styles.opportunityBannerText}>
                <Text style={[styles.opportunityBannerTitle, { color: themeColors.text }]}>Maksimum İndirimli Hisseler</Text>
                <Text style={[styles.opportunityBannerDesc, { color: themeColors.textSecondary }]}>
                  Ortalama piyasa fiyatına göre en çok değer kaybeden (en yüksek indirim oranına sahip) makyaj ürünleri listelenmiştir.
                </Text>
              </View>
            </View>
          }
          onEndReached={() => {
            if (visibleLimit < sortedProducts.length) {
              setVisibleLimit(prev => prev + 25);
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* QUICK PRODUCT ADD MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Borsaya Yeni Hisse Ekle</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X color={themeColors.text} size={24} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Hisse/Ürün Adı *</Text>
              <TextInput
                style={[styles.modalInput, { color: themeColors.text, backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                placeholder="Örn: Sky High Maskara Very Black"
                placeholderTextColor={themeColors.textSecondary}
                value={customName}
                onChangeText={setCustomName}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Marka Adı</Text>
              <TextInput
                style={[styles.modalInput, { color: themeColors.text, backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                placeholder="Örn: Maybelline New York"
                placeholderTextColor={themeColors.textSecondary}
                value={customBrand}
                onChangeText={setCustomBrand}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Kategori</Text>
              <View style={styles.modalCategoriesRow}>
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                  const isSelected = customCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCustomCategory(cat.id)}
                      style={[
                        styles.modalCategoryBadge,
                        { 
                          backgroundColor: isSelected ? themeColors.primary : themeColors.background,
                          borderColor: isSelected ? themeColors.accent : themeColors.border 
                        }
                      ]}
                    >
                      <Text style={[styles.modalCategoryBadgeText, { color: isSelected ? '#4A3538' : themeColors.text }]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={handleAddCustomProduct}
                style={[styles.submitButton, { backgroundColor: themeColors.accent }]}
              >
                <Text style={styles.submitButtonText}>Hisseli Ürünü Kaydet</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Platform.OS === 'ios' ? Spacing.two : Spacing.four,
    paddingBottom: Spacing.three,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two - 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: '#4A3538',
    fontSize: 12,
    fontWeight: '700',
  },
  // Indices Row
  indicesRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  indicesScroll: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  indexCard: {
    width: 120,
    padding: Spacing.two + 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  indexHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indexName: {
    fontSize: 9,
    fontWeight: '700',
  },
  indexSymbol: {
    fontSize: 8,
    color: '#E8A7B5',
    fontWeight: '700',
  },
  indexValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  indexChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  indexChangeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  // Tabs Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.two,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Filter Section
  filterSection: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  categoryScroll: {
    gap: Spacing.one + 2,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    borderRadius: 8,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sortMenu: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  sortMenuItemText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    borderRadius: 8,
    backgroundColor: 'rgba(232, 167, 181, 0.1)',
  },
  activeFilterText: {
    fontSize: 11,
  },
  clearFilterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clearFilterBadgeText: {
    fontSize: 9,
    color: '#4A3538',
    fontWeight: '700',
  },
  // Stock Items
  listContainer: {
    paddingHorizontal: Spacing.three,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  stockLeft: {
    flex: 1,
    marginRight: Spacing.two,
  },
  stockSymbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockSymbol: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  brandBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  stockName: {
    fontSize: 11,
    marginTop: 2,
  },
  stockCenter: {
    alignItems: 'flex-end',
    width: 90,
    marginRight: Spacing.three,
  },
  stockPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  stockStore: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  stockRight: {
    width: 65,
    alignItems: 'flex-end',
  },
  changeBadge: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionIcon: {
    padding: Spacing.one + 2,
    marginLeft: 4,
  },
  separator: {
    height: 1,
  },
  // End of lists
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: Spacing.five,
  },
  // Brand & Category lists
  gridContainer: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  indexRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
  indexRowLeft: {
    flex: 1,
  },
  indexRowSymbol: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D48C9E',
  },
  indexRowName: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  indexRowCenter: {
    alignItems: 'flex-end',
    marginRight: Spacing.three,
  },
  indexRowPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  indexRowCount: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  indexRowBadge: {
    width: 65,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 6,
  },
  indexRowBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  // Opportunity Banner
  opportunityBanner: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
    marginBottom: Spacing.three,
    alignItems: 'flex-start',
  },
  opportunityBannerText: {
    flex: 1,
  },
  opportunityBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  opportunityBannerDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.four,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    gap: Spacing.two,
    paddingBottom: Spacing.five,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  modalCategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  modalCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalCategoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: Spacing.three - 2,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
