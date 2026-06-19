import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

// Pass multiTab: false to disable cross-tab synchronization locks.
// This completely prevents the notorious "Lock stolen" AbortError in Next.js React Strict Mode.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    multiTab: false
  } as any
});

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

export type Package = {
  id: string;
  title: string;
  location: string;
  image: string;
  price: string;
  duration: string;
  guests: string;
  season: string;
  tagline: string;
  description: string;
  highlights: string[];
  inclusions?: string[];
  itinerary?: { day: string; title: string; description: string }[];
  category: string[];
  is_published: boolean;
  sort_order: number;
  tax_status?: string;
  currency?: string;
  child_price?: string;
  infant_price?: string;
  created_at: string;
  updated_at: string;

  // ── Operational Fields (Sprint 1) ──
  original_price?: string;
  badge?: string;
  is_featured?: boolean;
  exclusions?: string[];
  route_start?: string;
  route_end?: string;
  difficulty_level?: string;
  min_group_size?: number;
  max_group_size?: number;
  gallery?: string[];
  faq?: { question: string; answer: string }[];
  tags?: string[];
  destination?: string;
  region?: string;
  trip_type?: string;
  itinerary_url?: string;
  flights_status?: 'included' | 'excluded' | 'on_request';
  flight_price_estimate?: string;
  is_airfare_taxable?: boolean;
  departure_cities?: string[];
  destinations_covered?: string;
};

export type Destination = {
  id: string;
  name: string;
  slug: string;
  region?: string;
  country?: string;
  cover_image?: string;
  video_url?: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  faq?: { question: string; answer: string }[];
  stats?: { packages?: number; starting_price?: number };
  is_international: boolean;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type BatchDate = {
  id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  status: 'available' | 'filling_fast' | 'sold_out' | 'completed';
  slots_total: number;
  slots_booked: number;
  price_override?: string;
  notes?: string;
  created_at: string;
};
