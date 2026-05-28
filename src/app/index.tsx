import React, { useState, useMemo } from 'react';
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
  Linking,
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
  Layers,
  ChevronRight,
  ShoppingCart,
  Smile,
  Bookmark,
  HelpCircle,
  Percent,
  Compass
} from 'lucide-react-native';

import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { 
  searchAndSimulateProducts, 
  CATEGORIES, 
  Product, 
  getCategoryImage, 
  getProductSymbol
} from '@/constants/mockData';
import { useWishlist } from '@/context/WishlistContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 150;

const CAMPAIGNS = [
  {
    id: 'camp-1',
    title: 'Gratis Bahar Fırsatları',
    desc: 'Makyaj markalarında net %50 indirim.',
    badge: 'KAMPANYA',
    bg: '#FFF0F2',
    border: '#FFD1DC',
  },
  {
    id: 'camp-2',
    title: 'Akıllı Bölünmüş Sepet',
    desc: 'Ürünleri en ucuz mağazalardan eş zamanlı alın.',
    badge: 'ÖNERİ',
    bg: '#F5EFFF',
    border: '#E0CCFF',
  },
  {
    id: 'camp-3',
    title: 'Rossmann Hafta Sonu İndirimi',
    desc: 'Özel serilerde sepette ek %15 makas avantajı.',
    badge: 'HAFTALIK',
    bg: '#EAF8FF',
    border: '#C2E5FF',
  }
];

export default function HomeScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Custom Product modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customCategory, setCustomCategory] = useState('ruj');

  // Load all simulated products
  const allProducts = useMemo(() => {
    return searchAndSimulateProducts('', 'all');
  }, []);

  // Filtered products list for general grid / category filtering
  const filteredProducts = useMemo(() => {
    let list = [...allProducts];
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim().length > 0) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [allProducts, selectedCategory, searchQuery]);

  // Suggestions search list
  const suggestions = useMemo(() => {
    if (searchQuery.trim().length === 0) return [];
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [allProducts, searchQuery]);

  // Günün Fırsatları: Ortalama fiyat düşüşü (change < 0) olan en yüksek indirimliler
  const dealsOfDay = useMemo(() => {
    return allProducts
      .filter(p => p.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 8);
  }, [allProducts]);

  // Popüler Ürünler: Yorum sayısı (reviewsCount) en yüksek olanlar
  const popularProducts = useMemo(() => {
    return allProducts
      .sort((a, b) => b.reviewsCount - a.reviewsCount)
      .slice(0, 8);
  }, [allProducts]);

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

  const handleAddCustomProduct = () => {
    if (!customName.trim()) return;
    const basePrice = 120 + (Math.random() * 300);
    const roundPrice = (p: number) => Math.round(p / 5) * 5 - 0.1;

    const brandName = customBrand.trim() || 'Özel Marka';
    const newProductSymbol = getProductSymbol(brandName, customName.trim());

    const newProduct: Product = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      brand: brandName,
      symbol: newProductSymbol,
      change: -Math.floor(Math.random() * 20) - 2,
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

  const getCategoryIcon = (catId: string, color: string, size: number) => {
    switch (catId) {
      case 'all': return <Sparkles color={color} size={size} />;
      case 'ruj': return <Heart color={color} size={size} />;
      case 'rimel': return <Eye color={color} size={size} />;
      case 'kalem': return <Layers color={color} size={size} />;
      case 'allik': return <Smile color={color} size={size} />;
      case 'far': return <Bookmark color={color} size={size} />;
      case 'oje': return <HelpCircle color={color} size={size} />;
      case 'cilt': return <Compass color={color} size={size} />;
      case 'sac': return <HelpCircle color={color} size={size} />;
      default: return <Sparkles color={color} size={size} />;
    }
  };

  // Render Horizontal Product Card
  const renderHorizontalProductCard = (item: Product) => {
    const cheapest = getCheapestPriceInfo(item.prices);
    const inWatchlist = isInWishlist(item.id);
    const discountPercent = Math.abs(Math.round(item.change));
    const isDiscounted = item.change < 0;

    // Calculate original price roughly if discounted
    const originalPrice = cheapest ? (cheapest.price / (1 - discountPercent / 100)) : 0;

    return (
      <Pressable
        key={item.id}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
        style={[styles.horizontalCard, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}
      >
        {/* Wishlist toggle badge */}
        <Pressable
          onPress={() => {
            if (inWatchlist) {
              removeFromWishlist(item.id);
            } else {
              addToWishlist(item, 'Hızlı Karşılaştırma Ekle');
            }
          }}
          style={styles.cardHeartIcon}
        >
          <Heart 
            size={14} 
            color={inWatchlist ? themeColors.accent : themeColors.textSecondary} 
            fill={inWatchlist ? themeColors.accent : 'transparent'} 
          />
        </Pressable>

        <View style={styles.cardImageWrapper}>
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardBrand, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {item.brand.toUpperCase()}
          </Text>
          <Text style={[styles.cardTitleText, { color: themeColors.text }]} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.cardRatingRow}>
            <Sparkles size={8} color="#F2CC8F" />
            <Text style={[styles.cardRatingText, { color: themeColors.textSecondary }]}>
              {item.rating.toFixed(1)} ({item.reviewsCount})
            </Text>
          </View>

          {cheapest ? (
            <View style={styles.cardPriceSection}>
              {isDiscounted && (
                <View style={styles.originalPriceRow}>
                  <Text style={[styles.cardOriginalPrice, { color: themeColors.textSecondary }]}>
                    ₺{Math.round(originalPrice)}
                  </Text>
                  <View style={[styles.cardDiscountBadge, { backgroundColor: themeColors.success }]}>
                    <Text style={styles.cardDiscountBadgeText}>%{discountPercent}</Text>
                  </View>
                </View>
              )}
              <Text style={[styles.cardCheapestPrice, { color: themeColors.text }]}>
                ₺{cheapest.price.toFixed(1)}
              </Text>
              <Text style={[styles.cardCheapestStore, { color: themeColors.accent }]} numberOfLines={1}>
                {cheapest.store}'de en ucuz
              </Text>
            </View>
          ) : (
            <Text style={[styles.cardNoPrice, { color: themeColors.textSecondary }]}>Stokta Yok</Text>
          )}
        </View>
      </Pressable>
    );
  };

  // Render Grid Product Card (2 Columns)
  const renderGridProductCard = (item: Product) => {
    const cheapest = getCheapestPriceInfo(item.prices);
    const inWatchlist = isInWishlist(item.id);
    const discountPercent = Math.abs(Math.round(item.change));
    const isDiscounted = item.change < 0;
    const originalPrice = cheapest ? (cheapest.price / (1 - discountPercent / 100)) : 0;

    return (
      <Pressable
        key={item.id}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
        style={[styles.gridCard, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}
      >
        {/* Wishlist button */}
        <Pressable
          onPress={() => {
            if (inWatchlist) {
              removeFromWishlist(item.id);
            } else {
              addToWishlist(item, 'Grid Ürün Takip');
            }
          }}
          style={styles.cardHeartIcon}
        >
          <Heart 
            size={14} 
            color={inWatchlist ? themeColors.accent : themeColors.textSecondary} 
            fill={inWatchlist ? themeColors.accent : 'transparent'} 
          />
        </Pressable>

        <View style={styles.gridImageWrapper}>
          <Image source={{ uri: item.image }} style={styles.gridImage} />
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardBrand, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {item.brand.toUpperCase()}
          </Text>
          <Text style={[styles.cardTitleText, { color: themeColors.text }]} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.cardRatingRow}>
            <Sparkles size={8} color="#F2CC8F" />
            <Text style={[styles.cardRatingText, { color: themeColors.textSecondary }]}>
              {item.rating.toFixed(1)} ({item.reviewsCount})
            </Text>
          </View>

          {cheapest ? (
            <View style={styles.cardPriceSection}>
              {isDiscounted && (
                <View style={styles.originalPriceRow}>
                  <Text style={[styles.cardOriginalPrice, { color: themeColors.textSecondary }]}>
                    ₺{Math.round(originalPrice)}
                  </Text>
                  <View style={[styles.cardDiscountBadge, { backgroundColor: themeColors.success }]}>
                    <Text style={styles.cardDiscountBadgeText}>%{discountPercent}</Text>
                  </View>
                </View>
              )}
              <Text style={[styles.cardCheapestPrice, { color: themeColors.text }]}>
                ₺{cheapest.price.toFixed(1)}
              </Text>
              <Text style={[styles.cardCheapestStore, { color: themeColors.accent }]}>
                {cheapest.store}'de en ucuz
              </Text>
            </View>
          ) : (
            <Text style={[styles.cardNoPrice, { color: themeColors.textSecondary }]}>Stokta Yok</Text>
          )}
        </View>
      </Pressable>
    );
  };

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.logoText, { color: themeColors.text }]}>GlowPrice ✨</Text>
          <Text style={[styles.subtitleText, { color: themeColors.textSecondary }]}>En Uygun Fiyatı Süzün</Text>
        </View>
        <Pressable 
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: themeColors.primary }]}
        >
          <Plus color="#4A3538" size={16} />
          <Text style={styles.addButtonText}>Ürün Ekle</Text>
        </Pressable>
      </View>

      {/* Prominent Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBarContainer, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
          <Search color={themeColors.textSecondary} size={18} style={styles.searchIcon} />
          <TextInput
            placeholder="Ürün, marka veya kategori ara..."
            placeholderTextColor={themeColors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSuggestions(text.length > 0);
            }}
            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
            style={[styles.searchInput, { color: themeColors.text }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => {
              setSearchQuery('');
              setShowSuggestions(false);
            }}>
              <X color={themeColors.textSecondary} size={18} />
            </Pressable>
          )}
        </View>

        {/* Suggestion Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionBox, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
            {suggestions.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setSearchQuery(item.name);
                  setShowSuggestions(false);
                }}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  { backgroundColor: pressed ? themeColors.backgroundSelected : 'transparent' }
                ]}
              >
                <Search size={12} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.suggestionText, { color: themeColors.text }]} numberOfLines={1}>
                  {item.brand} - {item.name}
                </Text>
                <ChevronRight size={12} color={themeColors.textSecondary} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}>
        
        {/* Campaign Banner Carousel (Conditional) */}
        {!hasSearch && selectedCategory === 'all' && (
          <View style={styles.bannerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled snapToAlignment="center" snapToInterval={width - Spacing.six} contentContainerStyle={styles.bannerScroll}>
              {CAMPAIGNS.map(item => (
                <View key={item.id} style={[styles.bannerCard, { backgroundColor: item.bg, borderColor: item.border }]}>
                  <View style={styles.bannerBadge}>
                    <Text style={styles.bannerBadgeText}>{item.badge}</Text>
                  </View>
                  <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.bannerDesc} numberOfLines={2}>{item.desc}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category Circle Row */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={styles.categoryCircleItem}
                >
                  <View 
                    style={[
                      styles.categoryCircle, 
                      { 
                        backgroundColor: isSelected ? themeColors.primary : themeColors.backgroundElement,
                        borderColor: isSelected ? themeColors.accent : themeColors.border 
                      }
                    ]}
                  >
                    {getCategoryIcon(cat.id, isSelected ? '#4A3538' : themeColors.text, 20)}
                  </View>
                  <Text 
                    style={[
                      styles.categoryLabel, 
                      { 
                        color: isSelected ? themeColors.text : themeColors.textSecondary,
                        fontWeight: isSelected ? '700' : '500' 
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* MAIN PRODUCT DISPLAYS */}
        {hasSearch || selectedCategory !== 'all' ? (
          /* ACTIVE FILTER GRID DISPLAY */
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Arama ve Filtre Sonuçları</Text>
              <Text style={[styles.sectionSubtitleText, { color: themeColors.textSecondary }]}>
                {filteredProducts.length} ürün bulundu
              </Text>
            </View>
            <View style={styles.productGrid}>
              {filteredProducts.map(renderGridProductCard)}
            </View>
            {filteredProducts.length === 0 && (
              <View style={styles.emptyResults}>
                <AlertCircle size={32} color={themeColors.textSecondary} />
                <Text style={[styles.emptyResultsTitle, { color: themeColors.text }]}>Eşleşen Ürün Bulunamadı</Text>
                <Text style={[styles.emptyResultsSubtitle, { color: themeColors.textSecondary }]}>
                  Seçtiğiniz filtreye uygun kozmetik ürünü bulunmamaktadır.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* DEFAULT CURATED HOMEPAGE SECTIONS */
          <>
            {/* Günün Fırsatları */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Percent size={16} color={themeColors.success} />
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Günün İndirim Fırsatları</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {dealsOfDay.map(renderHorizontalProductCard)}
              </ScrollView>
            </View>

            {/* Popüler Ürünler */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ShoppingCart size={16} color={themeColors.accent} />
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Borsada En Çok Arananlar</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {popularProducts.map(renderHorizontalProductCard)}
              </ScrollView>
            </View>

            {/* Sizin İçin Seçtiklerimiz (Tüm Ürünler Grid) */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} color={themeColors.accent} />
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Sizin İçin Seçtiklerimiz</Text>
                </View>
              </View>
              <View style={styles.productGrid}>
                {allProducts.slice(0, 16).map(renderGridProductCard)}
              </View>
            </View>
          </>
        )}
      </ScrollView>

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
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Yeni Ürün Ekle</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X color={themeColors.text} size={24} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Ürün Adı *</Text>
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
                <Text style={styles.submitButtonText}>Ürünü Kaydet & Karşılaştır</Text>
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
    paddingBottom: Spacing.two,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: '#4A3538',
    fontSize: 11,
    fontWeight: '700',
  },
  // Search section
  searchSection: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    zIndex: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  suggestionBox: {
    position: 'absolute',
    top: 45,
    left: Spacing.three,
    right: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    zIndex: 100,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  suggestionText: {
    fontSize: 12,
    flex: 1,
  },
  // Banners
  bannerContainer: {
    marginVertical: Spacing.two,
  },
  bannerScroll: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  bannerCard: {
    width: width - Spacing.six,
    padding: Spacing.three + 2,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  bannerBadge: {
    backgroundColor: '#4A3538',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  bannerBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4A3538',
    marginTop: 2,
  },
  bannerDesc: {
    fontSize: 11,
    color: '#60484B',
    lineHeight: 15,
  },
  // Categories circle lists
  categoriesContainer: {
    marginVertical: Spacing.two,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.three,
    gap: 12,
  },
  categoryCircleItem: {
    alignItems: 'center',
    width: 66,
  },
  categoryCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  // Section layout
  sectionContainer: {
    marginVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  horizontalScroll: {
    gap: Spacing.two,
    paddingBottom: 4,
  },
  // Product Card styles
  horizontalCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gridCard: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  cardHeartIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageWrapper: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  gridImageWrapper: {
    width: '100%',
    height: 110,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  cardBody: {
    padding: Spacing.two,
    gap: 2,
  },
  cardBrand: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitleText: {
    fontSize: 11,
    fontWeight: '600',
    height: 32,
    lineHeight: 15,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cardRatingText: {
    fontSize: 9,
    fontWeight: '500',
  },
  cardPriceSection: {
    marginTop: 6,
    gap: 1,
  },
  originalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardOriginalPrice: {
    fontSize: 9,
    textDecorationLine: 'line-through',
  },
  cardDiscountBadge: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardDiscountBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  cardCheapestPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardCheapestStore: {
    fontSize: 9,
    fontWeight: '600',
  },
  cardNoPrice: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    gap: 6,
  },
  emptyResultsTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyResultsSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  // Modal layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
