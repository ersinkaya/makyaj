import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  Platform,
  useColorScheme,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Check, 
  AlertTriangle, 
  TrendingDown, 
  ChevronRight,
  Store,
  Sparkles,
  Split,
  ShoppingBag,
  Info
} from 'lucide-react-native';

import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { useWishlist } from '@/context/WishlistContext';
import { STORE_NAMES, StorePrices } from '@/constants/mockData';

interface StoreResult {
  storeKey: keyof StorePrices;
  storeName: string;
  totalPrice: number;
  availableCount: number;
  totalCount: number;
  missingItems: string[];
}

export default function CompareScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  
  const router = useRouter();
  const { items } = useWishlist();
  const [activeTab, setActiveTab] = useState<'store' | 'split'>('store');

  const openStoreUrl = (storeKey: string, brand: string, name: string) => {
    const query = `${brand} ${name}`;
    let url = '';
    switch (storeKey) {
      case 'gratis':
        url = `https://www.gratis.com/arama?text=${encodeURIComponent(query)}`;
        break;
      case 'watsons':
        url = `https://www.watsons.com.tr/search?q=${encodeURIComponent(query)}`;
        break;
      case 'rossmann':
        url = `https://www.rossmann.com.tr/arama?q=${encodeURIComponent(query)}`;
        break;
      case 'eve':
        url = `https://www.eveshop.com.tr/arama?q=${encodeURIComponent(query)}`;
        break;
      case 'sephora':
        url = `https://www.sephora.com.tr/arama?q=${encodeURIComponent(query)}`;
        break;
      case 'trendyol':
        url = `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}`;
        break;
      case 'hepsiburada':
        url = `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`;
        break;
      default:
        url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
    Linking.openURL(url).catch((err) => console.error("URL açma hatası:", err));
  };

  // Total items in wishlist
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Unique products count
  const totalItemsCount = useMemo(() => {
    return items.length;
  }, [items]);

  // Compare results by single store
  const storeComparison = useMemo((): StoreResult[] => {
    if (items.length === 0) return [];

    const stores = Object.keys(STORE_NAMES) as (keyof StorePrices)[];

    const results = stores.map((storeKey) => {
      let totalPrice = 0;
      let availableCount = 0;
      const missingItems: string[] = [];

      items.forEach((item) => {
        const price = item.product.prices[storeKey];
        if (price !== null && price !== undefined) {
          totalPrice += price * item.quantity;
          availableCount += item.quantity;
        } else {
          missingItems.push(item.product.name);
        }
      });

      return {
        storeKey,
        storeName: STORE_NAMES[storeKey],
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        availableCount,
        totalCount: totalQuantity,
        missingItems,
      };
    });

    // Sort by: 1. Max availability, 2. Cheapest price
    return results.sort((a, b) => {
      if (a.availableCount !== b.availableCount) {
        return b.availableCount - a.availableCount;
      }
      return a.totalPrice - b.totalPrice;
    });
  }, [items, totalQuantity]);

  // Calculate split basket (buying each product at its cheapest store)
  const splitBasket = useMemo(() => {
    if (items.length === 0) return null;

    let totalSplitPrice = 0;
    const itemsWithCheapestStore = items.map((item) => {
      let minPrice = Infinity;
      let cheapestStoreKey: keyof StorePrices = 'trendyol';

      Object.entries(item.product.prices).forEach(([storeKey, val]) => {
        if (val !== null && val !== undefined && val < minPrice) {
          minPrice = val;
          cheapestStoreKey = storeKey as keyof StorePrices;
        }
      });

      const itemTotal = minPrice * item.quantity;
      totalSplitPrice += itemTotal;

      return {
        ...item,
        cheapestPrice: minPrice,
        cheapestStoreKey,
        cheapestStoreName: STORE_NAMES[cheapestStoreKey],
        itemTotal: parseFloat(itemTotal.toFixed(2)),
      };
    });

    // Find cheapest single store with 100% availability to calculate savings
    const completeSingleStore = storeComparison.find(
      (s) => s.availableCount === totalQuantity
    );

    const savings = completeSingleStore 
      ? completeSingleStore.totalPrice - totalSplitPrice 
      : 0;

    return {
      items: itemsWithCheapestStore,
      totalPrice: parseFloat(totalSplitPrice.toFixed(2)),
      savings: savings > 0 ? parseFloat(savings.toFixed(2)) : 0,
    };
  }, [items, storeComparison, totalQuantity]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.titleText, { color: themeColors.text }]}>Sepet Karşılaştırma</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: themeColors.backgroundElement }]}>
            <ShoppingBag color={themeColors.accent} size={42} />
          </View>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Sepetiniz Boş</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
            Mağazalar arası fiyat karşılaştırması ve akıllı sepet analizi yapabilmek için öncelikle listenize ürün eklemelisiniz.
          </Text>
          <Pressable 
            onPress={() => router.push('/')}
            style={[styles.exploreButton, { backgroundColor: themeColors.primary }]}
          >
            <Sparkles color="#4A3538" size={16} />
            <Text style={styles.exploreButtonText}>Ürünleri İncele & Ekle</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const cheapestSingleStore = storeComparison[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.titleText, { color: themeColors.text }]}>Mağaza Karşılaştırma</Text>
        <Text style={[styles.countText, { color: themeColors.textSecondary }]}>
          {totalItemsCount} Farklı Ürün ({totalQuantity} Adet)
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.segmentContainer, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
        <Pressable
          onPress={() => setActiveTab('store')}
          style={[
            styles.segmentButton,
            activeTab === 'store' && { backgroundColor: themeColors.background, borderColor: themeColors.border }
          ]}
        >
          <Store color={activeTab === 'store' ? themeColors.accent : themeColors.textSecondary} size={15} />
          <Text style={[styles.segmentText, { color: activeTab === 'store' ? themeColors.text : themeColors.textSecondary }]}>
            Tek Mağaza Sepeti
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('split')}
          style={[
            styles.segmentButton,
            activeTab === 'split' && { backgroundColor: themeColors.background, borderColor: themeColors.border }
          ]}
        >
          <Split color={activeTab === 'split' ? themeColors.accent : themeColors.textSecondary} size={15} />
          <Text style={[styles.segmentText, { color: activeTab === 'split' ? themeColors.text : themeColors.textSecondary }]}>
            Akıllı Bölünmüş Sepet
          </Text>
        </Pressable>
      </View>

      {activeTab === 'store' ? (
        /* SINGLE STORE COMPARISON LIST */
        <FlatList
          data={storeComparison}
          keyExtractor={(item) => item.storeKey}
          contentContainerStyle={[styles.listContainer, { paddingBottom: BottomTabInset + Spacing.five }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.summaryCard, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
              <View style={[styles.summaryBadge, { backgroundColor: themeColors.primary }]}>
                <TrendingDown color="#4A3538" size={12} />
                <Text style={styles.summaryBadgeText}>En Ucuz Tek Mağaza</Text>
              </View>
              <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
                {cheapestSingleStore.storeName} Sepeti
              </Text>
              <Text style={[styles.summaryDesc, { color: themeColors.textSecondary }]}>
                Listenizdeki tüm ürünleri tek bir mağazadan sipariş etmek isterseniz en uygun alternatifiniz.
              </Text>
              <View style={styles.summaryPriceRow}>
                <Text style={[styles.summaryPriceLabel, { color: themeColors.textSecondary }]}>Toplam Sepet Tutarı:</Text>
                <Text style={[styles.summaryPrice, { color: themeColors.text }]}>
                  ₺{cheapestSingleStore.totalPrice.toLocaleString('tr-TR')}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCheapest = index === 0 && item.availableCount === totalQuantity;
            const hasMissing = item.availableCount < totalQuantity;
            const percentageDiff = cheapestSingleStore.totalPrice > 0 
              ? ((item.totalPrice - cheapestSingleStore.totalPrice) / cheapestSingleStore.totalPrice) * 100
              : 0;

            return (
              <View style={[
                styles.storeRow, 
                { 
                  backgroundColor: themeColors.backgroundElement, 
                  borderColor: isCheapest ? themeColors.accent : themeColors.border,
                  borderWidth: isCheapest ? 1.5 : 1
                }
              ]}>
                <View style={styles.storeMainInfo}>
                  <View style={styles.storeNameContainer}>
                    <Text style={[styles.storeNameText, { color: themeColors.text }]}>
                      {item.storeName}
                    </Text>
                    {isCheapest && (
                      <View style={[styles.cheapestBadge, { backgroundColor: themeColors.accent }]}>
                        <Text style={styles.cheapestBadgeText}>EN UCUZ</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.availabilityRow}>
                    <Check color={hasMissing ? themeColors.warning : themeColors.success} size={12} />
                    <Text style={[styles.availabilityText, { color: themeColors.textSecondary }]}>
                      {item.availableCount}/{item.totalCount} Ürün Mevcut
                    </Text>
                  </View>
                </View>

                <View style={styles.storePriceInfo}>
                  <Text style={[styles.storePriceText, { color: themeColors.text }]}>
                    {item.totalPrice > 0 ? `₺${item.totalPrice.toLocaleString('tr-TR')}` : 'Fiyat Yok'}
                  </Text>
                  
                  {hasMissing ? (
                    <View style={[styles.missingBadge, { backgroundColor: themeColors.danger + '15' }]}>
                      <AlertTriangle color={themeColors.danger} size={10} />
                      <Text style={[styles.missingBadgeText, { color: themeColors.danger }]}>
                        {item.missingItems.length} Ürün Eksik
                      </Text>
                    </View>
                  ) : (
                    index > 0 && (
                      <View style={[styles.deltaBadge, { backgroundColor: themeColors.danger + '15' }]}>
                        <Text style={[styles.deltaText, { color: themeColors.danger }]}>
                          +{percentageDiff.toFixed(1)}% makas
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            );
          }}
        />
      ) : (
        /* SMART SPLIT BASKET LIST */
        splitBasket && (
          <FlatList
            data={splitBasket.items}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={[styles.listContainer, { paddingBottom: BottomTabInset + Spacing.six }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={[styles.splitSummaryCard, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.accent, borderWidth: 1 }]}>
                <View style={styles.summaryBadgeRow}>
                  <View style={[styles.splitBadge, { backgroundColor: themeColors.accent }]}>
                    <Split color="#FFF" size={12} />
                    <Text style={styles.splitBadgeText}>Akıllı Optimize Sepet</Text>
                  </View>
                  {splitBasket.savings > 0 && (
                    <View style={[styles.savingsBadge, { backgroundColor: themeColors.success }]}>
                      <Text style={styles.savingsBadgeText}>
                        ₺{splitBasket.savings.toLocaleString('tr-TR')} Cepte!
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.splitSummaryTitle, { color: themeColors.text }]}>
                  Bölünmüş Sipariş Planı
                </Text>
                <Text style={[styles.splitSummaryDesc, { color: themeColors.textSecondary }]}>
                  Listenizdeki her makyaj ürününü en ucuz olduğu mağazadan ayrı ayrı satın alarak sağlayacağınız maksimum tasarruf planı.
                </Text>
                
                <View style={styles.splitPriceRow}>
                  <View>
                    <Text style={[styles.splitPriceLabel, { color: themeColors.textSecondary }]}>Optimize Toplam Tutar:</Text>
                    <Text style={[styles.splitPrice, { color: themeColors.text }]}>
                      ₺{splitBasket.totalPrice.toLocaleString('tr-TR')}
                    </Text>
                  </View>
                  <View style={styles.arrowCompareContainer}>
                    {cheapestSingleStore && (
                      <Text style={[styles.oldPriceText, { color: themeColors.textSecondary }]}>
                        Tek Mağaza Fiyatı: ₺{cheapestSingleStore.totalPrice.toLocaleString('tr-TR')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => openStoreUrl(item.cheapestStoreKey, item.product.brand, item.product.name)}
                style={({ pressed }) => [
                  styles.splitItemRow, 
                  { 
                    backgroundColor: pressed ? themeColors.backgroundSelected : themeColors.backgroundElement, 
                    borderColor: themeColors.border,
                  }
                ]}
              >
                <View style={styles.splitItemLeft}>
                  <View style={styles.splitItemHeader}>
                    {/* Visual Product Image Thumbnail */}
                    <Image source={{ uri: item.product.image }} style={styles.splitItemThumbnail} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.splitItemBrand, { color: themeColors.textSecondary }]} numberOfLines={1}>
                          {item.product.brand}
                        </Text>
                        <View style={[styles.splitStoreBadge, { backgroundColor: themeColors.primary }]}>
                          <Text style={styles.splitStoreBadgeText}>{item.cheapestStoreName}</Text>
                        </View>
                      </View>
                      <Text numberOfLines={1} style={[styles.splitItemName, { color: themeColors.text }]}>
                        {item.product.name}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.splitItemQtyText, { color: themeColors.textSecondary }]}>
                    Adet: {item.quantity} · Birim: ₺{item.cheapestPrice.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.splitItemRight}>
                  <Text style={[styles.splitItemPrice, { color: themeColors.text }]}>
                    ₺{item.itemTotal.toFixed(1)}
                  </Text>
                  <ChevronRight size={14} color={themeColors.textSecondary} />
                </View>
              </Pressable>
            )}
          />
        )
      )}
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
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    padding: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.two - 1,
    borderRadius: 11,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: 4,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
    gap: 4,
    marginBottom: 4,
  },
  summaryBadgeText: {
    color: '#4A3538',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  summaryPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 167, 181, 0.2)',
    paddingTop: Spacing.two,
    marginTop: Spacing.two,
  },
  summaryPriceLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 16,
  },
  storeMainInfo: {
    flex: 1,
    gap: 4,
  },
  storeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  storeNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cheapestBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  cheapestBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  storePriceInfo: {
    alignItems: 'flex-end',
    gap: 3,
  },
  storePriceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  missingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  missingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  deltaText: {
    fontSize: 9,
    fontWeight: '800',
  },
  splitSummaryCard: {
    borderRadius: 18,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: 4,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  splitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
    gap: 4,
  },
  splitBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  savingsBadge: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
  },
  savingsBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  splitSummaryTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  splitSummaryDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  splitPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 167, 181, 0.2)',
    paddingTop: Spacing.two,
    marginTop: Spacing.two,
  },
  splitPriceLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  splitPrice: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  arrowCompareContainer: {
    alignItems: 'flex-end',
  },
  oldPriceText: {
    fontSize: 10,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  // Split items
  splitItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  splitItemLeft: {
    flex: 1,
    marginRight: Spacing.two,
  },
  splitItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitItemThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
    resizeMode: 'contain',
    backgroundColor: '#FFF',
  },
  splitItemBrand: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  splitStoreBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  splitStoreBadgeText: {
    fontSize: 8,
    color: '#4A3538',
    fontWeight: '800',
  },
  splitItemName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  splitItemQtyText: {
    fontSize: 10,
    marginTop: 4,
    marginLeft: 42, // offset for thumbnail align
  },
  splitItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  splitItemPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.six,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    gap: 6,
  },
  exploreButtonText: {
    color: '#4A3538',
    fontSize: 12,
    fontWeight: '800',
  },
});
