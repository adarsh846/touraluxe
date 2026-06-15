import { useState, useEffect, useRef, useCallback } from 'react';
import { getPackageManifest, getCachedPackagesSync } from '@/lib/manifestCache';
import { DiscoveryService } from '@/services/DiscoveryService';

export function useDiscovery<T extends { title: string; location: string }>() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<T[]>([]);
  
  const [manifest, setManifest] = useState<T[]>(() => {
    const cached = getCachedPackagesSync();
    return (cached ?? []) as unknown as T[];
  });
  
  const [isLoadingManifest, setIsLoadingManifest] = useState(() => {
    return !getCachedPackagesSync();
  });
  
  const discoveryService = useRef<DiscoveryService<T> | null>(null);
  
  // Initialize discovery service on first render if cached manifest is already available
  if (!discoveryService.current) {
    const cached = getCachedPackagesSync();
    if (cached) {
      discoveryService.current = new DiscoveryService<T>(cached as unknown as T[]);
    }
  }
  
  // Guard async state updates after unmount
  const isMounted = useRef(true);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the Discovery Engine from the shared manifest cache.
  // Because PwaRegister pre-warms the cache on page idle, this call
  // typically resolves instantly from memory — zero network cost.
  useEffect(() => {
    isMounted.current = true;

    const initialize = async () => {
      try {
        const data = await getPackageManifest() as unknown as T[];
        
        if (isMounted.current) {
          // Optimize: only update state and instantiate service if not already initialized
          setManifest(prev => {
            if (prev.length === 0 && data.length > 0) {
              return data;
            }
            return prev;
          });
          if (!discoveryService.current && data.length > 0) {
            discoveryService.current = new DiscoveryService<T>(data);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Discovery Service:', error);
      } finally {
        if (isMounted.current) setIsLoadingManifest(false);
      }
    };

    initialize();

    return () => {
      isMounted.current = false;
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const search = useCallback(async (query: string) => {
    if (!discoveryService.current) return;
    
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    const results = await discoveryService.current.search(cleanQuery);
    if (isMounted.current) setSearchResults(results);
    
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (isMounted.current) setIsSearching(false);
    }, 250);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    search,
    clearSearch,
    searchResults,
    isSearching,
    manifest,
    isLoadingManifest,
    trending: manifest.slice(0, 4)
  };
}
