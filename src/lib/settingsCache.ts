/**
 * ═══ SINGLETON SETTINGS CACHE ═══
 *
 * Deduplicates concurrent `/api/settings` fetches across all consumers
 * (Providers, BookingContent, usePricing) by sharing a single in-flight Promise.
 * Subsequent calls within the same session resolve from the cached result.
 *
 * Pattern: Google request deduplication (same as Firebase SDK's internal cache).
 */

export interface SiteSettings {
  tax_percentage?: string;
  currency_symbol?: string;
  whatsapp_number?: string;
  discovery_default_image?: string;
  available_trip_types?: string;
  available_difficulties?: string;
  [key: string]: string | undefined;
}

let cachedSettings: SiteSettings | null = null;
let inflightRequest: Promise<SiteSettings> | null = null;

/**
 * Fetch site settings with deduplication.
 * All concurrent callers share the same in-flight request.
 * Once resolved, the result is cached in memory for the session lifetime.
 */
export async function getSettings(): Promise<SiteSettings> {
  // 1. Return from in-memory cache if already fetched
  if (cachedSettings) return cachedSettings;

  // 2. Reuse the in-flight Promise if a fetch is already running
  if (inflightRequest) return inflightRequest;

  // 3. Initiate a new fetch and share it
  inflightRequest = fetch("/api/settings", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : {}))
    .then((data: SiteSettings) => {
      cachedSettings = data;
      inflightRequest = null;
      return data;
    })
    .catch(() => {
      inflightRequest = null;
      return {};
    });

  return inflightRequest;
}

/**
 * Invalidate the cache (e.g. after an admin settings update via Supabase realtime).
 */
export function invalidateSettingsCache() {
  cachedSettings = null;
  inflightRequest = null;
}

/**
 * Get current cached settings synchronously.
 */
export function getCachedSettingsSync(): SiteSettings | null {
  return cachedSettings;
}
