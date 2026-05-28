import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/constants/mockData';

export interface WishlistItem {
  product: Product;
  quantity: number;
  note: string;
  group: string; // Watchlist grubu (örn: 'Favorilerim', 'Fiyat Takip', 'Alacaklarım')
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (product: Product, note?: string, group?: string) => void;
  removeFromWishlist: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNote: (productId: string, note: string) => void;
  updateGroup: (productId: string, group: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = '@makyaj_wishlist_v2'; // Bumped key to avoid JSON schema mismatch

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist from AsyncStorage on mount
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          // Backward compatibility check for v1
          const oldStored = await AsyncStorage.getItem('@makyaj_wishlist_v1');
          if (oldStored) {
            const oldItems = JSON.parse(oldStored);
            const upgraded = oldItems.map((item: any) => ({
              ...item,
              group: 'Favorilerim'
            }));
            setItems(upgraded);
          }
        }
      } catch (e) {
        console.error('Failed to load wishlist', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadWishlist();
  }, []);

  // Save wishlist to AsyncStorage when items change
  useEffect(() => {
    if (!isLoaded) return;
    const saveWishlist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save wishlist', e);
      }
    };
    saveWishlist();
  }, [items, isLoaded]);

  const addToWishlist = (product: Product, note = '', group = 'Favorilerim') => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id && item.group === group);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1, note, group }];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromWishlist(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateNote = (productId: string, note: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, note } : item
      )
    );
  };

  const updateGroup = (productId: string, group: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, group } : item
      )
    );
  };

  const clearWishlist = () => {
    setItems([]);
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.product.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        updateQuantity,
        updateNote,
        updateGroup,
        clearWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
