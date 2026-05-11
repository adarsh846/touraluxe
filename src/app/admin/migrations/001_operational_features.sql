-- ══════════════════════════════════════════════════════════════
-- TouraLuxe: Operational Features Migration
-- Sprint 1: Data Foundation
-- ══════════════════════════════════════════════════════════════

-- ─── PACKAGES TABLE: New Columns ───

-- Pricing & Promotions
ALTER TABLE packages ADD COLUMN IF NOT EXISTS original_price TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Logistics
ALTER TABLE packages ADD COLUMN IF NOT EXISTS exclusions TEXT[] DEFAULT '{}';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS route_start TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS route_end TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'Easy';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS min_group_size INTEGER DEFAULT 1;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_group_size INTEGER DEFAULT 20;

-- Content Enrichment
ALTER TABLE packages ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Taxonomy
ALTER TABLE packages ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS trip_type TEXT DEFAULT 'group';

-- ─── DESTINATIONS TABLE ───

CREATE TABLE IF NOT EXISTS destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  region TEXT,
  country TEXT,
  cover_image TEXT,
  description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  faq JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{}',
  is_international BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 99,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── BATCH DATES TABLE ───

CREATE TABLE IF NOT EXISTS batch_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'filling_fast', 'sold_out', 'completed')),
  slots_total INTEGER DEFAULT 20,
  slots_booked INTEGER DEFAULT 0,
  price_override TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── INDEXES ───

CREATE INDEX IF NOT EXISTS idx_packages_destination ON packages(destination);
CREATE INDEX IF NOT EXISTS idx_packages_region ON packages(region);
CREATE INDEX IF NOT EXISTS idx_packages_trip_type ON packages(trip_type);
CREATE INDEX IF NOT EXISTS idx_packages_badge ON packages(badge);
CREATE INDEX IF NOT EXISTS idx_packages_is_featured ON packages(is_featured);
CREATE INDEX IF NOT EXISTS idx_batch_dates_package_id ON batch_dates(package_id);
CREATE INDEX IF NOT EXISTS idx_batch_dates_start_date ON batch_dates(start_date);
CREATE INDEX IF NOT EXISTS idx_batch_dates_status ON batch_dates(status);
CREATE INDEX IF NOT EXISTS idx_destinations_slug ON destinations(slug);
CREATE INDEX IF NOT EXISTS idx_destinations_region ON destinations(region);

-- ─── RLS POLICIES ───

-- Destinations: Public read, admin write
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read destinations" ON destinations
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access destinations" ON destinations
  FOR ALL USING (true);

-- Batch Dates: Public read, admin write
ALTER TABLE batch_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read batch_dates" ON batch_dates
  FOR SELECT USING (true);

CREATE POLICY "Admin full access batch_dates" ON batch_dates
  FOR ALL USING (true);
