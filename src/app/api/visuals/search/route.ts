import { NextRequest, NextResponse } from 'next/server';

/**
 * SOVEREIGN VISUAL AUTHORITY API (PEXELS V1)
 * This route provides secure, filtered access to elite travel imagery.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const orientation = searchParams.get('orientation') || 'landscape';
    const per_page = searchParams.get('per_page') || '1';

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Visual Engine Key missing' }, { status: 500 });
    }

    // Sovereign Visual Intelligence: 
    // We append a "Positive Power Signature" to force professional landscape work
    // We use a "Universal Exclusion" to purge non-luxury artifacts globally
    const positiveSignature = "cinematic aerial landscape landmark panoramic high-fidelity";
    const negativeSignature = "-people -crowd -busy -street -sign -text -market -interior -trash -bus -truck";
    
    const refinedQuery = `${query} ${positiveSignature} ${negativeSignature}`;

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(refinedQuery)}&orientation=${orientation}&size=large&per_page=${per_page}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Visual Engine');
    }

    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      // Map to a clean, authoritative response format
      return NextResponse.json({
        url: data.photos[0].src.large2x || data.photos[0].src.large,
        photographer: data.photos[0].photographer,
        id: data.photos[0].id
      });
    }

    return NextResponse.json({ error: 'No iconic matches found' }, { status: 404 });

  } catch (error) {
    console.error('Visual Engine Error:', error);
    return NextResponse.json({ error: 'Synchronizing global visual manifest...' }, { status: 500 });
  }
}
