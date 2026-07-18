"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getFavoriteIds, toggleFavorite as toggleFavoriteApi } from '@/lib/api/favorite.api';

interface FavoriteContextType {
  favoriteIds: Set<string>;
  toggleFavorite: (productId: string) => Promise<void>;
  isLoading: boolean;
}

const FavoriteContext = createContext<FavoriteContextType>({
  favoriteIds: new Set(),
  toggleFavorite: async () => {},
  isLoading: true,
});

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const ids = await getFavoriteIds();
        setFavoriteIds(new Set(ids));
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if token exists (user is authenticated)
    if (localStorage.getItem('accessToken')) {
      fetchFavorites();
    } else {
      setIsLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (productId: string) => {
    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const { isFavorite } = await toggleFavoriteApi({ productId });
      // Sync back with server truth
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFavorite) next.add(productId);
        else next.delete(productId);
        return next;
      });
    } catch (error) {
      // Revert on error
      console.error('Error toggling favorite:', error);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
    }
  }, []);

  return (
    <FavoriteContext.Provider value={{ favoriteIds, toggleFavorite, isLoading }}>
      {children}
    </FavoriteContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoriteContext);
