import type { Dispatch, SetStateAction } from "react";

export interface PackageFormState {
  title: string;
  location: string;
  image: string;
  price: string | number;
  child_price: string | number;
  infant_price: string | number;
  nights: string;
  days: string;
  guests: string;
  tagline: string;
  description: string;
  destinations_covered: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{ day: string; title: string; description: string; image: string }>;
  faq: Array<{ question: string; answer: string }>;
  gallery: string[];
  category: string[];
  is_published: boolean;
  sort_order: number;
  tax_status: string;
  tax_percentage: string;
  currency: string;
  season: string;
  original_price: string | number;
  badge: string;
  is_featured: boolean;
  route_start: string;
  route_end: string;
  difficulty_level: string;
  min_group_size: number;
  max_group_size: number | null;
  tags: string[];
  destination: string;
  region: string;
  trip_type: string[];
  itinerary_url: string;
  flights_status: string;
  flight_price_estimate: string;
  departure_cities: string[];
  flight_type: string;
  flight_segments: Array<{ label: string; price: string }>;
  flight_price_child: string;
  flight_price_infant: string;
  tiers: Array<{
    name: string;
    price_grid: Array<{ pax: string; price: string }>;
    hotels: Array<{ city: string; hotel: string }>;
    pdf_url: string;
  }>;
  transports: Array<{ pax: string; vehicle: string }>;
  pdf_url: string;
  pricing_note: string;
  flight_terms?: string;
}

export interface PanelProps {
  form: PackageFormState;
  setForm: Dispatch<SetStateAction<PackageFormState>>;
  setIsDirty: (dirty: boolean) => void;
  mode?: string;
}
