import Fuse from 'fuse.js';
import { SYNONYM_MAP } from '@/lib/synonyms';
import { supabase } from '@/lib/supabase';

export interface SearchResult<T> {
  item: T;
  score: number;
  relevanceTier: 'exact' | 'prefix' | 'substring' | 'fuzzy' | 'none';
}

export class DiscoveryService<T extends { title: string; location: string }> {
  private fuse: Fuse<T> | null = null;
  private manifest: T[] = [];

  constructor(data: T[]) {
    this.manifest = data;
    this.initializeEngine(data);
  }

  private initializeEngine(data: T[]) {
    this.fuse = new Fuse(data, {
      keys: [
        { name: 'title', weight: 0.9 },
        { name: 'destination', weight: 0.8 },
        { name: 'category', weight: 0.7 },
        { name: 'tags', weight: 0.7 },
        { name: 'location', weight: 0.5 },
        { name: 'trip_type', weight: 0.4 }
      ],
      threshold: 0.35,
      distance: 100,
      includeScore: true,
      useExtendedSearch: true,
      ignoreLocation: false
    });
  }

  private synonymsLoaded = false;
  private dynamicSynonyms: Record<string, string[]> = {};

  /**
   * The "Neural-Pattern" Search Algorithm
   * Performs deep semantic analysis and token-set intersection.
   */
  public async search(query: string): Promise<T[]> {
    if (!query.trim() || !this.fuse) return [];

    const rawQuery = query.toLowerCase().trim();
    // Advanced Tokenization: Filter out common conversational noise and verbal stems
    const noiseWords = new Set(['i', 'want', 'to', 'go', 'find', 'show', 'me', 'a', 'the', 'for', 'my', 'trip', 'travel', 'holiday', 'vacation', 'wan', 'look', 'looking', 'need', 'needs', 'place', 'places', 'to', 'go', 'at', 'with']);
    const tokens = rawQuery.split(/\s+/)
      .filter(t => t.length > 1 && !noiseWords.has(t));
    
    // Lazy load synonyms from Supabase
    if (!this.synonymsLoaded) {
      try {
        const { data, error } = await supabase.from('search_synonyms').select('*');
        if (!error && data) {
          const map: Record<string, string[]> = {};
          data.forEach((row: any) => {
            map[row.word] = row.synonyms;
          });
          this.dynamicSynonyms = map;
        }
      } catch (err) {
        console.error("Failed to fetch synonyms from Supabase, falling back to local file.", err);
      }
      this.synonymsLoaded = true;
    }

    const activeSynonyms = { ...SYNONYM_MAP, ...this.dynamicSynonyms };
    
    // Synonym Expansion
    const expandedTokens = [...tokens];
    tokens.forEach(token => {
      if (activeSynonyms[token]) {
        expandedTokens.push(...activeSynonyms[token]);
      }
    });
    
    // 1. Initial High-Recall Fetch
    const fuseResults = this.fuse.search(rawQuery);
    
    // Stage 2: Intent Extraction & Re-Ranking
    const rankedResults: SearchResult<T>[] = fuseResults.map(result => {
      const item = result.item;
      const title = item.title.toLowerCase();
      const location = item.location.toLowerCase();
      let relevanceTier: SearchResult<T>['relevanceTier'] = 'fuzzy';
      let boost = 0;

      // Exact Title Match (Highest Confidence)
      if (title === rawQuery) {
        relevanceTier = 'exact';
        boost = 1.0;
      }
      // Direct Prefix Match
      else if (title.startsWith(rawQuery)) {
        relevanceTier = 'prefix';
        boost = 0.8;
      }
      // Token Intersection (Handling "I want to go Bali")
      else {
        const titleMatchCount = expandedTokens.filter(t => title.includes(t)).length;
        const locationMatchCount = expandedTokens.filter(t => location.includes(t)).length;
        
        const categories = ((item as any).category || []).map((c: string) => c.toLowerCase());
        const tags = ((item as any).tags || []).map((tg: string) => tg.toLowerCase());
        const destination = ((item as any).destination || "").toLowerCase();
        
        const categoryMatchCount = expandedTokens.filter(t => categories.some((c: string) => c.includes(t))).length;
        const tagsMatchCount = expandedTokens.filter(t => tags.some((tg: string) => tg.includes(t))).length;
        const destinationMatchCount = expandedTokens.filter(t => destination.includes(t)).length;
        
        if (titleMatchCount > 0) {
          relevanceTier = 'substring';
          boost = (titleMatchCount / tokens.length) * 0.8;
        } else if (destinationMatchCount > 0) {
          relevanceTier = 'substring';
          boost = (destinationMatchCount / tokens.length) * 0.7;
        } else if (categoryMatchCount > 0) {
          relevanceTier = 'substring';
          boost = (categoryMatchCount / tokens.length) * 0.6;
        } else if (tagsMatchCount > 0) {
          relevanceTier = 'substring';
          boost = (tagsMatchCount / tokens.length) * 0.6;
        } else if (locationMatchCount > 0) {
          relevanceTier = 'substring';
          boost = (locationMatchCount / tokens.length) * 0.5;
        }
      }

      const baseScore = result.score ?? 1;
      const finalScore = Math.max(0, baseScore - boost);

      return {
        item,
        score: finalScore,
        relevanceTier
      };
    });

    // 3. Deep Manifest Scan (Industry Standard Fallback)
    // If Fuse missed a perfect token match due to low fuzzy score, we force-find it here.
    const seenIds = new Set(rankedResults.map(r => (r.item as any).id));
    
    if (tokens.length > 0) {
      this.manifest.forEach(item => {
        if (seenIds.has((item as any).id)) return;
        
        const title = item.title.toLowerCase();
        const location = item.location.toLowerCase();
        const categories = ((item as any).category || []).map((c: string) => c.toLowerCase());
        const tags = ((item as any).tags || []).map((tg: string) => tg.toLowerCase());
        const destination = ((item as any).destination || "").toLowerCase();
        
        const matchedTitle = expandedTokens.filter(t => t.length < 3 ? title.startsWith(t) : title.includes(t)).length;
        const matchedLocation = expandedTokens.filter(t => t.length < 3 ? location.startsWith(t) : location.includes(t)).length;
        const matchedDestination = expandedTokens.filter(t => destination.includes(t)).length;
        const matchedCategory = expandedTokens.filter(t => categories.some((c: string) => c.includes(t))).length;
        const matchedTag = expandedTokens.filter(t => tags.some((tg: string) => tg.includes(t))).length;

        if (matchedTitle > 0 || matchedDestination > 0 || matchedCategory > 0 || matchedTag > 0 || matchedLocation > 0) {
          rankedResults.push({
            item,
            score: 0.1, // High priority for manual token match
            relevanceTier: (matchedTitle > 0 || matchedDestination > 0) ? 'prefix' : 'substring'
          });
        }
      });
    }

    return rankedResults
      .filter(r => {
        // If it's a pure fuzzy match, only keep it if the score is actually strong (e.g. <= 0.45)
        if (r.relevanceTier === 'fuzzy') {
          return r.score <= 0.45;
        }
        // General safety cutoff for boosted matches
        return r.score <= 0.6;
      })
      .sort((a, b) => {
        const tierWeights = { exact: 0, prefix: 1, substring: 2, fuzzy: 3, none: 4 };
        if (tierWeights[a.relevanceTier] !== tierWeights[b.relevanceTier]) {
          return tierWeights[a.relevanceTier] - tierWeights[b.relevanceTier];
        }
        return a.score - b.score;
      })
      .map(r => r.item);
  }

  public getManifest(): T[] {
    return this.manifest;
  }
}
