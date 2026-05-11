import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  
  // Try to fetch destination for SEO
  try {
    // In a real app we'd fetch this from the API or direct DB call here
    // For now we'll return generic metadata that gets overridden by the client
    return {
      title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Tour Packages — TouraLuxe`,
      description: `Explore our curated collection of ${slug} tour packages. Crafted for the discerning traveler.`,
    };
  } catch (error) {
    return {
      title: "Destination — TouraLuxe",
    };
  }
}

export default function DestinationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
