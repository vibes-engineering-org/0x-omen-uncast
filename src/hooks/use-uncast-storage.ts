"use client";

import { useState, useEffect, useCallback } from "react";
import { ThreadBookmark, LikedCast } from "~/lib/types";

const BOOKMARKS_KEY = "uncast_bookmarks";
const LIKED_CASTS_KEY = "uncast_liked_casts";

function isClient() {
  return typeof window !== "undefined";
}

export function useUncastStorage() {
  const [bookmarks, setBookmarks] = useState<ThreadBookmark[]>([]);
  const [likedCasts, setLikedCasts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    if (!isClient()) return;

    try {
      const savedBookmarks = localStorage.getItem(BOOKMARKS_KEY);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }

      const savedLikedCasts = localStorage.getItem(LIKED_CASTS_KEY);
      if (savedLikedCasts) {
        const likedCastsArray = JSON.parse(savedLikedCasts);
        setLikedCasts(new Set(likedCastsArray));
      }
    } catch (error) {
      console.error("Failed to load Uncast data from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save bookmarks to localStorage
  const saveBookmarks = useCallback((newBookmarks: ThreadBookmark[]) => {
    if (!isClient()) return;

    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error("Failed to save bookmarks to localStorage:", error);
    }
  }, []);

  // Save liked casts to localStorage
  const saveLikedCasts = useCallback((newLikedCasts: Set<string>) => {
    if (!isClient()) return;

    try {
      localStorage.setItem(LIKED_CASTS_KEY, JSON.stringify(Array.from(newLikedCasts)));
      setLikedCasts(newLikedCasts);
    } catch (error) {
      console.error("Failed to save liked casts to localStorage:", error);
    }
  }, []);

  // Bookmark management functions
  const addBookmark = useCallback((bookmark: Omit<ThreadBookmark, "id">) => {
    const newBookmark: ThreadBookmark = {
      ...bookmark,
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    saveBookmarks(updatedBookmarks);
    return newBookmark;
  }, [bookmarks, saveBookmarks]);

  const removeBookmark = useCallback((bookmarkId: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    saveBookmarks(updatedBookmarks);
  }, [bookmarks, saveBookmarks]);

  const updateBookmark = useCallback((bookmarkId: string, updates: Partial<ThreadBookmark>) => {
    const updatedBookmarks = bookmarks.map(b => 
      b.id === bookmarkId ? { ...b, ...updates, lastRead: new Date().toISOString() } : b
    );
    saveBookmarks(updatedBookmarks);
  }, [bookmarks, saveBookmarks]);

  const getBookmarkForThread = useCallback((threadUrl: string) => {
    return bookmarks.find(b => b.url === threadUrl);
  }, [bookmarks]);

  // Liked casts management functions
  const likeCast = useCallback((castHash: string, castData?: { author: string; text: string }) => {
    const newLikedCasts = new Set(likedCasts);
    newLikedCasts.add(castHash);
    saveLikedCasts(newLikedCasts);

    // Optionally store cast details for display
    if (castData && isClient()) {
      try {
        const likedCastDetails = localStorage.getItem(`cast_${castHash}`);
        if (!likedCastDetails) {
          const likedCast: LikedCast = {
            hash: castHash,
            timestamp: new Date().toISOString(),
            author: castData.author,
            text: castData.text,
          };
          localStorage.setItem(`cast_${castHash}`, JSON.stringify(likedCast));
        }
      } catch (error) {
        console.error("Failed to save cast details:", error);
      }
    }
  }, [likedCasts, saveLikedCasts]);

  const unlikeCast = useCallback((castHash: string) => {
    const newLikedCasts = new Set(likedCasts);
    newLikedCasts.delete(castHash);
    saveLikedCasts(newLikedCasts);

    // Clean up cast details
    if (isClient()) {
      try {
        localStorage.removeItem(`cast_${castHash}`);
      } catch (error) {
        console.error("Failed to remove cast details:", error);
      }
    }
  }, [likedCasts, saveLikedCasts]);

  const isLiked = useCallback((castHash: string) => {
    return likedCasts.has(castHash);
  }, [likedCasts]);

  const getLikedCastDetails = useCallback((castHash: string): LikedCast | null => {
    if (!isClient()) return null;

    try {
      const details = localStorage.getItem(`cast_${castHash}`);
      return details ? JSON.parse(details) : null;
    } catch (error) {
      console.error("Failed to get cast details:", error);
      return null;
    }
  }, []);

  // Utility functions
  const clearAllData = useCallback(() => {
    if (!isClient()) return;

    try {
      // Clear bookmarks and liked casts
      localStorage.removeItem(BOOKMARKS_KEY);
      localStorage.removeItem(LIKED_CASTS_KEY);
      
      // Clear individual cast details
      likedCasts.forEach(hash => {
        localStorage.removeItem(`cast_${hash}`);
      });

      setBookmarks([]);
      setLikedCasts(new Set());
    } catch (error) {
      console.error("Failed to clear Uncast data:", error);
    }
  }, [likedCasts]);

  const exportData = useCallback(() => {
    if (!isClient()) return null;

    try {
      const data = {
        bookmarks,
        likedCasts: Array.from(likedCasts),
        likedCastDetails: Array.from(likedCasts).map(hash => ({
          hash,
          details: getLikedCastDetails(hash),
        })).filter(item => item.details),
        exportedAt: new Date().toISOString(),
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error("Failed to export data:", error);
      return null;
    }
  }, [bookmarks, likedCasts, getLikedCastDetails]);

  return {
    // State
    bookmarks,
    likedCasts,
    isLoading,

    // Bookmark functions
    addBookmark,
    removeBookmark,
    updateBookmark,
    getBookmarkForThread,

    // Liked casts functions
    likeCast,
    unlikeCast,
    isLiked,
    getLikedCastDetails,

    // Utility functions
    clearAllData,
    exportData,
  };
}