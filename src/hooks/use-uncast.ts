"use client";

import { useState, useCallback, useEffect } from "react";
import { UncastState, UnrolledThread, ThreadSegment } from "~/lib/types";
import { useNeynarThread } from "./use-neynar-thread";
import { useUncastStorage } from "./use-uncast-storage";

const MAX_CHARACTERS_PER_PAGE = 10000;
const MAX_IMAGES_PER_PAGE = 10;

export function useUncast() {
  const { fetchThread, loading: threadLoading, error: threadError } = useNeynarThread();
  const storage = useUncastStorage();
  
  const [state, setState] = useState<UncastState>({
    loading: false,
    likedCasts: new Set(),
    bookmarks: [],
  });

  const [visibleSegments, setVisibleSegments] = useState<ThreadSegment[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Sync storage state with component state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      likedCasts: storage.likedCasts,
      bookmarks: storage.bookmarks,
    }));
  }, [storage.likedCasts, storage.bookmarks]);

  // Calculate pagination for thread segments
  const calculatePagination = useCallback((segments: ThreadSegment[]) => {
    const pages: ThreadSegment[][] = [];
    let currentPageSegments: ThreadSegment[] = [];
    let currentPageCharacters = 0;
    let currentPageImages = 0;

    for (const segment of segments) {
      // Check if adding this segment would exceed limits
      const wouldExceedCharacters = currentPageCharacters + segment.totalCharacters > MAX_CHARACTERS_PER_PAGE;
      const wouldExceedImages = currentPageImages + segment.imageCount > MAX_IMAGES_PER_PAGE;
      
      // If we have segments and would exceed limits, start a new page
      if (currentPageSegments.length > 0 && (wouldExceedCharacters || wouldExceedImages)) {
        pages.push([...currentPageSegments]);
        currentPageSegments = [];
        currentPageCharacters = 0;
        currentPageImages = 0;
      }

      currentPageSegments.push(segment);
      currentPageCharacters += segment.totalCharacters;
      currentPageImages += segment.imageCount;
    }

    // Add the last page if it has content
    if (currentPageSegments.length > 0) {
      pages.push(currentPageSegments);
    }

    return pages;
  }, []);

  // Load and unroll a thread
  const loadThread = useCallback(async (castUrl: string) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const thread = await fetchThread(castUrl);
      if (!thread) {
        throw new Error("Failed to load thread");
      }

      const pages = calculatePagination(thread.segments);
      
      setState(prev => ({
        ...prev,
        currentThread: thread,
        loading: false,
      }));

      setTotalPages(pages.length);
      setCurrentPage(0);
      setVisibleSegments(pages[0] || []);

      // Check for existing bookmark and navigate to saved position
      const existingBookmark = storage.getBookmarkForThread(castUrl);
      if (existingBookmark) {
        const pages = calculatePagination(thread.segments);
        
        // Find which page contains the bookmarked segment
        let targetPage = 0;
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          if (page.some(segment => 
            thread.segments.indexOf(segment) >= existingBookmark.segmentIndex
          )) {
            targetPage = i;
            break;
          }
        }

        setCurrentPage(targetPage);
        setVisibleSegments(pages[targetPage] || []);
        storage.updateBookmark(existingBookmark.id, { lastRead: new Date().toISOString() });
        
        setState(prev => ({
          ...prev,
          currentBookmark: existingBookmark,
        }));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load thread";
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [fetchThread, calculatePagination, storage]);

  // Navigate to a specific page
  const goToPage = useCallback((page: number) => {
    if (!state.currentThread || page < 0 || page >= totalPages) return;

    const pages = calculatePagination(state.currentThread.segments);
    setCurrentPage(page);
    setVisibleSegments(pages[page] || []);
  }, [state.currentThread, totalPages, calculatePagination]);

  // Navigate to next page
  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  // Navigate to previous page
  const previousPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Like/unlike a cast
  const toggleLike = useCallback((castHash: string, castData?: { author: string; text: string }) => {
    if (storage.isLiked(castHash)) {
      storage.unlikeCast(castHash);
    } else {
      storage.likeCast(castHash, castData);
    }
  }, [storage]);

  // Bookmark current position
  const bookmarkCurrentPosition = useCallback((title?: string) => {
    if (!state.currentThread || visibleSegments.length === 0) return null;

    const firstVisibleSegment = visibleSegments[0];
    const segmentIndex = state.currentThread.segments.findIndex(s => s.id === firstVisibleSegment.id);
    
    const bookmark = storage.addBookmark({
      url: state.currentThread.url,
      title: title || `Thread from @${state.currentThread.rootCast.author.username}`,
      segmentIndex,
      characterOffset: 0, // Could be enhanced to track exact character position
      timestamp: new Date().toISOString(),
      lastRead: new Date().toISOString(),
    });

    setState(prev => ({
      ...prev,
      currentBookmark: bookmark,
    }));

    return bookmark;
  }, [state.currentThread, visibleSegments, storage]);

  // Navigate to a bookmark
  const navigateToBookmark = useCallback((bookmark: typeof storage.bookmarks[0]) => {
    if (!state.currentThread) return;

    const pages = calculatePagination(state.currentThread.segments);
    
    // Find which page contains the bookmarked segment
    let targetPage = 0;
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (page.some(segment => 
        state.currentThread!.segments.indexOf(segment) >= bookmark.segmentIndex
      )) {
        targetPage = i;
        break;
      }
    }

    goToPage(targetPage);
    storage.updateBookmark(bookmark.id, { lastRead: new Date().toISOString() });
    
    setState(prev => ({
      ...prev,
      currentBookmark: bookmark,
    }));
  }, [state.currentThread, calculatePagination, goToPage, storage]);

  // Remove a bookmark
  const removeBookmark = useCallback((bookmarkId: string) => {
    storage.removeBookmark(bookmarkId);
    setState(prev => ({
      ...prev,
      currentBookmark: prev.currentBookmark?.id === bookmarkId ? undefined : prev.currentBookmark,
    }));
  }, [storage]);

  // Get thread progress
  const getProgress = useCallback(() => {
    if (!state.currentThread || totalPages === 0) {
      return { percentage: 0, current: 0, total: 0 };
    }

    return {
      percentage: Math.round(((currentPage + 1) / totalPages) * 100),
      current: currentPage + 1,
      total: totalPages,
    };
  }, [state.currentThread, currentPage, totalPages]);

  return {
    // State
    ...state,
    loading: state.loading || threadLoading,
    error: state.error || threadError,
    
    // Current view state
    visibleSegments,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages - 1,
    hasPreviousPage: currentPage > 0,

    // Thread actions
    loadThread,
    goToPage,
    nextPage,
    previousPage,

    // Cast interactions
    toggleLike,
    isLiked: storage.isLiked,

    // Bookmark actions
    bookmarkCurrentPosition,
    navigateToBookmark,
    removeBookmark,
    getBookmarkForThread: storage.getBookmarkForThread,

    // Progress tracking
    getProgress,

    // Storage utilities
    clearAllData: storage.clearAllData,
    exportData: storage.exportData,
  };
}