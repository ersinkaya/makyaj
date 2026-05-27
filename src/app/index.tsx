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
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { 
  Sparkles, 
  Heart, 
  Eye, 
  Edit3, 
  Smile, 
  Palette, 
  Scissors, 
  Activity, 
  Search, 
  Plus, 
  X, 
  Check, 
  AlertCircle,
  TrendingUp
} from 'lucide-react-native';

import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { searchAndSimulateProducts, CATEGORIES, Product, getCategoryImage } from '@/constants/mockData';
import { useWishlist } from '@/context/WishlistContext';

// Helper to get category icons dynamically
const getCategoryIcon = (iconName: string, color: string, size = 18) => {
  switch (iconName) {
    case 'sparkles': return <Sparkles color={color} size={size} />;
    case 'heart': return <Heart color={color} size={size} />;
    case 'eye': return <Eye color={color} size={size} />;
    case 'edit-3': return <Edit3 color={color} size={size} />;
    case 'smile': return <Smile color={color} size={size} />;
    case 'palette': return <Palette color={color} size={size} />;
    case 'scissors': return <Scissors color={color} size={size} />;
    case 'activity': return <Activity color={color} size={size} />;
    default: return <Sparkles color={color} size={size} />;
  }
};

const { width } = Dimensions.get('window');
const COLUMN_COUNT = width > 768 ? 3 : 2;

export default function HomeScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const router = useRouter();
  const { addToWishlist, isInWishlist } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Suggestions computation
  const suggestions = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const results = searchAndSimulateProducts(searchQuery, selectedCategory);
    return results.slice(0, 5); // limit to 5 suggestions
  }, [searchQuery, selectedCategory]);
  
  // Custom product modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customCategory, setCustomCategory] = useState('ruj');

  // Search & filter products
  const products = useMemo(() => {
    // If search query is empty, we show all products for that category from database
    return searchAndSimulateProducts(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleAddCustomProduct = () => {
    if (!customName.trim()) return;

    // Simulate store prices based on a mock base price
    const basePrice = 120 + (Math.random() * 300);
    const roundPrice = (p: number) => Math.round(p / 5) * 5 - 0.1;

    const newProduct: Product = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      brand: customBrand.trim() || 'Özel Marka',
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
      price: minPrice.toFixed(2),
      store: storeNames[storeKey] || storeKey,
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.logoText, { color: themeColors.text }]}>GlowPrice ✨</Text>
          <Text style={[styles.subtitleText, { color: themeColors.textSecondary }]}>En Uygun Makyaj Alışverişi</Text>
        </View>
        <Pressable 
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: themeColors.primary }]}
        >
          <Plus color="#FFF" size={20} />
          <Text style={styles.addButtonText}>Hızlı Ürün Ekle</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border, zIndex: 20 }]}>
        <Search color={themeColors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          placeholder="Rimel, ruj, oje, göz kalemi veya marka ara..."
          placeholderTextColor={themeColors.textSecondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onSubmitEditing={() => setShowSuggestions(false)}
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

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsDropdown, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {suggestions.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setSearchQuery(`${item.brand} ${item.name}`);
                  setShowSuggestions(false);
                }}
                style={[styles.suggestionRow, { borderBottomColor: themeColors.border }]}
              >
                <Search color={themeColors.textSecondary} size={14} style={styles.suggestionIcon} />
                <Text numberOfLines={1} style={[styles.suggestionText, { color: themeColors.text }]}>
                  <Text style={{ fontWeight: '800', color: themeColors.primary }}>{item.brand}</Text> {item.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryBadge,
                  { 
                    backgroundColor: isSelected ? themeColors.primary : themeColors.backgroundElement,
                    borderColor: isSelected ? themeColors.primary : themeColors.border
                  }
                ]}
              >
                {getCategoryIcon(cat.icon, isSelected ? '#FFF' : themeColors.textSecondary)}
                <Text 
                  style={[
                    styles.categoryLabel, 
                    { color: isSelected ? '#FFF' : themeColors.text, fontWeight: isSelected ? '700' : '500' }
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        key={COLUMN_COUNT} // Force re-render if column count changes on rotation/screen size
        contentContainerStyle={[styles.listContainer, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle color={themeColors.textSecondary} size={48} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Ürün Bulunamadı</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              "{searchQuery}" araması için sonuç bulunamadı. Ama endişelenmeyin! Bu ürünü listenize hemen ekleyebilirsiniz.
            </Text>
            <Pressable
              onPress={() => {
                setCustomName(searchQuery);
                setModalVisible(true);
              }}
              style={[styles.emptyButton, { backgroundColor: themeColors.primary }]}
            >
              <Text style={styles.emptyButtonText}>"{searchQuery}" Ürününü Kendin Ekle</Text>
            </Pressable>
          </View>
        }
        ListHeaderComponent={
          searchQuery.length === 0 && selectedCategory === 'all' ? (
            <View style={[styles.heroBanner, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
              <View style={styles.heroTextContainer}>
                <View style={styles.badgeRow}>
                  <TrendingUp color={themeColors.primary} size={16} />
                  <Text style={[styles.bannerBadgeText, { color: themeColors.primary }]}>Akıllı Alışveriş</Text>
                </View>
                <Text style={[styles.bannerTitle, { color: themeColors.text }]}>En Ucuz Fiyatları Karşılaştır!</Text>
                <Text style={[styles.bannerDesc, { color: themeColors.textSecondary }]}>
                  İhtiyaç duyduğun ürünleri listene ekle, Gratis, Watsons ve Rossmann fiyatlarını anında karşılaştırıp tasarruf et.
                </Text>
              </View>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=200&auto=format&fit=crop' }} 
                style={styles.bannerImage}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const cheapest = getCheapestPriceInfo(item.prices);
          const alreadyAdded = isInWishlist(item.id);

          return (
            <View style={[styles.productCard, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
              <Pressable 
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                style={styles.cardImageContainer}
              >
                <Image source={{ uri: item.image }} style={styles.productImage} />
                {item.rating > 4.7 && (
                  <View style={[styles.tagBadge, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.tagText}>Çok Sevilen</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.cardContent}>
                <Text numberOfLines={1} style={[styles.brandText, { color: themeColors.textSecondary }]}>
                  {item.brand}
                </Text>
                <Pressable 
                  onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                >
                  <Text numberOfLines={2} style={[styles.nameText, { color: themeColors.text }]}>
                    {item.name}
                  </Text>
                </Pressable>

                <View style={styles.ratingRow}>
                  <Text style={[styles.ratingText, { color: themeColors.text }]}>⭐ {item.rating}</Text>
                  <Text style={[styles.reviewsText, { color: themeColors.textSecondary }]}>
                    ({item.reviewsCount})
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <View>
                    <Text style={[styles.pricePrefix, { color: themeColors.textSecondary }]}>En iyi fiyat:</Text>
                    {cheapest ? (
                      <Text style={[styles.priceText, { color: themeColors.text }]}>
                        {cheapest.price} TL <Text style={styles.priceStore}>({cheapest.store})</Text>
                      </Text>
                    ) : (
                      <Text style={[styles.priceText, { color: themeColors.text }]}>Fiyat yok</Text>
                    )}
                  </View>

                  <Pressable
                    onPress={() => addToWishlist(item, 'Alışveriş listemden')}
                    disabled={alreadyAdded}
                    style={[
                      styles.circleAddButton, 
                      { 
                        backgroundColor: alreadyAdded ? themeColors.success : themeColors.primary,
                        shadowColor: themeColors.primary
                      }
                    ]}
                  >
                    {alreadyAdded ? (
                      <Check color="#FFF" size={18} />
                    ) : (
                      <Plus color="#FFF" size={18} />
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Custom Product Creator Modal */}
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
                placeholder="Örn: Super Stay Fondöten veya Golden Rose Ruj"
                placeholderTextColor={themeColors.textSecondary}
                value={customName}
                onChangeText={setCustomName}
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Marka</Text>
              <TextInput
                placeholder="Örn: Maybelline, Pastel, Flormar"
                placeholderTextColor={themeColors.textSecondary}
                value={customBrand}
                onChangeText={setCustomBrand}
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Kategori</Text>
              <View style={styles.modalCategories}>
                {CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
                  const isSelected = customCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCustomCategory(cat.id)}
                      style={[
                        styles.modalCategoryBadge,
                        { 
                          backgroundColor: isSelected ? themeColors.primary : themeColors.background,
                          borderColor: isSelected ? themeColors.primary : themeColors.border
                        }
                      ]}
                    >
                      <Text style={[styles.modalCategoryText, { color: isSelected ? '#FFF' : themeColors.text }]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.modalHelpText, { color: themeColors.textSecondary }]}>
                * Eklediğiniz ürün için Gratis, Watsons, Rossmann ve diğer mağaza fiyatları otomatik ve gerçekçi olarak simüle edilecektir. Ürünü listenize ekledikten sonra fiyat karşılaştırmasını anında görebilirsiniz.
              </Text>

              <Pressable
                onPress={handleAddCustomProduct}
                disabled={!customName.trim()}
                style={[
                  styles.saveButton, 
                  { 
                    backgroundColor: customName.trim() ? themeColors.primary : themeColors.textSecondary,
                  }
                ]}
              >
                <Text style={styles.saveButtonText}>Sepete / Listeme Ekle</Text>
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
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two - 2,
    paddingHorizontal: Spacing.three - 2,
    borderRadius: 20,
    gap: Spacing.one,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : Spacing.one,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  categoriesWrapper: {
    marginVertical: Spacing.one,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two - 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    borderWidth: 1,
    gap: Spacing.one + 2,
  },
  categoryLabel: {
    fontSize: 13,
  },
  listContainer: {
    paddingHorizontal: Spacing.three - 4,
    paddingTop: Spacing.two,
  },
  heroBanner: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    marginHorizontal: 4,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  bannerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  bannerDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  bannerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginLeft: Spacing.three,
  },
  productCard: {
    flex: 1,
    margin: 4,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#FFF',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tagBadge: {
    position: 'absolute',
    top: Spacing.one + 2,
    left: Spacing.one + 2,
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
  },
  tagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  cardContent: {
    padding: Spacing.two + 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  brandText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nameText: {
    fontSize: 13,
    fontWeight: '600',
    height: 36,
    lineHeight: 18,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewsText: {
    fontSize: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.two,
  },
  pricePrefix: {
    fontSize: 9,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  priceStore: {
    fontSize: 10,
    fontWeight: '500',
  },
  circleAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.three,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.two,
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    paddingBottom: Spacing.five,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : Spacing.one + 2,
    fontSize: 14,
  },
  modalCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  modalCategoryBadge: {
    borderWidth: 1,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalHelpText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: Spacing.four,
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 132,
    left: Spacing.three,
    right: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: Spacing.one,
    zIndex: 100,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: Spacing.two,
  },
  suggestionText: {
    fontSize: 13,
    flex: 1,
  },
});
