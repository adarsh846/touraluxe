import { NextRequest, NextResponse } from 'next/server';
import { DiscoveryService } from '@/services/DiscoveryService';
import { Package } from '@/lib/supabase';
import { MAJOR_DESTINATIONS, validateLocation, getSuggestion } from "@/lib/geography";

/**
 * TOURALUXE SOVEREIGN AGENT API (V1 - SCALING ENGINE)
 * This route simulates the Sovereign Curator logic.
 * It is designed to be easily upgraded to a full LLM (OpenAI/Gemini) 
 * once API keys are provided.
 */

export async function POST(req: NextRequest) {
  try {
    // Safety Guard: Ensure request body exists to prevent JSON parse errors
    if (!req.body) {
      return NextResponse.json({ error: 'Body is required' }, { status: 400 });
    }
    const { message, manifest } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize the Pattern-Matching Engine as a "Tool"
    const engine = new DiscoveryService<Package>(manifest || []);
    let results = engine.search(message);

    // --- SOVEREIGN AGENTIC LOGIC ---
    // Here we simulate the reasoning process defined in the Sovereign Prompt V2.
    
    let thoughtProcess = "";
    let uiMessage = "";
    let state = "CURATING";
    let toolCall = null;

    const query = message.toLowerCase();
    
    // --- SOVEREIGN GEOGRAPHY VALIDATION LAYER ---
    const isGibberish = (text: string) => {
      const clean = text.trim().toLowerCase();
      if (clean.length < 2) return true;
      
      // Check against Global Geography Manifest
      const validGeography = validateLocation(clean);
      if (validGeography) return false;

      // Check for Suggestion (Did you mean?)
      const suggestion = getSuggestion(clean);
      if (suggestion) return false;

      // Check for Generic Travel Intents
      const genericIntents = ["warm", "cold", "beach", "mountain", "adventure", "luxury", "honeymoon", "family", "budget", "exclusive"];
      if (genericIntents.some(intent => clean.includes(intent))) return false;

      // --- DYNAMIC LINGUISTIC HEURISTICS (No Blacklists) ---
      
      // 1. Lexical Entropy: Real words have a healthy variety of characters
      const uniqueChars = new Set(clean.replace(/\s/g, "")).size;
      const entropyRatio = uniqueChars / clean.replace(/\s/g, "").length;
      if (clean.length > 4 && entropyRatio < 0.4) return true; // Catch "aaaaa", "ababab", etc.

      // 2. Pattern Repetition (3+ identical chars in a row)
      if (/(.)\1{2,}/.test(clean)) return true;

      // 3. Phonetic Flow: Catching "Wall of Consonants" or "Wall of Vowels"
      if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(clean)) return true; 
      if (/[aeiouy]{5,}/i.test(clean)) return true;

      // 4. Token-Level Intelligence
      const tokens = clean.split(/\s+/);
      const isNonsense = tokens.some(t => {
        if (t.length < 3) return false;
        const tVowels = t.match(/[aeiouy]/gi) || [];
        const tRatio = tVowels.length / t.length;
        // Words without a single vowel are extremely rare (unless very short like "sky")
        if (t.length >= 3 && tVowels.length === 0) return true;
        // Catch extreme ratios in individual tokens
        if (tRatio < 0.1 || tRatio > 0.9) return true;
        return false;
      });
      
      if (isNonsense) return true;

      return false;
    };

    // --- SOVEREIGN TRAVEL INTENT ANALYZER (Pass 2) ---
    const hasTravelIntent = (text: string) => {
      const travelKeywords = [
        "trip", "travel", "visit", "stay", "luxury", "vacation", "holiday", 
        "explore", "tour", "flight", "hotel", "resort", "booking", "package",
        "itinerary", "adventure", "honeymoon", "family", "getaway"
      ];
      return travelKeywords.some(keyword => text.toLowerCase().includes(keyword));
    };

    if (isGibberish(query)) {
      return NextResponse.json({
        thoughtProcess: `Input "${message}" flagged as non-geographic or gibberish. Requesting clarification.`,
        ui_message: `I couldn't quite identify a destination in your message. Could you clarify where your heart is leading you?`,
        results: [],
        state: 'CLARIFYING'
      });
    }

    // --- TWO-PASS SOVEREIGN VERIFICATION ENGINE ---
    
    // Pass 1: Authority Check
    let validLoc = validateLocation(query); // Tier 1: Local Atlas
    let isGlobalLandmark = false;
    
    if (!validLoc && query.length >= 3) {
      // Tier 2: Global Search Engine Sync
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`, {
          headers: { 'User-Agent': 'TouraLuxe-Sovereign-Agent/1.0' }
        });
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          const importance = parseFloat(result.importance || "0");
          const type = result.type || "";
          const category = result.class || "";

          const validTypes = ['city', 'town', 'village', 'state', 'country', 'continent', 'administrative', 'region', 'island', 'archipelago'];
          const isPlace = validTypes.includes(type) || category === 'boundary';
          
          if (isPlace) {
            // Tier 2: Open Horizon Protocol (Liberalized Recognition)
            // If it's a recognized place with reasonable authority (>0.4), we trust it.
            if (importance > 0.4 || hasTravelIntent(message)) {
              validLoc = result.display_name.split(',')[0];
              isGlobalLandmark = true; // Elevate to verified status
            }
          }
        }
      } catch (err) {
        console.error("OSM Sync Error:", err);
      }
    }

    // --- SOVEREIGN SUGGESTION ENGINE ---
    // If we haven't found a match yet, check for close Atlas alignments
    const suggestion = getSuggestion(query);

    // Pass 2: Decision Logic
    const isVerifiedIntent = 
      results.length > 0 || 
      !!validateLocation(query) || 
      isGlobalLandmark || 
      (validLoc && hasTravelIntent(message) && validLoc.toLowerCase() !== query.trim().toLowerCase());

    if (!isVerifiedIntent) {
      // Suggesting instead of auto-correcting to respect user agency
      if (suggestion && !results.length) {
        return NextResponse.json({
          thoughtProcess: `Input "${message}" not verified, but found close Atlas match: "${suggestion}". Suggesting correction.`,
          ui_message: `I couldn't find an exact match for "${message}". Did you mean ${suggestion}?`,
          results: [],
          state: 'SUGGESTING',
          suggestion: suggestion
        });
      }

      return NextResponse.json({
        thoughtProcess: `Input "${message}" lacks sufficient geographic authority or separate travel intent correlation. Staying in CLARIFYING state.`,
        ui_message: `I couldn't quite identify a destination in your message. Could you clarify where your heart is leading you?`,
        results: [],
        state: 'CLARIFYING'
      });
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

      // Tiered Decision:
      // 1. If it's an exact match or a clear single-candidate prefix, we auto-resolve for speed.
      // 2. If it's a fuzzy match (typo), we ask "Did you mean?" to respect intent.
      
      if (!exactMatch && !isPrefixMatch && queryClean.length > 2) {
        const suggestion = topMatch.title;
        return NextResponse.json({
          thoughtProcess: `Fuzzy match detected for "${message}". Suggesting "${suggestion}" for editorial clarity.`,
          ui_message: `I couldn't find an exact match for "${message}". Did you mean ${suggestion}?`,
          results: [],
          state: 'SUGGESTING',
          suggestion: suggestion
        });
      }

      // Ambiguity Management: If multiple results are found for a short query, we ask for clarification
      if (results.length > 1 && query.length < 5 && !exactMatch) {
        const options = results.slice(0, 2).map(r => r.title).join(" or ");
        uiMessage = `You've caught my interest with "${message}". Are you dreaming of ${options}, or perhaps exploring another horizon?`;
        thoughtProcess = `Ambiguous intent detected for "${message}". Multiple matches found (${results.length}). Guiding user towards clarification between ${options}.`;
      } else {
        thoughtProcess = `User intent identified: ${message}. Searching manifest for elite matches. Found ${results.length} relevant experiences. Prioritizing ${topMatch.title}.`;
        uiMessage = `I've found ${results.length} journeys for you. I think you'll find your heart in our ${topMatch.title} collection.`;
      }
      
      const enrichedResults = results.map((r, idx) => {
        const packageTerms = `${r.title} ${r.location} ${r.destination || ""}`.toLowerCase();
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
      // If we found a valid location via Atlas or Search Engine but NO packages match
      const formattedDest = validLoc.charAt(0).toUpperCase() + validLoc.slice(1);
      thoughtProcess = `Intent "${message}" verified as ${formattedDest}. No direct manifest match found. Initiating Custom Design.`;
      uiMessage = `A journey to ${formattedDest} should be as unique as your vision. Let’s design it together.`;
      state = "ESCALATING";
      toolCall = {
        name: "create_custom_inquiry",
        parameters: { destination: validLoc }
      };
    } else {
      // No packages, no valid location found anywhere
      return NextResponse.json({
        thoughtProcess: `Input "${message}" not identified as a valid destination or intent. Requesting clarification.`,
        ui_message: `I couldn't quite identify a destination in your message. Could you clarify where your heart is leading you?`,
        results: [],
        state: 'CLARIFYING'
      });
    }

    // Standardized Sovereign Response Format (Prompt V2 Section VI)
    return NextResponse.json({
      thought_process: thoughtProcess,
      tool_call: toolCall,
      state: state,
      ui_message: uiMessage,
      results: results
    });

  } catch (error) {
    console.error('Sovereign API Error:', error);
    return NextResponse.json({ 
      error: 'Refining the global inventory refresh...',
      state: 'ERROR'
    }, { status: 500 });
  }
}
