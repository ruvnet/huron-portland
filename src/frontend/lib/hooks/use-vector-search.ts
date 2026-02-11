'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vectorIndex, type SearchResult } from '@/lib/wasm/vector-index';
import { apiClient } from '@/lib/api/client';
import type { VectorSearchResult } from '@/lib/types';

const VECTOR_SYNC_KEY = 'vector-sync';

interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  preferOffline?: boolean;
}

export function useVectorSearch() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const initVectorIndex = async () => {
      try {
        await vectorIndex.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize vector index:', error);
      }
    };

    void initVectorIndex();

    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    return undefined;
  }, []);

  const searchOnline = useCallback(
    async (
      query: string,
      options: VectorSearchOptions = {}
    ): Promise<VectorSearchResult[]> => {
      return apiClient.searchProposals(query, options);
    },
    []
  );

  const searchOffline = useCallback(
    async (
      queryVector: number[],
      options: VectorSearchOptions = {}
    ): Promise<SearchResult[]> => {
      if (!isInitialized) {
        throw new Error('Vector index not initialized');
      }
      return vectorIndex.search(queryVector, options);
    },
    [isInitialized]
  );

  const search = useCallback(
    async (
      query: string,
      queryVector?: number[],
      options: VectorSearchOptions = {}
    ): Promise<VectorSearchResult[] | SearchResult[]> => {
      const { preferOffline = false } = options;

      // Use offline search if preferred and we have a vector, or if we're offline
      if ((preferOffline || !isOnline) && queryVector && isInitialized) {
        return searchOffline(queryVector, options);
      }

      // Use online search
      if (isOnline) {
        return searchOnline(query, options);
      }

      throw new Error('Cannot search: offline and no vector provided');
    },
    [isOnline, isInitialized, searchOnline, searchOffline]
  );

  return {
    search,
    searchOnline,
    searchOffline,
    isInitialized,
    isOnline,
    stats: vectorIndex.getStats(),
  };
}

export function useVectorSync() {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const result = await apiClient.syncVectors();
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [VECTOR_SYNC_KEY] });
    },
  });

  const lastSyncQuery = useQuery({
    queryKey: [VECTOR_SYNC_KEY, 'lastSync'],
    queryFn: async () => {
      if (typeof localStorage === 'undefined') return null;
      const lastSync = localStorage.getItem('vector-last-sync');
      return lastSync ? JSON.parse(lastSync) : null;
    },
    staleTime: Infinity,
  });

  const syncVectors = useCallback(async () => {
    const result = await syncMutation.mutateAsync();

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'vector-last-sync',
        JSON.stringify({
          timestamp: result.timestamp,
          count: result.synced,
        })
      );
    }

    return result;
  }, [syncMutation]);

  return {
    syncVectors,
    isSyncing: syncMutation.isPending,
    lastSync: lastSyncQuery.data,
    error: syncMutation.error,
  };
}
