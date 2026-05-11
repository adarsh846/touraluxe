import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Destinations — TouraLuxe | Curated Travel Experiences",
  description: "Explore our curated collection of extraordinary destinations. From the peaks of the Himalayas to tropical beaches, discover journeys crafted for the discerning traveler.",
};

export default function DestinationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
