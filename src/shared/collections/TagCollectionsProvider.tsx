import { createContext, useContext, useMemo, useState } from "react";
import {
  addTagToItem,
  deleteTag,
  getAllTags,
  loadItemTags,
  removeTagFromItem,
  renameTag,
  saveItemTags,
  type ItemTagMap,
} from "./tagCollectionStorage";

type TagCollectionsContextValue = {
  itemTags: ItemTagMap;
  allTags: string[];
  getTagsForItem: (itemId: string) => string[];
  addTag: (itemId: string, tag: string) => void;
  removeTag: (itemId: string, tag: string) => void;
  renameCollection: (oldTag: string, newTag: string) => void;
  deleteCollection: (tag: string) => void;
};

const TagCollectionsContext = createContext<TagCollectionsContextValue | null>(null);

export function TagCollectionsProvider({ children }: { children: React.ReactNode }) {
  const [itemTags, setItemTags] = useState<ItemTagMap>(loadItemTags);

  const value = useMemo<TagCollectionsContextValue>(() => ({
    itemTags,
    allTags: getAllTags(itemTags),
    getTagsForItem: (itemId) => itemTags[itemId] ?? [],
    addTag: (itemId, tag) => {
      setItemTags((current) => {
        const next = addTagToItem(current, itemId, tag);
        saveItemTags(next);
        return next;
      });
    },
    removeTag: (itemId, tag) => {
      setItemTags((current) => {
        const next = removeTagFromItem(current, itemId, tag);
        saveItemTags(next);
        return next;
      });
    },
    renameCollection: (oldTag, newTag) => {
      setItemTags((current) => {
        const next = renameTag(current, oldTag, newTag);
        saveItemTags(next);
        return next;
      });
    },
    deleteCollection: (tag) => {
      setItemTags((current) => {
        const next = deleteTag(current, tag);
        saveItemTags(next);
        return next;
      });
    },
  }), [itemTags]);

  return <TagCollectionsContext.Provider value={value}>{children}</TagCollectionsContext.Provider>;
}

export function useTagCollections() {
  const value = useContext(TagCollectionsContext);
  if (!value) throw new Error("useTagCollections must be used inside TagCollectionsProvider");
  return value;
}
