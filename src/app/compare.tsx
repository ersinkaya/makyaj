import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  SafeAreaView,
  Platform,
  useColorScheme,
  Linking,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { 
  Check, 
  AlertTriangle, 
  TrendingDown, 
  ArrowRight, 
  ShoppingBag, 
  Split, 
  Store,
  Sparkles,
  ChevronRight
} from 'lucide-react-native';

import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { useWishlist, WishlistItem } from '@/context/WishlistContext';
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
  const themeColors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const router = useRouter();
  const { items } = useWishlist();
  const [activeTab, setActiveTab] = useState<'store' | 'split'>('store'); // 'store' = single store, 'split' = split basket

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

  // Total items in wishlist (sum of quantities)
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
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

    // Sort by: 1. Max availability (if a store doesn't have the product, it shouldn't rank first), 2. Cheapest price
    return results.sort((a, b) => {
      if (a.availableCount !== b.availableCount) {
        return b.availableCount - a.availableCount; // More available first
      }
      return a.totalPrice - b.totalPrice; // Cheaper first
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
          <Text style={[styles.titleText, { color: themeColors.text }]}>Karşılaştırma</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: themeColors.backgroundElement }]}>
            <TrendingDown color={themeColors.primary} size={48} />
          </View>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Karşılaştırılacak Ürün Yok</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
            Mağazalardaki en ucuz fiyatları görebilmek için listenize en az bir makyaj ürünü eklemelisiniz.
          </Text>
          <Pressable 
            onPress={() => router.push('/')}
            style={[styles.exploreButton, { backgroundColor: themeColors.primary }]}
          >
            <Sparkles color="#FFF" size={18} />
            <Text style={styles.exploreButtonText}>Hemen Ürün Ekle</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Cheapest single store index 0 (since sorted)
  const cheapestSingleStore = storeComparison[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.titleText, { color: themeColors.text }]}>Fiyat Karşılaştırma</Text>
        <Text style={[styles.countText, { color: themeColors.textSecondary }]}>
          {totalQuantity} Ürün Sepeti
        </Text>
      </View>

      {/* Tabs / Toggle Segment */}
      <View style={[styles.segmentContainer, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
        <Pressable
          onPress={() => setActiveTab('store')}
          style={[
            styles.segmentButton,
            { backgroundColor: activeTab === 'store' ? themeColors.background : 'transparent' }
          ]}
        >
          <Store color={activeTab === 'store' ? themeColors.primary : themeColors.textSecondary} size={16} />
          <Text style={[styles.segmentText, { color: activeTab === 'store' ? themeColors.text : themeColors.textSecondary }]}>
            Tek Mağaza Karşılaştır
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('split')}
          style={[
            styles.segmentButton,
            { backgroundColor: activeTab === 'split' ? themeColors.background : 'transparent' }
          ]}
        >
          <Split color={activeTab === 'split' ? themeColors.primary : themeColors.textSecondary} size={16} />
          <Text style={[styles.segmentText, { color: activeTab === 'split' ? themeColors.text : themeColors.textSecondary }]}>
            Akıllı Sepet Bölme
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
              <View style={styles.summaryBadge}>
                <TrendingDown color="#FFF" size={16} />
                <Text style={styles.summaryBadgeText}>En Hesaplı Mağaza</Text>
              </View>
              <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
                {cheapestSingleStore.storeName}
              </Text>
              <Text style={[styles.summaryDesc, { color: themeColors.textSecondary }]}>
                Bu sepetteki ürünlerin tamamını ya da en büyük kısmını en ucuz fiyatla sunan mağaza.
              </Text>
              <View style={styles.summaryPriceRow}>
                <Text style={[styles.summaryPriceLabel, { color: themeColors.textSecondary }]}>Sepet Toplamı:</Text>
                <Text style={[styles.summaryPrice, { color: themeColors.text }]}>
                  {cheapestSingleStore.totalPrice} TL
                </Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCheapest = index === 0 && item.availableCount === totalQuantity;
            const hasMissing = item.availableCount < totalQuantity;

            return (
              <View style={[
                styles.storeRow, 
                { 
                  backgroundColor: themeColors.backgroundElement, 
                  borderColor: isCheapest ? themeColors.primary : themeColors.border,
                  borderWidth: isCheapest ? 2 : 1
                }
              ]}>
                <View style={styles.storeMainInfo}>
                  <View style={styles.storeNameContainer}>
                    <Text style={[styles.storeNameText, { color: themeColors.text }]}>
                      {item.storeName}
                    </Text>
                    {isCheapest && (
                      <View style={[styles.cheapestBadge, { backgroundColor: themeColors.primary }]}>
                        <Text style={styles.cheapestBadgeText}>En Ucuz</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.availabilityRow}>
                    <Check color={hasMissing ? themeColors.warning : themeColors.success} size={14} />
                    <Text style={[styles.availabilityText, { color: themeColors.textSecondary }]}>
                      {item.availableCount}/{item.totalCount} Ürün Mevcut
                    </Text>
                  </View>
                </View>

                <View style={styles.storePriceInfo}>
                  <Text style={[styles.storePriceText, { color: themeColors.text }]}>
                    {item.totalPrice > 0 ? `${item.totalPrice} TL` : 'Fiyat Yok'}
                  </Text>
                  {hasMissing && (
                    <View style={styles.missingBadge}>
                      <AlertTriangle color="#F2CC8F" size={10} />
                      <Text style={styles.missingBadgeText}>{item.missingItems.length} Eksik</Text>
                    </View>
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
              <View style={[styles.splitSummaryCard, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.primary, borderWidth: 1 }]}>
                <View style={styles.summaryBadgeRow}>
                  <View style={[styles.splitBadge, { backgroundColor: themeColors.primary }]}>
                    <Split color="#FFF" size={14} />
                    <Text style={styles.splitBadgeText}>Maksimum Tasarruf Sepeti</Text>
                  </View>
                  {splitBasket.savings > 0 && (
                    <View style={[styles.savingsBadge, { backgroundColor: themeColors.success }]}>
                      <Text style={styles.savingsBadgeText}>
                        {splitBasket.savings} TL Kazanç!
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.splitSummaryTitle, { color: themeColors.text }]}>
                  En Akıllı Karışık Sepet
                </Text>
                <Text style={[styles.splitSummaryDesc, { color: themeColors.textSecondary }]}>
                  Her ürünü en ucuz olduğu mağazadan alarak yapabileceğiniz en tasarruflu alışveriş planı.
                </Text>
                
                <View style={styles.splitPriceRow}>
                  <View>
                    <Text style={[styles.splitPriceLabel, { color: themeColors.textSecondary }]}>Optimize Toplam</Text>
                    <Text style={[styles.splitPrice, { color: themeColors.text }]}>
                      {splitBasket.totalPrice} TL
                    </Text>
                  </View>
                  <View style={styles.arrowCompareContainer}>
                    {cheapestSingleStore && (
                      <Text style={[styles.oldPriceText, { color: themeColors.textSecondary }]}>
                        Tek Mağazadan En Ucuz: {cheapestSingleStore.totalPrice} TL
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
                    backgroundColor: themeColors.backgroundElement, 
                    borderColor: themeColors.border,
                    opacity: pressed ? 0.75 : 1,
                  }
                ]}
              >
                <View style={styles.splitItemLeft}>
                  <Text style={[styles.splitItemBrand, { color: themeColors.textSecondary }]}>
                    {item.product.brand}
                  </Text>
                  <Text numberOfLines={1} style={[styles.splitItemName, { color: themeColors.text }]}>
                    {item.product.name}
                  </Text>
                  <Text style={[styles.splitItemQty, { color: themeColors.textSecondary }]}>
                    Adet: {item.quantity}
                  </Text>
                </View>
                <View style={styles.splitItemRight}>
                  <Text style={[styles.splitItemPrice, { color: themeColors.text }]}>
                    {item.itemTotal} TL
                  </Text>
                  <View style={[styles.cheapestStoreIndicator, { backgroundColor: themeColors.background }]}>
                    <Store color={themeColors.primary} size={11} />
                    <Text style={[styles.cheapestStoreName, { color: themeColors.text }]}>
                      {item.cheapestStoreName}
                    </Text>
                  </View>
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
    paddingTop: Platform.OS === 'ios' ? Spacing.two : Spacing.four,
    paddingBottom: Spacing.three,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.two - 2,
    borderRadius: 10,
    gap: Spacing.one + 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three + 2,
    marginBottom: Spacing.three,
    gap: 4,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#D48C9E',
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    gap: 4,
    marginBottom: 4,
  },
  summaryBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  summaryDesc: {
    fontSize: 12,
    lineHeight: 16,
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
    fontSize: 13,
    fontWeight: '600',
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three + 2,
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
    fontSize: 15,
    fontWeight: '700',
  },
  cheapestBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
  },
  cheapestBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  storePriceInfo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  storePriceText: {
    fontSize: 16,
    fontWeight: '800',
  },
  missingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  missingBadgeText: {
    color: '#F2CC8F',
    fontSize: 10,
    fontWeight: '600',
  },
  splitSummaryCard: {
    borderRadius: 18,
    padding: Spacing.three + 2,
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
    borderRadius: 10,
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
    borderRadius: 10,
  },
  savingsBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  splitSummaryTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  splitSummaryDesc: {
    fontSize: 12,
    lineHeight: 16,
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
    fontWeight: '600',
  },
  splitPrice: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  arrowCompareContainer: {
    alignItems: 'flex-end',
  },
  oldPriceText: {
    fontSize: 11,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
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
  splitItemBrand: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  splitItemName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  splitItemQty: {
    fontSize: 11,
    marginTop: 2,
  },
  splitItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  splitItemPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  cheapestStoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
    gap: 4,
  },
  cheapestStoreName: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.six,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.four,
    borderRadius: 20,
    gap: Spacing.two,
  },
  exploreButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
