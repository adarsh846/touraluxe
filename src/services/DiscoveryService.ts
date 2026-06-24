import { SYNONYM_MAP } from '@/lib/synonyms';
import { supabase } from '@/lib/supabase';

export interface SearchProfile<T> {
  item: T;
  exactKeys: Set<string>;      // Lowercase tokens of Title, Location, Destination, tags, categories
  expansionKeys: Set<string>;  // Synonym expansions of the main attributes
  searchBlob: string;          // Flat string for substring fallbacks
}

export class DiscoveryService<T extends { title: string; location: string }> {
  private manifest: T[] = [];
  private searchProfiles: SearchProfile<T>[] = [];
  private dynamicSynonyms: Record<string, string[]> = {};
  private synonymsLoaded = false;
  private useServerFallback = false;

  constructor(data: T[]) {
    this.manifest = data;
    // If the dataset scales beyond 2000 items, flag for server delegation fallback
    if (data.length > 2000) {
      this.useServerFallback = true;
    } else {
      this.buildLocalIndex();
    }
    // Eagerly prefetch dynamic database synonyms on startup (non-blocking)
    this.prewarmSynonyms();
  }

  private async prewarmSynonyms() {
    try {
      const { data, error } = await supabase.from('search_synonyms').select('*');
      if (!error && data) {
        const map: Record<string, string[]> = {};
        data.forEach((row: any) => {
          map[row.word.toLowerCase().trim()] = (row.synonyms || []).map((s: string) => s.toLowerCase().trim());
        });
        this.dynamicSynonyms = map;
        this.synonymsLoaded = true;
        // Rebuild local search profiles with the loaded database synonyms
        if (!this.useServerFallback) {
          this.buildLocalIndex();
        }
      }
    } catch (err) {
      console.error("Failed to prewarm synonyms from database, using local mapping:", err);
    }
  }

  private buildLocalIndex() {
    const activeSynonyms = { ...SYNONYM_MAP, ...this.dynamicSynonyms };

    this.searchProfiles = this.manifest.map(item => {
      const title = (item.title || "").toLowerCase().trim();
      const location = (item.location || "").toLowerCase().trim();
      const destination = ((item as any).destination || "").toLowerCase().trim();
      const categories = (((item as any).category || []) as string[]).map(c => c.toLowerCase().trim());
      const tags = (((item as any).tags || []) as string[]).map(t => t.toLowerCase().trim());

      // Helper to split a string into unique lowercase tokens
      const tokenize = (str: string): string[] => {
        return str.split(/[\s,.\-\/]+/).filter(t => t.length > 0);
      };

      const titleTokens = tokenize(title);
      const locationTokens = tokenize(location);
      const destinationTokens = tokenize(destination);
      const categoryTokens = categories.flatMap(tokenize);
      const tagTokens = tags.flatMap(tokenize);

      // Create core exact keys set
      const exactKeys = new Set([
        ...titleTokens,
        ...locationTokens,
        ...destinationTokens,
        ...categoryTokens,
        ...tagTokens
      ]);

      // Create synonym expansion keys set
      const expansionKeys = new Set<string>();
      exactKeys.forEach(key => {
        if (activeSynonyms[key]) {
          activeSynonyms[key].forEach((syn: string) => expansionKeys.add(syn.toLowerCase().trim()));
        }
      });

      // Combined flat string search blob for fallback substring inclusion
      const searchBlob = `${title} ${location} ${destination} ${categories.join(" ")} ${tags.join(" ")}`.toLowerCase();

      return {
        item,
        exactKeys,
        expansionKeys,
        searchBlob
      };
    });
  }

  public async search(query: string): Promise<T[]> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    if (this.useServerFallback) {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.error("Server-side search request failed, falling back to local:", err);
      }
    }

    // Advanced tokenization of user query
    const noiseWords = new Set(['i', 'want', 'to', 'go', 'find', 'show', 'me', 'a', 'the', 'for', 'my', 'trip', 'travel', 'holiday', 'vacation', 'wan', 'look', 'looking', 'need', 'needs', 'place', 'places', 'at', 'with']);
    const queryTokens = cleanQuery.split(/[\s,.\-\/]+/)
      .filter(t => t.length > 0 && !noiseWords.has(t));

    if (queryTokens.length === 0) return [];

    const scoredResults: { item: T; score: number }[] = [];

    // Sub-millisecond evaluation matching via Set operations
    for (const profile of this.searchProfiles) {
      let score = 0;
      let exactMatches = 0;
      let synonymMatches = 0;

      queryTokens.forEach(token => {
        if (profile.exactKeys.has(token)) {
          exactMatches++;
        } else if (profile.expansionKeys.has(token)) {
          synonymMatches++;
        }
      });

      if (exactMatches > 0 || synonymMatches > 0) {
        // Boost for perfect matching
        if (exactMatches === queryTokens.length) {
          score += 100;
        } else {
          score += (exactMatches * 10) + (synonymMatches * 2);
        }
        
        // Additional boost if query is contained directly in the title
        if (profile.item.title.toLowerCase().includes(cleanQuery)) {
          score += 20;
        }
        // Additional boost if query is contained directly in the location
        if (profile.item.location.toLowerCase().includes(cleanQuery)) {
          score += 15;
        }
      } else {
        // Fallback 1: Direct substring inclusion in the metadata search blob
        const includesAllTokens = queryTokens.every(token => profile.searchBlob.includes(token));
        if (includesAllTokens) {
          score += 5;
        } else {
          // Fallback 2: Typo-tolerance using a lightweight Levenshtein check
          let typoMatch = false;
          queryTokens.forEach(token => {
            if (token.length > 3) { // Only check typos for words with length > 3
              for (const key of profile.exactKeys) {
                if (Math.abs(key.length - token.length) <= 1) {
                  const dist = this.levenshtein(token, key);
                  if (dist <= 1) { // Max 1 character typo
                    typoMatch = true;
                    break;
                  }
                }
              }
            }
          });
          if (typoMatch) {
            score += 2;
          }
        }
      }

      if (score > 0) {
        scoredResults.push({ item: profile.item, score });
      }
    }

    // Sort descending by relevance score
    return scoredResults
      .sort((a, b) => b.score - a.score)
      .map(r => r.item);
  }

  // Fast iterative Levenshtein distance implementation
  private levenshtein(a: string, b: string): number {
    const tmp: number[][] = [];
    for (let i = 0; i <= a.length; i++) {
      tmp[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      tmp[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1,
          tmp[i][j - 1] + 1,
          tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return tmp[a.length][b.length];
  }

  public getManifest(): T[] {
    return this.manifest;
  }
}
