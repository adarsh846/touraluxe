import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DiscoveryService } from '@/services/DiscoveryService';

export function useDiscovery<T extends { title: string; location: string }>() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [manifest, setManifest] = useState<T[]>([]);
  const [isLoadingManifest, setIsLoadingManifest] = useState(true);
  
  const discoveryService = useRef<DiscoveryService<T> | null>(null);

  // Initialize the Discovery Engine
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data } = await supabase
          .from('packages')
          .select('*')
          .eq('is_published', true);
        
        if (data) {
          const typedData = data as T[];
          setManifest(typedData);
          discoveryService.current = new DiscoveryService<T>(typedData);
        }
      } catch (error) {
        console.error('Failed to initialize Discovery Service:', error);
      } finally {
        setIsLoadingManifest(false);
      }
    };

    initialize();
  }, []);

  const search = useCallback((query: string) => {
    if (!discoveryService.current) return;
    
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // The Sovereign Engine is instant (client-side), 
    // but we simulate a premium "Consulting" delay
    const results = discoveryService.current.search(cleanQuery);
    setSearchResults(results);
    
    setTimeout(() => setIsSearching(false), 250);
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
