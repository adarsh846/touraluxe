import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
