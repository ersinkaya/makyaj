import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Platform,
  useColorScheme,
  Linking,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Star, 
  Heart, 
  Check, 
  Store,
  ExternalLink,
  Info,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Calendar
} from 'lucide-react-native';

import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { 
  STORE_NAMES, 
  CATEGORIES
} from '@/constants/mockData';
import { useWishlist } from '@/context/WishlistContext';
import { apiService, ApiProductDetail, ApiStorePrice } from '@/services/api';

interface HistoryItem {
  date: string;
  price: number;
  change: number;
}

export default function ProductDetailScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [apiProduct, setApiProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const periods = [
    { label: '1 Ay', days: 30 },
    { label: '3 Ay', days: 90 },
    { label: '6 Ay', days: 180 },
  ];

  // Fetch product detail on mount/id change
  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const detail = await apiService.getProductDetail(id);
        setApiProduct(detail);
      } catch (err) {
        console.error('Ürün detayı yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // Adapt ApiProductDetail to standard Product type
  const product = useMemo(() => {
    if (!apiProduct) return null;
    
    const change = apiProduct.prices[0]?.discountRate || 0.0;
    const pricesObj: Record<string, number | null> = {
      gratis: null, watsons: null, rossmann: null, eve: null, sephora: null, trendyol: null, hepsiburada: null
    };
    apiProduct.prices.forEach(p => {
      pricesObj[p.storeKey] = p.price;
    });

    return {
      id: apiProduct.id,
      name: apiProduct.name,
      brand: apiProduct.brand,
      symbol: apiProduct.barcode || getProductSymbol(apiProduct.brand, apiProduct.name),
      change: change,
      category: apiProduct.category,
      image: apiProduct.imageUrl,
      rating: apiProduct.rating,
      reviewsCount: apiProduct.reviewsCount,
      prices: pricesObj as any,
      description: apiProduct.description
    };
  }, [apiProduct]);

  // Helper for generating standard ticker symbol
  function getProductSymbol(brand: string, name: string): string {
    const cleanBrand = brand.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
    const cleanName = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
    return `${cleanBrand}-${cleanName}`;
  }

  const inWatchlist = useMemo(() => {
    return product ? isInWishlist(product.id) : false;
  }, [product, isInWishlist]);

  // Sort prices from cheapest to most expensive
  const storePricesList = useMemo(() => {
    if (!apiProduct) return [];

    return apiProduct.prices.map((p: ApiStorePrice) => ({
      storeKey: p.storeKey,
      storeName: STORE_NAMES[p.storeKey as keyof typeof STORE_NAMES] || p.storeKey,
      price: p.price,
      discountRate: p.discountRate,
      productUrl: p.productUrl
    }));
  }, [apiProduct]);

  const cheapest = storePricesList[0];

  // Extract historical price data for the selected period
  const historicalData = useMemo((): HistoryItem[] => {
    if (!apiProduct || !cheapest) return [];
    
    const historyList = apiProduct.priceHistory[cheapest.storeKey] || [];
    const mapped = historyList.map((item: { date: string; price: number }, index: number) => {
      const prevPrice = index > 0 ? historyList[index - 1].price : item.price;
      const change = prevPrice !== 0 ? ((item.price - prevPrice) / prevPrice) * 100 : 0;
      return {
        date: item.date,
        price: item.price,
        change: parseFloat(change.toFixed(1)),
      };
    });

    // Reverse to show newest dates first
    return [...mapped].reverse().slice(0, Math.ceil(selectedPeriod / 3));
  }, [cheapest, selectedPeriod, apiProduct]);

  const openStoreUrl = (storeKey: string) => {
    if (!apiProduct || !product) return;
    const storeInfo = apiProduct.prices.find((p: ApiStorePrice) => p.storeKey === storeKey);
    if (storeInfo && storeInfo.productUrl) {
      Linking.openURL(storeInfo.productUrl).catch(() => {
        const query = `${product.brand} ${product.name}`;
        Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
      });
    } else {
      const query = `${product.brand} ${product.name}`;
      let url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={{ marginTop: 12, color: themeColors.textSecondary, fontSize: 13, fontWeight: '600' }}>Ürün detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <AlertCircle color={themeColors.danger} size={48} />
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>Ürün Bulunamadı</Text>
          <Pressable 
            onPress={() => router.back()} 
            style={[styles.backBtn, { backgroundColor: themeColors.primary }]}
          >
            <Text style={styles.backBtnText}>Geri Dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isDrop = product.change < 0;
  const discountPercent = Math.abs(Math.round(product.change));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Navbar */}
      <View style={[styles.navBar, { borderBottomColor: themeColors.border }]}>
        <Pressable 
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: themeColors.backgroundElement }]}
        >
          <ArrowLeft color={themeColors.text} size={20} />
        </Pressable>
        <Text style={[styles.navTitle, { color: themeColors.text }]} numberOfLines={1}>Ürün Detayı</Text>
        <Pressable
          onPress={() => {
            if (inWatchlist) {
              removeFromWishlist(product.id);
            } else {
              addToWishlist(product, 'Detay Sayfasından Takip');
            }
          }}
          style={[styles.iconButton, { backgroundColor: themeColors.backgroundElement }]}
        >
          <Heart 
            color={inWatchlist ? themeColors.accent : themeColors.text} 
            fill={inWatchlist ? themeColors.accent : 'transparent'} 
            size={20} 
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Image Preview */}
        <View style={[styles.imageCard, { backgroundColor: '#FFF', borderColor: themeColors.border }]}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
        </View>

        {/* Product Info Card */}
        <View style={[styles.priceCard, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
          <View style={styles.priceHeader}>
            <View style={styles.brandBadgeWrapper}>
              <View style={[styles.brandBadge, { backgroundColor: themeColors.primary + '30', borderColor: themeColors.primary }]}>
                <Text style={[styles.brandBadgeText, { color: themeColors.accent }]}>{product.brand}</Text>
              </View>
            </View>
            
            <View style={[styles.ratingBadge, { backgroundColor: themeColors.primary + '20' }]}>
              <Star size={12} color="#F2CC8F" fill="#F2CC8F" style={{ marginRight: 3 }} />
              <Text style={[styles.ratingTextVal, { color: themeColors.text }]}>{product.rating}</Text>
            </View>
          </View>

          <Text style={[styles.productName, { color: themeColors.text }]}>{product.name}</Text>
          <Text style={[styles.categoryLabelText, { color: themeColors.textSecondary }]}>
            Kategori: {CATEGORIES.find(c => c.id === product.category)?.name || product.category}
          </Text>

          <View style={styles.cheapestPriceWrapper}>
            <Text style={[styles.priceLabel, { color: themeColors.textSecondary }]}>En Uygun Satış Fiyatı</Text>
            {cheapest ? (
              <Text style={[styles.priceValue, { color: themeColors.text }]}>
                ₺{cheapest.price.toLocaleString('tr-TR')}
                <Text style={styles.priceStoreName}> ({cheapest.storeName})</Text>
              </Text>
            ) : (
              <Text style={[styles.priceValue, { color: themeColors.textSecondary }]}>Stokta Yok</Text>
            )}
          </View>

          {/* Change rate percentage indicator */}
          <View style={[styles.changeBadge, { backgroundColor: isDrop ? themeColors.success + '20' : themeColors.danger + '20' }]}>
            {isDrop ? (
              <TrendingDown size={14} color={themeColors.success} style={{ marginRight: 3 }} />
            ) : (
              <TrendingUp size={14} color={themeColors.danger} style={{ marginRight: 3 }} />
            )}
            <Text style={[styles.changeTextVal, { color: isDrop ? themeColors.success : themeColors.danger }]}>
              {isDrop ? `%${discountPercent} İndirim` : `%${discountPercent} Artış`} (Son 1 Ay)
            </Text>
          </View>
        </View>

        {/* Product Description */}
        <View style={[styles.card, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
          <View style={styles.cardHeader}>
            <Info color={themeColors.accent} size={16} />
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Ürün Açıklaması</Text>
          </View>
          <Text style={[styles.descriptionText, { color: themeColors.textSecondary }]}>
            {product.description || 'Bu makyaj ürünü hakkında detaylı açıklama yakında eklenecektir.'}
          </Text>
        </View>

        {/* Live Store Prices Table */}
        <View style={[styles.card, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
          <View style={styles.cardHeader}>
            <Store color={themeColors.accent} size={16} />
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Tüm Satış Noktaları</Text>
          </View>
          
          <View style={styles.pricesTable}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.tableHeaderLabel, { flex: 2, color: themeColors.textSecondary }]}>Mağaza</Text>
              <Text style={[styles.tableHeaderLabel, { flex: 1.5, color: themeColors.textSecondary, textAlign: 'right' }]}>Fiyat</Text>
              <Text style={[styles.tableHeaderLabel, { flex: 1.2, color: themeColors.textSecondary, textAlign: 'right' }]}>İşlem</Text>
            </View>

            {/* Table Rows */}
            {storePricesList.map((store, index) => {
              const isCheapest = index === 0;
              const deltaPercent = cheapest ? ((store.price - cheapest.price) / cheapest.price) * 100 : 0;

              return (
                <Pressable
                  key={store.storeKey}
                  onPress={() => openStoreUrl(store.storeKey)}
                  style={({ pressed }) => [
                    styles.tableRow,
                    { 
                      borderBottomColor: themeColors.border,
                      backgroundColor: pressed ? themeColors.backgroundSelected : 'transparent'
                    }
                  ]}
                >
                  <View style={[styles.tableCellStore, { flex: 2 }]}>
                    <Text style={[styles.storeText, { color: themeColors.text, fontWeight: isCheapest ? '700' : '500' }]}>
                      {store.storeName}
                    </Text>
                    {isCheapest && (
                      <View style={[styles.rowCheapestBadge, { backgroundColor: themeColors.success }]}>
                        <Text style={styles.rowCheapestBadgeText}>EN UCUZ</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                    <Text style={[styles.storePrice, { color: themeColors.text, fontWeight: isCheapest ? '800' : '700' }]}>
                      ₺{store.price.toFixed(1)}
                    </Text>
                    {!isCheapest && (
                      <Text style={[styles.deltaTextSmall, { color: themeColors.danger }]}>
                        +%{deltaPercent.toFixed(1)}
                      </Text>
                    )}
                  </View>
                  
                  <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                    <View style={styles.goButton}>
                      <ExternalLink size={12} color={themeColors.accent} />
                      <Text style={[styles.goButtonText, { color: themeColors.accent }]}>Git</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Historical Price Trend */}
        <View style={[styles.card, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
          <View style={styles.cardHeader}>
            <Calendar color={themeColors.accent} size={16} />
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Tarihsel Fiyat Değişimi</Text>
          </View>

          {/* Period selector */}
          <View style={styles.periodRow}>
            {periods.map((period) => (
              <Pressable
                key={period.days}
                onPress={() => setSelectedPeriod(period.days)}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.days && { backgroundColor: themeColors.accent, borderColor: themeColors.accent },
                  { borderColor: themeColors.border }
                ]}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period.days && { color: '#FFF' },
                    { color: themeColors.text }
                  ]}
                >
                  {period.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Historical Table data */}
          <View style={styles.historyList}>
            <View style={[styles.tableHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.tableHeaderLabel, { flex: 2, color: themeColors.textSecondary }]}>Tarih</Text>
              <Text style={[styles.tableHeaderLabel, { flex: 2, color: themeColors.textSecondary, textAlign: 'right' }]}>Fiyat</Text>
              <Text style={[styles.tableHeaderLabel, { flex: 1.5, color: themeColors.textSecondary, textAlign: 'right' }]}>Değişim</Text>
            </View>

            {historicalData.map((item, index) => {
              const changeIsDrop = item.change < 0;
              return (
                <View key={item.date} style={[styles.historyRow, index % 2 === 1 && { backgroundColor: themeColors.background + '40' }]}>
                  <Text style={[styles.historyDate, { flex: 2, color: themeColors.textSecondary }]}>{item.date}</Text>
                  <Text style={[styles.historyPrice, { flex: 2, color: themeColors.text, textAlign: 'right' }]}>
                    ₺{item.price.toFixed(1)}
                  </Text>
                  <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                    <View style={[styles.historyChangeBadge, { backgroundColor: changeIsDrop ? themeColors.success + '20' : themeColors.danger + '20' }]}>
                      <Text style={[styles.historyChangeText, { color: changeIsDrop ? themeColors.success : themeColors.danger }]}>
                        {changeIsDrop ? '' : '+'}{item.change.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.backgroundElement, borderTopColor: themeColors.border }]}>
        <View style={styles.bottomBarPrice}>
          <Text style={[styles.bottomLabel, { color: themeColors.textSecondary }]}>En iyi fiyat</Text>
          {cheapest ? (
            <Text style={[styles.bottomPriceVal, { color: themeColors.text }]}>
              ₺{cheapest.price.toFixed(1)} <Text style={[styles.bottomStoreTextVal, { color: themeColors.accent }]}>({cheapest.storeName})</Text>
            </Text>
          ) : (
            <Text style={[styles.bottomPriceVal, { color: themeColors.textSecondary }]}>Stokta Yok</Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            if (inWatchlist) {
              removeFromWishlist(product.id);
            } else {
              addToWishlist(product, 'Detay Sayfasından Hızlı Takip');
            }
          }}
          style={[
            styles.actionButton, 
            { 
              backgroundColor: inWatchlist ? themeColors.primary : themeColors.accent,
            }
          ]}
        >
          {inWatchlist ? (
            <>
              <Check color="#4A3538" size={16} />
              <Text style={[styles.actionText, { color: '#4A3538' }]}>Listemde</Text>
            </>
          ) : (
            <>
              <Heart color="#FFF" size={16} />
              <Text style={[styles.actionText, { color: '#FFF' }]}>Listeme Ekle</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six + 40,
  },
  // Cover Image
  imageCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#FFF',
  },
  // Price Card
  priceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three + 2,
    marginBottom: Spacing.three,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  brandBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingTextVal: {
    fontSize: 10,
    fontWeight: '800',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  categoryLabelText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  cheapestPriceWrapper: {
    marginTop: Spacing.three,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  priceStoreName: {
    fontSize: 13,
    fontWeight: '600',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
  changeTextVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  // Card elements
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three + 2,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 18,
  },
  // Prices table
  pricesTable: {
    gap: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    marginBottom: Spacing.one,
  },
  tableHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.one,
    borderRadius: 8,
  },
  tableCellStore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeText: {
    fontSize: 13,
  },
  rowCheapestBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rowCheapestBadgeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '800',
  },
  storePrice: {
    fontSize: 13,
  },
  deltaTextSmall: {
    fontSize: 9,
    fontWeight: '600',
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(232, 167, 181, 0.1)',
  },
  goButtonText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Period select
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.one + 2,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  periodButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // History table
  historyList: {
    marginTop: Spacing.one,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
  },
  historyDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyPrice: {
    fontSize: 12,
    fontWeight: '800',
  },
  historyChangeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  historyChangeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Platform.OS === 'ios' ? Spacing.four : Spacing.three,
  },
  bottomBarPrice: {
    flex: 1,
  },
  bottomLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  bottomPriceVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  bottomStoreTextVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + 1,
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  backBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
