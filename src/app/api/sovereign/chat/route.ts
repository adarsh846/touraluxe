import { NextRequest, NextResponse } from 'next/server';
import { DiscoveryService } from '@/services/DiscoveryService';
import { Package } from '@/lib/supabase';

/**
 * TOURALUXE SOVEREIGN AGENT API (V1 - SCALING ENGINE)
 * This route simulates the Sovereign Curator logic.
 * It is designed to be easily upgraded to a full LLM (OpenAI/Gemini) 
 * once API keys are provided.
 */

export async function POST(req: NextRequest) {
  try {
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
    
    // --- GIBBERISH/VALIDATION LAYER (HARDENED) ---
    const isGibberish = (text: string) => {
      const clean = text.trim().toLowerCase();
      if (clean.length < 2) return true;
      
      // Vowel Density Check
      const vowels = clean.match(/[aeiouy]/gi) || [];
      const vowelRatio = vowels.length / clean.length;
      if (vowelRatio < 0.15 || vowelRatio > 0.8) return true; // Too few or too many vowels

      // Consonant Streak Check (e.g., "ndsc" in "Lomdondscko")
      if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(clean)) return true; // 4+ consonants in a row

      // Repeated Character Check
      if (/(.)\1{3,}/.test(clean)) return true;

      // Entropy Check (Simplified)
      const uniqueChars = new Set(clean).size;
      if (clean.length > 8 && uniqueChars / clean.length < 0.3) return true; // Too many repeating chars in long string

      return false;
    };

    if (isGibberish(query)) {
      return NextResponse.json({
        thoughtProcess: `Input "${message}" flagged as non-geographic or gibberish. Requesting clarification.`,
        ui_message: `I couldn't quite identify a destination in your message. Could you clarify where your heart is leading you?`,
        results: [],
        state: 'CLARIFYING'
      });
    }

    if (results.length > 0) {
      const topMatch = results[0];
      thoughtProcess = `User intent identified: ${message}. Searching manifest for elite matches. Found ${results.length} relevant experiences. Prioritizing ${topMatch.title}.`;
      uiMessage = `I have curated ${results.length} elite experiences for you. Our ${topMatch.title} journey seems particularly suited for your intent.`;
      // Enrich results with Sovereign Intelligence Metadata (Phase 2)
      const enrichedResults = results.map((r, idx) => {
        // Calculate a more "Accurate" match score based on keyword overlap
        const packageTerms = `${r.title} ${r.location} ${r.destination || ""}`.toLowerCase();
        const searchTerms = query.split(' ').filter((t: string) => t.length > 2);
        
        let matchCount = 0;
        searchTerms.forEach((term: string) => {
          if (packageTerms.includes(term)) {
            // Check if it's an exact word match for a 10% boost per word
            const regex = new RegExp(`\\b${term}\\b`, 'i');
            if (regex.test(packageTerms)) {
              matchCount += 2; // Double weight for exact word matches
            } else {
              matchCount += 1;
            }
          }
        });

        // Base score calculation (internal only now)
        const relevanceScore = Math.min(99, 79 + (matchCount * 10) - (idx * 2));
        
        // Narrative Label Logic
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
          match_score: relevanceScore, // Keep for sorting/logic
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
      
      // Update results with enriched data
      results = enrichedResults;
    } else {
      thoughtProcess = `Intent "${message}" identified. No direct manifest match found. Initiating Custom Design phase.`;
      uiMessage = `Your vision is unique. Let’s design your perfect journey together.`;
      state = "ESCALATING";
      toolCall = {
        name: "create_custom_inquiry",
        parameters: { destination: message }
      };
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
