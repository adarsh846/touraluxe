import { NextRequest, NextResponse } from 'next/server';

/**
 * SOVEREIGN VISUAL AUTHORITY API (PEXELS V1)
 * This route provides secure, filtered access to elite travel imagery.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'image'; // image or video
    const per_page = searchParams.get('per_page') || '80';
    const page = searchParams.get('page') || '1';
    const resolution = searchParams.get('resolution') || 'desktop';

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Visual Engine Key missing' }, { status: 500 });
    }

    // Sovereign Visual Intelligence: 
    const positiveSignature = type === 'video' 
      ? "travel cinematic" 
      : "travel tourism photography";
    
    const negativeSignature = "-text -trash -advertising";
    
    const refinedQuery = `${query} ${positiveSignature} ${negativeSignature}`;

    const baseUrl = type === 'video' 
      ? "https://api.pexels.com/videos/search"
      : "https://api.pexels.com/v1/search";

    const response = await fetch(
      `${baseUrl}?query=${encodeURIComponent(refinedQuery)}&page=${page}&per_page=${per_page}${type === 'video' ? '' : '&size=large'}&_t=${Date.now()}`,
      {
        cache: 'no-store',
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Visual Engine');
    }

    const data = await response.json();
    
    if (type === 'video' && data.videos && data.videos.length > 0) {
      const videos = data.videos.map((video: any) => {
        // Select the best file based on resolution
        const videoFile = video.video_files.find((f: any) => 
          resolution === 'mobile' ? f.width <= 1080 : f.width >= 1920
        ) || video.video_files[0];

        return {
          url: videoFile.link,
          image: video.image,
          id: video.id,
          duration: video.duration
        };
      });

      return NextResponse.json(per_page === '1' ? videos[0] : { videos });
    }

    if (type === 'image' && data.photos && data.photos.length > 0) {
      const photos = data.photos.map((photo: any) => ({
        url: resolution === 'mobile' ? photo.src.large : (photo.src.large2x || photo.src.large),
        photographer: photo.photographer,
        id: photo.id,
        avg_color: photo.avg_color
      }));

      return NextResponse.json(per_page === '1' ? photos[0] : { photos });
    }

    return NextResponse.json({ error: 'No iconic matches found' }, { status: 404 });

  } catch (error) {
    console.error('Visual Engine Error:', error);
    return NextResponse.json({ error: 'Synchronizing global visual manifest...' }, { status: 500 });
  }
}
