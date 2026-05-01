import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "vpaidlsxenpohrhsxfpa.supabase.co",
      },
    ],
  },

  // Aggressive cache headers for static sequence assets
  async headers() {
    return [
      {
        // JPEG sequence frames — immutable, cache for 1 year
        source: "/assets/cave-sequence-60/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/cave-sequence-mobile-60/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
