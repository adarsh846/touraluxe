import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
};
