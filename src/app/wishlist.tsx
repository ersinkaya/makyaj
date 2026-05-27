import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TextInput,
  SafeAreaView,
  Platform,
  useColorScheme,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { 
  Trash2, 
  Plus, 
  Minus, 
  MessageSquare, 
  ShoppingBag, 
  ArrowRight,
  Sparkles
} from 'lucide-react-native';

import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { useWishlist, WishlistItem } from '@/context/WishlistContext';

export default function WishlistScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const router = useRouter();
  const { items, updateQuantity, updateNote, removeFromWishlist } = useWishlist();

  // Keep track of which item's note is being edited
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  const handleStartEditNote = (item: WishlistItem) => {
    setEditingNoteId(item.product.id);
    setTempNote(item.note);
  };

  const handleSaveNote = (productId: string) => {
    updateNote(productId, tempNote);
    setEditingNoteId(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.titleText, { color: themeColors.text }]}>İhtiyaç Listem</Text>
          <Text style={[styles.countText, { color: themeColors.textSecondary }]}>
            {items.length} Farklı Ürün
          </Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: themeColors.backgroundElement }]}>
              <ShoppingBag color={themeColors.primary} size={48} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Listeniz Boş Görünüyor</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Dudak kalemi, rimel, ruj, oje... İhtiyacınız olan ürünleri ekleyin, sizin için Gratis, Watsons ve Rossmann fiyatlarını karşılaştıralım!
            </Text>
            <Pressable 
              onPress={() => router.push('/')}
              style={[styles.exploreButton, { backgroundColor: themeColors.primary }]}
            >
              <Sparkles color="#FFF" size={18} />
              <Text style={styles.exploreButtonText}>Ürün Keşfetmeye Başla</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.product.id}
              contentContainerStyle={[styles.listContainer, { paddingBottom: BottomTabInset + Spacing.six }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[styles.cartItem, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
                  {/* Product Details Section */}
                  <View style={styles.itemRow}>
                    <Image source={{ uri: item.product.image }} style={styles.productImage} />
                    
                    <View style={styles.productDetails}>
                      <Text style={[styles.brandText, { color: themeColors.textSecondary }]}>
                        {item.product.brand}
                      </Text>
                      <Text numberOfLines={2} style={[styles.nameText, { color: themeColors.text }]}>
                        {item.product.name}
                      </Text>

                      {/* Quantity Selector */}
                      <View style={styles.quantityContainer}>
                        <Pressable
                          onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={[styles.quantityBtn, { borderColor: themeColors.border }]}
                        >
                          <Minus color={themeColors.text} size={14} />
                        </Pressable>
                        <Text style={[styles.quantityText, { color: themeColors.text }]}>
                          {item.quantity}
                        </Text>
                        <Pressable
                          onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={[styles.quantityBtn, { borderColor: themeColors.border }]}
                        >
                          <Plus color={themeColors.text} size={14} />
                        </Pressable>
                      </View>
                    </View>

                    {/* Delete button */}
                    <Pressable
                      onPress={() => removeFromWishlist(item.product.id)}
                      style={[styles.deleteButton, { backgroundColor: themeColors.background }]}
                    >
                      <Trash2 color="#FF8C94" size={18} />
                    </Pressable>
                  </View>

                  {/* Note Section */}
                  <View style={[styles.noteContainer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
                    {editingNoteId === item.product.id ? (
                      <View style={styles.editNoteRow}>
                        <TextInput
                          value={tempNote}
                          onChangeText={setTempNote}
                          placeholder="Renk no, adet veya özel not girin..."
                          placeholderTextColor={themeColors.textSecondary}
                          style={[styles.noteInput, { color: themeColors.text, borderColor: themeColors.primary }]}
                          autoFocus
                          maxLength={60}
                        />
                        <Pressable 
                          onPress={() => handleSaveNote(item.product.id)}
                          style={[styles.saveNoteBtn, { backgroundColor: themeColors.primary }]}
                        >
                          <Text style={styles.saveNoteText}>Kaydet</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleStartEditNote(item)}
                        style={styles.viewNoteRow}
                      >
                        <MessageSquare color={themeColors.textSecondary} size={14} />
                        <Text 
                          style={[
                            styles.noteText, 
                            { color: item.note ? themeColors.text : themeColors.textSecondary, fontStyle: item.note ? 'normal' : 'italic' }
                          ]}
                          numberOfLines={1}
                        >
                          {item.note || 'Ürüne özel not ekleyin (örn: 03 numara şeftali)...'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}
            />

            {/* Bottom Compare Bar */}
            <View style={[styles.bottomBar, { backgroundColor: themeColors.backgroundElement, borderTopColor: themeColors.border }]}>
              <View style={styles.totalRow}>
                <View>
                  <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Toplam İhtiyaç</Text>
                  <Text style={[styles.totalValue, { color: themeColors.text }]}>
                    {items.reduce((sum, item) => sum + item.quantity, 0)} Ürün
                  </Text>
                </View>
                
                <Pressable 
                  onPress={() => router.push('/compare')}
                  style={[styles.compareActionBtn, { backgroundColor: themeColors.primary }]}
                >
                  <Text style={styles.compareActionText}>Fiyatları Karşılaştır</Text>
                  <ArrowRight color="#FFF" size={18} />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  listContainer: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  cartItem: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    padding: Spacing.three,
    alignItems: 'center',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#FFF',
  },
  productDetails: {
    flex: 1,
    marginLeft: Spacing.three,
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nameText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  quantityBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.two,
  },
  noteContainer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
  },
  viewNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  noteText: {
    fontSize: 12,
    flex: 1,
  },
  editNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  noteInput: {
    flex: 1,
    fontSize: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  saveNoteBtn: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
  },
  saveNoteText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Platform.OS === 'ios' ? Spacing.four : Spacing.three,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  compareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.four,
    borderRadius: 14,
    gap: Spacing.two,
  },
  compareActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
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
