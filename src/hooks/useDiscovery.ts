import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DiscoveryService } from '@/services/DiscoveryService';

export function useDiscovery<T extends { title: string; location: string }>() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [manifest, setManifest] = useState<T[]>([]);
  const [isLoadingManifest, setIsLoadingManifest] = useState(true);
  
  const discoveryService = useRef<DiscoveryService<T> | null>(null);
  // Guard async state updates after unmount
  const isMounted = useRef(true);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the Discovery Engine
  useEffect(() => {
    isMounted.current = true;

    const initialize = async () => {
      try {
        const { data } = await supabase
          .from('packages')
          .select('*')
          .eq('is_published', true);
        
        if (data && isMounted.current) {
          const typedData = data as T[];
          setManifest(typedData);
          discoveryService.current = new DiscoveryService<T>(typedData);
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
    
    // The Sovereign Engine is instant (client-side), 
    // but we simulate a premium "Consulting" delay
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
