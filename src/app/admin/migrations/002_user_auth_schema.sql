-- ═════════════════════════════════════════════════════════════════════════════
-- 🚀 MIGRATION: 002_USER_AUTH_SCHEMA
-- Description: Creates the public.profiles table, links bookings to user accounts, 
--              enables Row Level Security (RLS), and sets up automated auth triggers.
-- ═════════════════════════════════════════════════════════════════════════════

-- 1. Create public profiles table linked directly to Supabase Auth Users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  departure_city TEXT,
  dietary_preferences TEXT,
  travel_class TEXT DEFAULT 'Economy', -- Economy, Premium Economy, Business, First
  date_of_birth DATE,
  gender TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  nationality TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  sovereign_notes TEXT
);

-- Enable Row-Level Security (RLS) on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- Create secure, targeted RLS policies
CREATE POLICY "Users can view their own profile." 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);


-- 2. Enhance existing Bookings table to link to Auth Users
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable Row-Level Security (RLS) on Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own bookings." ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings." ON public.bookings;

-- Create policies for private, validated booking retrieval and creation
CREATE POLICY "Users can view their own bookings." 
  ON public.bookings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings." 
  ON public.bookings FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);


-- 3. Automate Profile Creation on Sign-up via Postgres Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to ensure active tracking
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Dynamic column extensions for travel industry specifications (safe for existing tables)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
    ALTER TABLE public.profiles ADD COLUMN gender TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'passport_number') THEN
    ALTER TABLE public.profiles ADD COLUMN passport_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'passport_expiry') THEN
    ALTER TABLE public.profiles ADD COLUMN passport_expiry DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nationality') THEN
    ALTER TABLE public.profiles ADD COLUMN nationality TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact_name') THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact_phone') THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact_phone TEXT;
  END IF;
END $$;

