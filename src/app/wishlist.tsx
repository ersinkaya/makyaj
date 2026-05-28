import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  SafeAreaView,
  Platform,
  useColorScheme,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  X, 
  Check, 
  Eye, 
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  PlusCircle,
  TrendingDown,
  Edit2
} from 'lucide-react-native';

import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { useWishlist, WishlistItem } from '@/context/WishlistContext';
import { searchAndSimulateProducts, Product } from '@/constants/mockData';

export default function WishlistScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  
  const router = useRouter();
  const { 
    items, 
    removeFromWishlist, 
    updateQuantity, 
    updateNote, 
    updateGroup, 
    addToWishlist 
  } = useWishlist();

  // Watchlist group state
  const [activeGroup, setActiveGroup] = useState('Favorilerim');
  const [groups, setGroups] = useState(['Favorilerim', 'Fiyat Takip', 'Alacaklarım']);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Search/Add state
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  // Editing Note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  // Handle asset search
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (text.trim().length >= 2) {
      const results = searchAndSimulateProducts(text, 'all')
        // Filter out items already in the active watchlist group
        .filter(p => !items.some(item => item.product.id === p.id && item.group === activeGroup))
        .slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Add item to active group
  const handleAddAsset = (product: Product) => {
    addToWishlist(product, '', activeGroup);
    setSearchText('');
    setSearchResults([]);
  };

  // Add new watchlist group
  const handleAddGroup = () => {
    if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
      setGroups(prev => [...prev, newGroupName.trim()]);
      setActiveGroup(newGroupName.trim());
      setNewGroupName('');
      setShowGroupModal(false);
    }
  };

  // Delete watchlist group
  const handleDeleteGroup = (groupToDelete: string) => {
    if (groupToDelete === 'Favorilerim') return; // Protect default group
    
    // Remove group name from list
    setGroups(prev => prev.filter(g => g !== groupToDelete));
    
    // Remove all items in this group
    items.forEach(item => {
      if (item.group === groupToDelete) {
        removeFromWishlist(item.product.id);
      }
    });

    setActiveGroup('Favorilerim');
  };

  // Filtered items in active watchlist group
  const activeGroupItems = useMemo(() => {
    return items.filter(item => item.group === activeGroup);
  }, [items, activeGroup]);

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

  const handleStartEditNote = (item: WishlistItem) => {
    setEditingNoteId(item.product.id);
    setTempNote(item.note);
  };

  const handleSaveNote = (productId: string) => {
    updateNote(productId, tempNote);
    setEditingNoteId(null);
  };

  // Render stock-row watchlist item
  const renderWatchlistItem = ({ item }: { item: WishlistItem }) => {
    const cheapest = getCheapestPriceInfo(item.product.prices);
    const isDrop = item.product.change < 0;

    return (
      <View style={[styles.stockCard, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
        <Pressable 
          onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.product.id } })}
          style={styles.stockItem}
        >
          {/* Left Column: Ticker & Brand */}
          <View style={styles.stockLeft}>
            <View style={styles.stockSymbolRow}>
              <Text style={[styles.stockSymbol, { color: themeColors.text }]}>{item.product.symbol}</Text>
              <View style={[styles.brandBadge, { backgroundColor: themeColors.primary + '20', borderColor: themeColors.primary }]}>
                <Text style={[styles.brandBadgeText, { color: themeColors.accent }]}>{item.product.brand.split(' ')[0]}</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={[styles.stockName, { color: themeColors.textSecondary }]}>
              {item.product.name}
            </Text>
          </View>

          {/* Center Column: Price & Change */}
          <View style={styles.stockCenter}>
            {cheapest ? (
              <Text style={[styles.stockPrice, { color: themeColors.text }]}>
                ₺{(cheapest.price * item.quantity).toFixed(2)}
              </Text>
            ) : (
              <Text style={[styles.stockPrice, { color: themeColors.textSecondary }]}>Fiyat Yok</Text>
            )}
            <View style={[styles.changeBadge, { backgroundColor: isDrop ? themeColors.success + '15' : themeColors.danger + '15' }]}>
              <Text style={[styles.changeText, { color: isDrop ? themeColors.success : themeColors.danger }]}>
                {isDrop ? '' : '+'}{item.product.change.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Quantity Actions */}
          <View style={styles.quantityContainer}>
            <Pressable
              onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              style={[styles.quantityBtn, { borderColor: themeColors.border }]}
            >
              <Text style={[styles.quantityBtnText, { color: themeColors.text }]}>-</Text>
            </Pressable>
            <Text style={[styles.quantityText, { color: themeColors.text }]}>
              {item.quantity}
            </Text>
            <Pressable
              onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              style={[styles.quantityBtn, { borderColor: themeColors.border }]}
            >
              <Text style={[styles.quantityBtnText, { color: themeColors.text }]}>+</Text>
            </Pressable>
          </View>

          {/* Remove Action */}
          <Pressable
            onPress={() => removeFromWishlist(item.product.id)}
            style={styles.deleteBtn}
          >
            <Trash2 size={16} color={themeColors.danger} />
          </Pressable>
        </Pressable>

        {/* Note / Edit Note sub-bar */}
        <View style={[styles.noteRow, { borderTopColor: themeColors.border, backgroundColor: themeColors.background }]}>
          {editingNoteId === item.product.id ? (
            <View style={styles.editNoteRow}>
              <TextInput
                value={tempNote}
                onChangeText={setTempNote}
                placeholder="Renk no veya adet notu..."
                placeholderTextColor={themeColors.textSecondary}
                style={[styles.noteInput, { color: themeColors.text, borderColor: themeColors.primary }]}
                autoFocus
                maxLength={40}
              />
              <Pressable 
                onPress={() => handleSaveNote(item.product.id)}
                style={[styles.saveNoteBtn, { backgroundColor: themeColors.accent }]}
              >
                <Text style={styles.saveNoteText}>Kaydet</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => handleStartEditNote(item)}
              style={styles.viewNoteRow}
            >
              <Edit2 size={11} color={themeColors.textSecondary} />
              <Text 
                style={[
                  styles.noteText, 
                  { color: item.note ? themeColors.text : themeColors.textSecondary, fontStyle: item.note ? 'normal' : 'italic' }
                ]}
                numberOfLines={1}
              >
                {item.note || 'Ürün notu ekleyin (örn: 02 numra pembe)...'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.titleText, { color: themeColors.text }]}>İzleme Listesi</Text>
          <Text style={[styles.countText, { color: themeColors.textSecondary }]}>
            {activeGroupItems.length} Hisse / Varlık
          </Text>
        </View>

        {/* Watchlist Groups Scroll */}
        <View style={[styles.groupSection, { borderBottomColor: themeColors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupScroll}>
            {groups.map(group => {
              const count = items.filter(i => i.group === group).length;
              const isActive = group === activeGroup;
              return (
                <Pressable
                  key={group}
                  onPress={() => setActiveGroup(group)}
                  onLongPress={() => handleDeleteGroup(group)}
                  style={[
                    styles.groupChip,
                    isActive && { backgroundColor: themeColors.accent, borderColor: themeColors.accent },
                    { borderColor: themeColors.border }
                  ]}
                >
                  <Text style={[styles.groupChipText, isActive && { color: '#FFF' }, { color: themeColors.text }]}>
                    {group}
                  </Text>
                  <View style={[styles.groupBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : themeColors.primary }]}>
                    <Text style={[styles.groupBadgeText, isActive && { color: '#FFF' }, { color: '#4A3538' }]}>{count}</Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setShowGroupModal(true)}
              style={[styles.addGroupChip, { borderColor: themeColors.accent }]}
            >
              <Plus size={16} color={themeColors.accent} />
            </Pressable>
          </ScrollView>
        </View>

        {/* Add Asset Section */}
        <View style={styles.addSection}>
          <View style={[styles.searchContainer, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
            <PlusCircle size={18} color={themeColors.accent} style={{ marginRight: 8 }} />
            <TextInput
              placeholder={`"${activeGroup}" listesine ürün/hisse ekle...`}
              placeholderTextColor={themeColors.textSecondary}
              value={searchText}
              onChangeText={handleSearchTextChange}
              style={[styles.searchInput, { color: themeColors.text }]}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => { setSearchText(''); setSearchResults([]); }}>
                <X color={themeColors.textSecondary} size={16} />
              </Pressable>
            )}
          </View>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <View style={[styles.searchResults, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
              {searchResults.map(p => (
                <Pressable
                  key={p.id}
                  onPress={() => handleAddAsset(p)}
                  style={[styles.searchResultItem, { borderBottomColor: themeColors.border }]}
                >
                  <View style={styles.searchResultLeft}>
                    <Text style={[styles.searchResultSymbol, { color: themeColors.accent }]}>{p.symbol}</Text>
                    <Text numberOfLines={1} style={[styles.searchResultName, { color: themeColors.text }]}>{p.brand} {p.name}</Text>
                  </View>
                  <Plus size={16} color={themeColors.accent} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Info row */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
            {activeGroupItems.length} Kalem · {activeGroup} Portföyü
          </Text>
          <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>Anlık Canlı Veri</Text>
        </View>

        {/* Watchlist Body */}
        {activeGroupItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Eye size={48} color={themeColors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Bu Liste Boş</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Yukarıdaki arama çubuğundan bu listeye takip etmek istediğiniz makyaj hisselerini ekleyin.
            </Text>
          </View>
        ) : (
          <FlatList
            data={activeGroupItems}
            keyExtractor={(item) => item.product.id}
            renderItem={renderWatchlistItem}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
            contentContainerStyle={[styles.listContainer, { paddingBottom: BottomTabInset + Spacing.six + 40 }]}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Bottom Total Portfolio Bar & Compare Action */}
        {activeGroupItems.length > 0 && (
          <View style={[styles.bottomBar, { backgroundColor: themeColors.backgroundElement, borderTopColor: themeColors.border }]}>
            <View style={styles.totalRow}>
              <View>
                <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Portföy Toplam Adet</Text>
                <Text style={[styles.totalValue, { color: themeColors.text }]}>
                  {activeGroupItems.reduce((sum, item) => sum + item.quantity, 0)} Ürün
                </Text>
              </View>
              
              <Pressable 
                onPress={() => router.push('/compare')}
                style={[styles.compareActionBtn, { backgroundColor: themeColors.accent }]}
              >
                <Text style={styles.compareActionText}>Fiyatları Karşılaştır</Text>
                <ShoppingCart color="#FFF" size={16} style={{ marginLeft: 4 }} />
              </Pressable>
            </View>
          </View>
        )}

        {/* NEW WATCHLIST GROUP CREATION MODAL */}
        <Modal visible={showGroupModal} transparent animationType="fade" onRequestClose={() => setShowGroupModal(false)}>
          <View style={styles.modalOverlayGroup}>
            <View style={[styles.modalContainerGroup, { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.border }]}>
              <Text style={[styles.modalTitleGroup, { color: themeColors.text }]}>Yeni Liste Oluştur</Text>
              <TextInput
                style={[styles.modalInputGroup, { color: themeColors.text, backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                placeholder="Liste adı (örn: Fondötenler)"
                placeholderTextColor={themeColors.textSecondary}
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoFocus
              />
              <View style={styles.modalButtonsGroup}>
                <Pressable
                  style={[styles.modalCancelButtonGroup, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                  onPress={() => { setShowGroupModal(false); setNewGroupName(''); }}
                >
                  <Text style={[styles.modalCancelTextGroup, { color: themeColors.textSecondary }]}>İptal</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirmButtonGroup, { backgroundColor: themeColors.accent }]}
                  onPress={handleAddGroup}
                >
                  <Text style={styles.modalConfirmTextGroup}>Oluştur</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Watchlist groups
  groupSection: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    marginBottom: Spacing.three,
  },
  groupScroll: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
    alignItems: 'center',
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
    gap: 6,
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  groupBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  addGroupChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  // Add Asset Section
  addSection: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    position: 'relative',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  searchResults: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
  },
  searchResultLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchResultSymbol: {
    fontSize: 12,
    fontWeight: '800',
    width: 70,
  },
  searchResultName: {
    fontSize: 12,
    flex: 1,
  },
  // Info row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Stock Cards
  listContainer: {
    paddingHorizontal: Spacing.three,
  },
  stockCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
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
    width: 75,
    marginRight: Spacing.two,
  },
  stockPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  changeBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 3,
  },
  changeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
  quantityBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '800',
    minWidth: 14,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 6,
  },
  // Notes Subrow
  noteRow: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
  },
  viewNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteText: {
    fontSize: 11,
    flex: 1,
  },
  editNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  noteInput: {
    flex: 1,
    fontSize: 11,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  saveNoteBtn: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
  },
  saveNoteText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  // Bottom Bar
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
    fontSize: 10,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  compareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    gap: 4,
  },
  compareActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Watchlist Modal Stilleri
  modalOverlayGroup: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerGroup: {
    borderRadius: 16,
    padding: Spacing.four,
    width: '80%',
    maxWidth: 320,
    borderWidth: 1,
  },
  modalTitleGroup: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.three,
  },
  modalInputGroup: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
    marginBottom: Spacing.three,
  },
  modalButtonsGroup: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalCancelButtonGroup: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancelTextGroup: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalConfirmButtonGroup: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  modalConfirmTextGroup: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
