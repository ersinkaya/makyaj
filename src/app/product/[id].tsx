import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  SafeAreaView,
  Platform,
  useColorScheme,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Star, 
  Heart, 
  Check, 
  Store,
  ExternalLink,
  Info,
  AlertCircle
} from 'lucide-react-native';

import { Colors, Spacing } from '@/constants/theme';
import { INITIAL_PRODUCTS, Product, STORE_NAMES, getCategoryImage } from '@/constants/mockData';
import { useWishlist } from '@/context/WishlistContext';

export default function ProductDetailScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToWishlist, isInWishlist } = useWishlist();

  // Find the product in INITIAL_PRODUCTS or dynamically reconstruct it if it is a simulated one
  const product = useMemo((): Product | null => {
    if (!id) return null;
    
    const found = INITIAL_PRODUCTS.find((p) => p.id === id);
    if (found) return found;

    // Reconstruct simulated product from id if it starts with "sim-" or "custom-"
    if (id.startsWith('sim-') || id.startsWith('custom-')) {
      const seed = parseInt(id.split('-')[1]) || Date.now();
      const basePrice = 80 + (seed % 600);
      const roundPrice = (p: number | null) => {
        if (p === null) return null;
        return Math.round(p / 10) * 10 - 0.1;
      };

      // Determine category based on seed
      const categories = ['ruj', 'rimel', 'kalem', 'allik', 'far', 'oje', 'cilt'];
      const category = categories[seed % categories.length];

      return {
        id,
        name: `Makyaj Ürünü #${seed % 1000}`,
        brand: 'Makyaj Markası',
        category,
        image: getCategoryImage(category),
        rating: 4.5,
        reviewsCount: 120,
        prices: {
          gratis: roundPrice(basePrice * 0.95),
          watsons: roundPrice(basePrice * 0.98),
          rossmann: roundPrice(basePrice * 0.96),
          eve: roundPrice(basePrice * 0.93),
          sephora: basePrice > 400 ? roundPrice(basePrice * 1.5) : null,
          trendyol: roundPrice(basePrice * 0.88) as number,
          hepsiburada: roundPrice(basePrice * 0.90) as number,
        },
        description: 'Arama sonucundan simüle edilen özel ürün detayları.',
      };
    }

    return null;
  }, [id]);

  const alreadyAdded = useMemo(() => {
    return product ? isInWishlist(product.id) : false;
  }, [product, isInWishlist]);

  // Sort prices from cheapest to most expensive
  const storePricesList = useMemo(() => {
    if (!product) return [];

    return Object.entries(product.prices)
      .map(([storeKey, val]) => ({
        storeKey,
        storeName: STORE_NAMES[storeKey as keyof typeof STORE_NAMES],
        price: val,
      }))
      .filter((item) => item.price !== null)
      .sort((a, b) => (a.price as number) - (b.price as number));
  }, [product]);

  const openStoreUrl = (storeKey: string) => {
    if (!product) return;
    const query = `${product.brand} ${product.name}`;
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

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <AlertCircle color="#FF8C94" size={48} />
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

  const cheapest = storePricesList[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Navbar */}
      <View style={styles.navBar}>
        <Pressable 
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: themeColors.backgroundElement }]}
        >
          <ArrowLeft color={themeColors.text} size={20} />
        </Pressable>
        <Text style={[styles.navTitle, { color: themeColors.text }]}>Ürün Detayı</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Image */}
        <View style={[styles.imageContainer, { borderColor: themeColors.border }]}>
          <Image source={{ uri: product.image }} style={styles.coverImage} />
        </View>

        {/* Brand & Name */}
        <View style={styles.metaContainer}>
          <Text style={[styles.brandText, { color: themeColors.primary }]}>
            {product.brand}
          </Text>
          <Text style={[styles.nameText, { color: themeColors.text }]}>
            {product.name}
          </Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  color={star <= Math.round(product.rating) ? '#F2CC8F' : themeColors.border} 
                  fill={star <= Math.round(product.rating) ? '#F2CC8F' : 'transparent'} 
                  size={16} 
                />
              ))}
            </View>
            <Text style={[styles.ratingVal, { color: themeColors.text }]}>{product.rating}</Text>
            <Text style={[styles.reviewsText, { color: themeColors.textSecondary }]}>
              ({product.reviewsCount} Yorum)
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
          <View style={styles.cardHeader}>
            <Info color={themeColors.primary} size={18} />
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Ürün Hakkında</Text>
          </View>
          <Text style={[styles.descriptionText, { color: themeColors.textSecondary }]}>
            {product.description || 'Bu makyaj ve bakım ürünü hakkında detaylı açıklama yakında eklenecektir.'}
          </Text>
        </View>

        {/* Price Comparison */}
        <View style={[styles.card, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
          <View style={styles.cardHeader}>
            <Store color={themeColors.primary} size={18} />
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Mağaza Fiyat Karşılaştırması</Text>
          </View>
          
          <View style={styles.pricesList}>
            {storePricesList.map((store, index) => {
              const isCheapest = index === 0;
              return (
                <Pressable 
                  key={store.storeKey} 
                  onPress={() => openStoreUrl(store.storeKey)}
                  style={({ pressed }) => [
                    styles.priceRow, 
                    { 
                      borderBottomColor: themeColors.border,
                      borderBottomWidth: index === storePricesList.length - 1 ? 0 : 1,
                      opacity: pressed ? 0.7 : 1,
                    }
                  ]}
                >
                  <View style={styles.storeNameCol}>
                    <Text style={[styles.storeNameText, { color: themeColors.text, fontWeight: isCheapest ? '700' : '500' }]}>
                      {store.storeName}
                    </Text>
                    {isCheapest && (
                      <View style={[styles.cheapestBadge, { backgroundColor: themeColors.success }]}>
                        <Text style={styles.cheapestBadgeText}>En Ucuz</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.priceCol}>
                    <Text style={[styles.priceText, { color: themeColors.text, fontWeight: isCheapest ? '800' : '600' }]}>
                      {store.price?.toFixed(2)} TL
                    </Text>
                    <View style={styles.linkButton}>
                      <ExternalLink color={themeColors.textSecondary} size={14} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.backgroundElement, borderTopColor: themeColors.border }]}>
        <View style={styles.bottomBarPrice}>
          <Text style={[styles.bottomLabel, { color: themeColors.textSecondary }]}>En iyi fiyat</Text>
          {cheapest ? (
            <Text style={[styles.bottomPriceVal, { color: themeColors.text }]}>
              {cheapest.price?.toFixed(2)} TL <Text style={styles.bottomStore}>({cheapest.storeName})</Text>
            </Text>
          ) : (
            <Text style={[styles.bottomPriceVal, { color: themeColors.text }]}>Fiyat yok</Text>
          )}
        </View>

        <Pressable
          onPress={() => addToWishlist(product, 'Detay sayfasından')}
          disabled={alreadyAdded}
          style={[
            styles.actionButton, 
            { 
              backgroundColor: alreadyAdded ? themeColors.success : themeColors.primary,
            }
          ]}
        >
          {alreadyAdded ? (
            <>
              <Check color="#FFF" size={18} />
              <Text style={styles.actionText}>Listeme Eklendi</Text>
            </>
          ) : (
            <>
              <Heart color="#FFF" size={18} />
              <Text style={styles.actionText}>Listeme Ekle</Text>
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
    paddingTop: Platform.OS === 'ios' ? Spacing.two : Spacing.four,
    paddingBottom: Spacing.two,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six + Spacing.four,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    marginTop: Spacing.two,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  metaContainer: {
    marginVertical: Spacing.three,
    gap: 4,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewsText: {
    fontSize: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three + 2,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 167, 181, 0.15)',
    marginBottom: Spacing.two,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  pricesList: {
    gap: 0,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
  },
  storeNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  storeNameText: {
    fontSize: 14,
  },
  cheapestBadge: {
    paddingVertical: 1,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
  },
  cheapestBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  priceText: {
    fontSize: 14,
  },
  linkButton: {
    padding: 2,
  },
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
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  bottomStore: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.five,
    borderRadius: 14,
    gap: Spacing.two,
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  errorTitle: {
    fontSize: 16,
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
