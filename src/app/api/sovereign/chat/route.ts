import { NextRequest, NextResponse } from 'next/server';
import { DiscoveryService } from '@/services/DiscoveryService';
import { Package, supabase } from '@/lib/supabase';
import { MAJOR_DESTINATIONS, validateLocation, getSuggestion } from "@/lib/geography";
import { INTENT_MESSAGES } from '@/lib/intentMessages';

/**
 * TOURALUXE SOVEREIGN AGENT API (V1 - SCALING ENGINE)
 * This route simulates the Sovereign Curator logic.
 * It is designed to be easily upgraded to a full LLM (OpenAI/Gemini) 
 * once API keys are provided.
 */

// Memory caches to avoid hitting database/external APIs on every keystroke
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const dbPackagesCache: { entry: CacheEntry<Package[]> | null } = { entry: null };
const intentMessagesCache: { entry: CacheEntry<Record<string, string[]>> | null } = { entry: null };
const chatResponseCache = new Map<string, CacheEntry<any>>();
const osmGeocodeCache = new Map<string, CacheEntry<any>>();

const CACHE_TTL_DB = 60 * 1000; // 1 minute cache for DB queries
const CACHE_TTL_CHAT = 5 * 60 * 1000; // 5 minutes cache for duplicate user queries
const CACHE_TTL_OSM = 60 * 60 * 1000; // 1 hour cache for Nominatim lookups

export async function POST(req: NextRequest) {
  try {
    if (!req.body) {
      return NextResponse.json({ error: 'Body is required' }, { status: 400 });
    }
    const { message, manifest } = await req.json();

    const queryClean = (message || '').trim().toLowerCase();
    const isExploreQuery = queryClean === 'explore' || queryClean === 'explore all' || queryClean === 'all' || queryClean === 'packages' || queryClean === 'show all' || queryClean === '';

    if (isExploreQuery) {
      // Fetch packages (using cached DB or fallback to manifest)
      let dbPackages: Package[] = [];
      const now = Date.now();
      
      // Initialize/Fallback Supabase Client if needed
      let supabaseClient = supabase;
      let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        try {
          const fs = require('fs');
          const path = require('path');
          const envPath = path.join(process.cwd(), '.env.local');
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const urlMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)$/m);
            const keyMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)$/m);
            if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1].trim();
            if (keyMatch && keyMatch[1]) supabaseKey = keyMatch[1].trim();
          }
        } catch (fsErr) {
          console.error("Local Supabase env read error in Explore:", fsErr);
        }
      }
      if (supabaseUrl && supabaseKey && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
        try {
          const { createClient } = require("@supabase/supabase-js");
          supabaseClient = createClient(supabaseUrl, supabaseKey);
        } catch (clientErr) {
          console.error("Failed to dynamically build Supabase client in Explore:", clientErr);
        }
      }

      if (dbPackagesCache.entry && (now - dbPackagesCache.entry.timestamp < CACHE_TTL_DB)) {
        dbPackages = dbPackagesCache.entry.data;
      } else {
        try {
          const { data, error } = await supabaseClient
            .from("packages")
            .select("*")
            .eq("is_published", true)
            .order("sort_order", { ascending: true });
          if (!error && data) {
            dbPackages = data as Package[];
            dbPackagesCache.entry = { data: dbPackages, timestamp: now };
          }
        } catch (dbErr) {
          console.error("Supabase package fetch error during Explore query:", dbErr);
        }
      }
      const activeManifest = dbPackages.length > 0 ? dbPackages : (manifest || []);

      const enrichedResults = activeManifest.map((pkg: any, idx: number) => ({
        ...pkg,
        match_score: 99,
        match_label: "Featured Escape",
        authority_type: idx === 0 ? "gold" : "silver",
        sovereign_reason: "Selected as part of our elite showcase portfolio."
      }));

      const responseData = {
        thought_process: "User requested global explore curation. Returning all available packages from our luxury portfolio.",
        state: "CURATING",
        ui_message: "Welcome to TouraLuxe. Explore our curated portfolio of luxury escapes and private sanctuaries. Select a journey below to customize your experience.",
        results: enrichedResults,
        tool_call: {
          name: "explore_all_packages",
          parameters: { query: message },
          result: enrichedResults.slice(0, 3)
        }
      };

      return NextResponse.json(responseData);
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // L1 Chat Response Cache Check
    const cacheKey = message.trim().toLowerCase();
    const cachedChat = chatResponseCache.get(cacheKey);
    if (cachedChat && Date.now() - cachedChat.timestamp < CACHE_TTL_CHAT) {
      return NextResponse.json(cachedChat.data);
    }

    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Fail-safe: manual disk parser for Supabase credentials to bypass Next.js env caching
    if (!supabaseUrl || !supabaseKey) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const urlMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)$/m);
          const keyMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)$/m);
          if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1].trim();
          if (keyMatch && keyMatch[1]) supabaseKey = keyMatch[1].trim();
        }
      } catch (fsErr) {
        console.error("Local Supabase env read error:", fsErr);
      }
    }

    // Initialize/Fallback Supabase Client
    let supabaseClient = supabase;
    if (supabaseUrl && supabaseKey && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      try {
        const { createClient } = require("@supabase/supabase-js");
        supabaseClient = createClient(supabaseUrl, supabaseKey);
      } catch (clientErr) {
        console.error("Failed to dynamically build Supabase client, fallback to default import:", clientErr);
      }
    }

    // Fetch real-time active products from database to ensure complete product awareness
    let dbPackages: Package[] = [];
    const now = Date.now();
    if (dbPackagesCache.entry && (now - dbPackagesCache.entry.timestamp < CACHE_TTL_DB)) {
      dbPackages = dbPackagesCache.entry.data;
    } else {
      try {
        const { data, error } = await supabaseClient
          .from("packages")
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true });
        if (!error && data) {
          dbPackages = data as Package[];
          dbPackagesCache.entry = { data: dbPackages, timestamp: now };
        } else if (dbPackagesCache.entry) {
          dbPackages = dbPackagesCache.entry.data;
        }
      } catch (dbErr) {
        console.error("Supabase package fetch error, using manifest fallback:", dbErr);
        if (dbPackagesCache.entry) {
          dbPackages = dbPackagesCache.entry.data;
        }
      }
    }

    // Fallback to client manifest if database query returns empty (as a bulletproof measure)
    const activeManifest = dbPackages.length > 0 ? dbPackages : (manifest || []);

    let GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Fail-safe: if Next.js cached process environment fails to read newly added key, parse .env.local directly from disk!
    if (!GEMINI_API_KEY) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const match = envContent.match(/^GEMINI_API_KEY\s*=\s*(.*)$/m);
          if (match && match[1]) {
            GEMINI_API_KEY = match[1].trim();
          }
        }
      } catch (fsErr) {
        console.error("Local env.local read fail-safe error:", fsErr);
      }
    }

    // ==========================================
    // TIER 1: LIVE GEMINI AI MODEL INTEGRATION
    // ==========================================
    if (GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are the TouraLuxe Sovereign Curator, an elite, high-fidelity AI travel concierge.
Your task is to parse a natural human travel query and align it with our inventory of packages.

Our inventory manifest is:
${JSON.stringify(activeManifest)}

Analyze the user's message: "${message}"

Identify:
1. The target destination, mood, emotion, or vacation style from the message.
2. The user's travel style (honeymoon, luxury escape, adventure, relaxation, etc.).
3. The preferred season.

Return a standardized JSON object with EXACTLY the following structure:
{
  "thought_process": "Your professional reasoning and semantic analysis of the user's requirements.",
  "state": "CURATING" | "CLARIFYING" | "SUGGESTING" | "ESCALATING",
  "ui_message": "An elegant, bespoke response to the user in a poetic, premium, and welcoming voice.",
  "matched_package_ids": ["array of matching package IDs from manifest in order of relevance"],
  "suggestion": "Optional suggestion of a destination if they made a typo"
}

If the user expresses a mood, emotional state, or general vacation desire (e.g. "I'm so tired of work I want to go on a luxury vacation", "I want a relaxing beach getaway", "I need peace and quiet"), DO NOT clarify. Set state to "CURATING", match the most luxurious, peaceful, or relevant packages from our manifest (like premium resorts, beach escapes, or tranquil mountain retreats), and write an empathetic, beautifully soothing, luxurious concierge response acknowledging their feelings and inviting them to escape.
If the query is vague, gibberish, or does not indicate a clear travel intent, set state to "CLARIFYING" and politely ask for clarification in "ui_message".
If the query contains a minor typo or close alignment to a destination, set state to "SUGGESTING" and supply the corrected destination in "suggestion".
If the destination is valid but we do not have a direct package in our manifest, set state to "ESCALATING" and offer to design a bespoke custom journey in "ui_message".`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2
              }
            })
          }
        );

        if (response.ok) {
          const resData = await response.json();
          const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (responseText) {
            const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
            const aiResult = JSON.parse(cleanJson);
            
            let matchedPackages = activeManifest.filter((pkg: any) => 
              aiResult.matched_package_ids?.includes(pkg.id) ||
              aiResult.matched_package_ids?.includes(pkg.id?.toString())
            );

            // Fail-safe: if state is CURATING but no packages are matched directly by ID, utilize high-recall semantic fallback search
            if (matchedPackages.length === 0 && aiResult.state === "CURATING") {
              const localEngine = new DiscoveryService<any>(activeManifest);
              matchedPackages = localEngine.search(message);
            }

            if (matchedPackages.length > 0) {
              matchedPackages = matchedPackages.map((pkg: any, idx: number) => ({
                ...pkg,
                match_score: Math.min(99, 95 - (idx * 5)),
                match_label: idx === 0 ? "Prime Alignment" : "Strong Correlation",
                authority_type: idx === 0 ? "gold" : "silver",
                sovereign_reason: `Curated by Gemini AI based on your natural language travel preferences.`
              }));
            }

            const responseData = {
              thought_process: aiResult.thought_process,
              state: aiResult.state,
              ui_message: aiResult.ui_message,
              results: matchedPackages,
              suggestion: aiResult.suggestion,
              tool_call: matchedPackages.length > 0 ? {
                name: "search_manifest",
                parameters: { query: message },
                result: matchedPackages.slice(0, 3)
              } : null
            };
            chatResponseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
            return NextResponse.json(responseData);
          }
        }
      } catch (geminiError) {
        console.error("Gemini Live Integration Error, falling back to local patterns:", geminiError);
      }
    }

    // ==========================================
    // TIER 2: LOCAL HIGH-FIDELITY PATTERN FALLBACK
    // ==========================================
    const engine = new DiscoveryService<Package>(activeManifest);
    let results = await engine.search(message);

    const query = message.toLowerCase();
    const isRomanticQuery = query.includes("honeymoon") || query.includes("romantic") || query.includes("anniversary") || query.includes("couple");
    const isRelaxQuery = query.includes("vacation") || query.includes("relax") || query.includes("luxury") || query.includes("escape") || query.includes("tired") || query.includes("weary");

    let thoughtProcess = "";
    let uiMessage = "";
    let state = "CURATING";
    let toolCall = null;

    
    
    const isGibberish = (text: string) => {
      const clean = text.trim().toLowerCase();
      if (clean.length < 2) return true;
      
      const validGeography = validateLocation(clean, activeManifest);
      if (validGeography) return false;

      const suggestion = getSuggestion(clean, activeManifest);
      if (suggestion) return false;

      const genericIntents = ["warm", "cold", "beach", "mountain", "adventure", "luxury", "honeymoon", "family", "budget", "exclusive"];
      if (genericIntents.some(intent => clean.includes(intent))) return false;

      const uniqueChars = new Set(clean.replace(/\s/g, "")).size;
      const entropyRatio = uniqueChars / clean.replace(/\s/g, "").length;
      if (clean.length > 4 && entropyRatio < 0.4) return true;

      if (/(.)\1{2,}/.test(clean)) return true;

      if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(clean)) return true; 
      if (/[aeiouy]{5,}/i.test(clean)) return true;

      const tokens = clean.split(/\s+/);
      const isNonsense = tokens.some(t => {
        if (t.length < 3) return false;
        const tVowels = t.match(/[aeiouy]/gi) || [];
        const tRatio = tVowels.length / t.length;
        if (t.length >= 3 && tVowels.length === 0) return true;
        if (tRatio < 0.1 || tRatio > 0.9) return true;
        return false;
      });
      
      if (isNonsense) return true;
      return false;
    };

    const hasTravelIntent = (text: string) => {
      const travelKeywords = [
        "trip", "travel", "visit", "stay", "luxury", "vacation", "holiday", 
        "explore", "tour", "flight", "hotel", "resort", "booking", "package",
        "itinerary", "adventure", "honeymoon", "family", "getaway"
      ];
      return travelKeywords.some(keyword => text.toLowerCase().includes(keyword));
    };

    if (isGibberish(query)) {
      const responseData = {
        thought_process: `Input "${message}" flagged as non-geographic or gibberish. Requesting clarification.`,
        ui_message: "Where does your heart long to go? Tell us a mood, a feeling, or a destination, and let's begin your escape.",
        results: [],
        state: 'CLARIFYING'
      };
      chatResponseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      return NextResponse.json(responseData);
    }

    let validLoc = validateLocation(query, activeManifest);
    let isGlobalLandmark = false;
    
    // Only query Nominatim if we found zero matches in our packages manifest AND it is not a validated local location
    if (results.length === 0 && !validLoc && query.length >= 3) {
      // Check OSM Cache
      const cachedOSM = osmGeocodeCache.get(query);
      if (cachedOSM && Date.now() - cachedOSM.timestamp < CACHE_TTL_OSM) {
        if (cachedOSM.data) {
          validLoc = cachedOSM.data.validLoc;
          isGlobalLandmark = cachedOSM.data.isGlobalLandmark;
        }
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 800); // Tight 800ms timeout to keep UI fluid

          const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`, {
            headers: { 'User-Agent': 'TouraLuxe-Sovereign-Agent/1.0' },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const data = await response.json();
          
          let resolvedLoc = null;
          let resolvedLandmark = false;

          if (data && data.length > 0) {
            const result = data[0];
            const importance = parseFloat(result.importance || "0");
            const type = result.type || "";
            const category = result.class || "";

            const validTypes = ['city', 'town', 'village', 'state', 'country', 'continent', 'administrative', 'region', 'island', 'archipelago'];
            const isPlace = validTypes.includes(type) || category === 'boundary';
            
            if (isPlace) {
              if (importance > 0.4 || hasTravelIntent(message)) {
                resolvedLoc = result.display_name.split(',')[0];
                resolvedLandmark = true;
              }
            }
          }
          
          validLoc = resolvedLoc;
          isGlobalLandmark = resolvedLandmark;
          
          // Cache the resolved result (even if null to prevent repeatedly querying nonsense words)
          osmGeocodeCache.set(query, {
            data: { validLoc: resolvedLoc, isGlobalLandmark: resolvedLandmark },
            timestamp: Date.now()
          });
        } catch (err) {
          console.error("OSM Sync Error:", err);
        }
      }
    }

    // Fail-safe: if local search returned empty but query expresses a clear ambient intent (e.g. Honeymoon or Vacation) AND is NOT a valid global location query
    if (results.length === 0 && (isRomanticQuery || isRelaxQuery) && !validLoc && !isGlobalLandmark && activeManifest.length > 0) {
      results = [...activeManifest];
      state = "CURATING";
      if (isRomanticQuery) {
        uiMessage = "Welcome to TouraLuxe. We have hand-picked our most exclusive romantic sanctuaries in Bali, Maldives, and Vietnam to curate a first chapter worthy of your love.";
        thoughtProcess = `User expressed romantic/honeymoon intent "${message}". Matching all available luxury packages as prime recommendations.`;
      } else {
        uiMessage = "We hear you. Allow us to whisk you away to absolute tranquility in our private sanctuaries in Bali, Maldives, and Vietnam where work is completely forgotten.";
        thoughtProcess = `User expressed escape/relaxation intent "${message}". Curating active luxury retreats: Bali, Maldives, and Vietnam.`;
      }
    }

    const suggestion = getSuggestion(query, activeManifest);

    const isVerifiedIntent = 
      results.length > 0 || 
      !!validateLocation(query, activeManifest) || 
      isGlobalLandmark || 
      (validLoc && hasTravelIntent(message) && validLoc.toLowerCase() !== query.trim().toLowerCase());

    if (!isVerifiedIntent) {
      if (suggestion && !results.length) {
        const responseData = {
          thought_process: `Input "${message}" not verified, but found close Atlas match: "${suggestion}". Suggesting correction.`,
          ui_message: `Were you dreaming of ${suggestion}? Let us take you there.`,
          results: [],
          state: 'SUGGESTING',
          suggestion: suggestion
        };
        chatResponseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        return NextResponse.json(responseData);
      }

      const responseData = {
        thought_process: `Input "${message}" lacks sufficient geographic authority or separate travel intent correlation. Staying in CLARIFYING state.`,
        ui_message: "Every great journey begins with a spark. Share a destination, a dream, or how you want to feel, and let us design it.",
        results: [],
        state: 'CLARIFYING'
      };
      chatResponseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      return NextResponse.json(responseData);
    }

    const lowerQuery = query.toLowerCase();
    let intent = 'fallback';
    
    if (lowerQuery.includes('romantic') || lowerQuery.includes('honeymoon') || lowerQuery.includes('love')) {
      intent = 'romantic';
    } else if (lowerQuery.includes('sea') || lowerQuery.includes('beach') || lowerQuery.includes('coast') || lowerQuery.includes('tranquil')) {
      intent = 'beach';
    } else if (lowerQuery.includes('adventure') || lowerQuery.includes('trek') || lowerQuery.includes('hike')) {
      intent = 'adventure';
    }

    if (results.length > 0) {
      const queryClean = query.toLowerCase().trim();
      const topMatch = results[0];
      
      const exactMatch = 
        topMatch.title.toLowerCase() === queryClean || 
        topMatch.location.toLowerCase() === queryClean ||
        (topMatch.destination || "").toLowerCase() === queryClean;

      const isPrefixMatch = 
        topMatch.title.toLowerCase().startsWith(queryClean) || 
        topMatch.location.toLowerCase().startsWith(queryClean);
      
      if (suggestion && suggestion === topMatch.title && !exactMatch && !isPrefixMatch && queryClean.length > 2) {
        const suggestion = topMatch.title;
        const responseData = {
          thought_process: `Fuzzy match detected for "${message}". Suggesting "${suggestion}" for editorial clarity.`,
          ui_message: `Were you dreaming of ${suggestion}? Let us take you there.`,
          results: [],
          state: 'SUGGESTING',
          suggestion: suggestion
        };
        chatResponseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        return NextResponse.json(responseData);
      }

      if (results.length > 1 && query.length < 5 && !exactMatch && !uiMessage) {
        const options = results.slice(0, 2).map(r => r.title).join(" or ");
        uiMessage = `You have beautiful taste. Are you dreaming of the magic of ${options}, or exploring another horizon?`;
        thoughtProcess = `Ambiguous intent detected for "${message}". Multiple matches found (${results.length}). Guiding user towards clarification between ${options}.`;
      } else if (!uiMessage) {
        thoughtProcess = `User intent identified: ${message}. Searching manifest for elite matches. Found ${results.length} relevant experiences. Prioritizing ${topMatch.title}.`;
        
        const topTitles = results.slice(0, 3).map(r => r.title);
        let formattedOptions = topMatch.title;
        
        if (topTitles.length === 2) {
          formattedOptions = `${topTitles[0]} & ${topTitles[1]}`;
        } else if (topTitles.length > 2) {
          formattedOptions = `${topTitles.slice(0, -1).join(", ")} & ${topTitles[topTitles.length - 1]}`;
        }

        let activeIntentMessages = INTENT_MESSAGES;
        const nowMsg = Date.now();
        if (intentMessagesCache.entry && (nowMsg - intentMessagesCache.entry.timestamp < CACHE_TTL_DB)) {
          activeIntentMessages = { ...INTENT_MESSAGES, ...intentMessagesCache.entry.data };
        } else {
          try {
            const { data, error } = await supabase.from('intent_messages').select('*');
            if (!error && data) {
              const map: Record<string, string[]> = {};
              data.forEach((row: any) => {
                map[row.intent_key] = row.messages;
              });
              activeIntentMessages = { ...INTENT_MESSAGES, ...map };
              intentMessagesCache.entry = { data: map, timestamp: nowMsg };
            } else if (intentMessagesCache.entry) {
              activeIntentMessages = { ...INTENT_MESSAGES, ...intentMessagesCache.entry.data };
            }
          } catch (err) {
            console.error("Failed to fetch intent messages from Supabase, falling back to local file.", err);
            if (intentMessagesCache.entry) {
              activeIntentMessages = { ...INTENT_MESSAGES, ...intentMessagesCache.entry.data };
            }
          }
        }

        const messages = activeIntentMessages[intent] || activeIntentMessages.fallback;
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        uiMessage = randomMessage.replace('{options}', formattedOptions);
      }
      const enrichedResults = results.map((r, idx) => {
        const categoriesStr = Array.isArray(r.category) ? r.category.join(" ") : "";
        const tagsStr = Array.isArray(r.tags) ? r.tags.join(" ") : "";
        const tripTypeStr = typeof r.trip_type === "string" ? r.trip_type : "";
        const packageTerms = `${r.title} ${r.location} ${r.destination || ""} ${categoriesStr} ${tagsStr} ${tripTypeStr}`.toLowerCase();
        const searchTerms = query.split(' ').filter((t: string) => t.length > 2);
        
        let matchCount = 0;
        searchTerms.forEach((term: string) => {
          if (packageTerms.includes(term)) {
            const regex = new RegExp(`\\b${term}\\b`, 'i');
            if (regex.test(packageTerms)) {
              matchCount += 2;
            } else {
              matchCount += 1;
            }
          }
        });

        const relevanceScore = Math.min(99, 79 + (matchCount * 10) - (idx * 2));
        
        let matchLabel = "Discovery Match";
        let authorityType = "standard";
        
        if (relevanceScore >= 95) {
          matchLabel = "Prime Alignment";
          authorityType = "gold";
        } else if (relevanceScore >= 88) {
          matchLabel = "Strong Correlation";
          authorityType = "silver";
        } else if (relevanceScore >= 80) {
          matchLabel = "Thematic Match";
          authorityType = "bronze";
        }

        return {
          ...r,
          match_score: relevanceScore,
          match_label: matchLabel,
          authority_type: authorityType,
          sovereign_reason: idx === 0 
            ? `Identified as the definitive match for "${message}" within our elite manifest.`
            : `Selected for its strong ${searchTerms[0] || 'thematic'} alignment with your intent.`
        };
      });

      toolCall = {
        name: "search_manifest",
        parameters: { query: message },
        result: enrichedResults.slice(0, 3)
      };
      
      results = enrichedResults;
    } else if (validLoc) {
      const formattedDest = validLoc.charAt(0).toUpperCase() + validLoc.slice(1);
      
      // Check if it's an exact match (ignoring case & accents)
      const cleanInput = query.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cleanResolved = validLoc.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (cleanInput !== cleanResolved) {
        const responseData = {
          thought_process: `Fuzzy global location detected for "${message}". Suggesting "${formattedDest}" for user validation.`,
          ui_message: `Were you dreaming of ${formattedDest}? Let us take you there.`,
          results: [],
          state: 'SUGGESTING',
          suggestion: formattedDest
        };
        chatResponseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        return NextResponse.json(responseData);
      }

      thoughtProcess = `Intent "${message}" verified as ${formattedDest}. No direct manifest match found. Initiating Custom Design.`;
      uiMessage = `A journey to ${formattedDest} is a beautiful dream. Although we don't have a package ready, let's co-create your custom escape together right now.`;
      state = "ESCALATING";
      toolCall = {
        name: "create_custom_inquiry",
        parameters: { destination: validLoc }
      };
    } else if (intent !== 'fallback') {
      const themeNames: Record<string, string> = {
        romantic: "romantic escapes",
        beach: "coastal retreats",
        adventure: "thrilling adventures"
      };
      const themeName = themeNames[intent] || "specialized travel";
      thoughtProcess = `Theme "${intent}" detected but no direct manifest match found. Initiating Custom Design.`;
      uiMessage = `We love ${themeName}. While we don't have a pre-designed package for that right now, let's co-create your custom escape together right now.`;
      state = "ESCALATING";
      toolCall = {
        name: "create_custom_inquiry",
        parameters: { theme: intent }
      };
    } else {
      const responseData = {
        thought_process: `Input "${message}" not identified as a valid destination or intent. Requesting clarification.`,
        ui_message: "Every great journey begins with a spark. Share a destination, a dream, or how you want to feel, and let us design it.",
        results: [],
        state: 'CLARIFYING'
      };
      chatResponseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      return NextResponse.json(responseData);
    }

    const responseData = {
      thought_process: thoughtProcess,
      tool_call: toolCall,
      state: state,
      ui_message: uiMessage,
      results: results
    };
    chatResponseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Sovereign API Error:', error);
    return NextResponse.json({ 
      error: 'Refining the global inventory refresh...',
      state: 'ERROR'
    }, { status: 500 });
  }
}
