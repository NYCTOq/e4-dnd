import { createContext, useContext, useMemo, useState } from "react";
import {
  addRecentItem,
  loadFavorites,
  loadRecentItems,
  saveFavorites,
  saveRecentItems,
  toggleFavoriteItem,
  type FavoriteItem,
  type RecentItem,
} from "./favoriteStorage";

type FavoriteDraft = Omit<FavoriteItem, "updatedAt">;

type FavoritesContextValue = {
  favorites: FavoriteItem[];
  recentItems: RecentItem[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteDraft) => void;
  recordRecent: (item: FavoriteDraft) => void;
  clearRecentItems: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);
  const [recentItems, setRecentItems] = useState<RecentItem[]>(loadRecentItems);

  const value = useMemo<FavoritesContextValue>(() => ({
    favorites,
    recentItems,
    isFavorite: (id) => favorites.some((item) => item.id === id),
    toggleFavorite: (item) => {
      setFavorites((current) => {
        const next = toggleFavoriteItem(current, item);
        saveFavorites(next);
        return next;
      });
    },
    recordRecent: (item) => {
      setRecentItems((current) => {
        const next = addRecentItem(current, item);
        saveRecentItems(next);
        return next;
      });
    },
    clearRecentItems: () => {
      saveRecentItems([]);
      setRecentItems([]);
    },
  }), [favorites, recentItems]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites must be used inside FavoritesProvider");
  return value;
}
