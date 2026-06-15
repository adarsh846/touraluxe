/**
 * ═══ SINGLETON PACKAGE MANIFEST CACHE ═══
 *
 * Mirrors the settingsCache pattern to deduplicate and pre-warm the full
 * package manifest that powers the Search/Discovery modal.
 *
 * Strategy (Apple/Google idle-prefetch pattern):
 *   1. On page idle (requestIdleCallback), silently pre-fetch the manifest
 *      so it is fully ready BEFORE the user opens the modal.
 *   2. All concurrent callers share one in-flight Promise — no duplicate DB hits.
 *   3. Resolved data stays in module memory for the session lifetime.
 *
 * This eliminates the cold-start DB round-trip that previously competed with
 * the GSAP modal entrance animation.
 */

import { supabase } from "@/lib/supabase";

export interface PackageManifestItem {
  id: string;
  title: string;
  location: string;
  image?: string;
  price?: string;
  category?: string | string[];
  is_published?: boolean;
  [key: string]: unknown;
}

export interface DestinationManifestItem {
  name: string;
  cover_image: string;
}

// ── Package manifest (used by useDiscovery / BookingContent) ──
let cachedPackages: PackageManifestItem[] | null = null;
let inflightPackages: Promise<PackageManifestItem[]> | null = null;

export function getPackageManifest(): Promise<PackageManifestItem[]> {
  if (cachedPackages) return Promise.resolve(cachedPackages);
  if (inflightPackages) return inflightPackages;

  // Wrap in Promise.resolve to get a true Promise (Supabase returns PromiseLike)
  inflightPackages = Promise.resolve(
    supabase.from("packages").select("*").eq("is_published", true)
  ).then(({ data }) => {
    const result = (data ?? []) as PackageManifestItem[];
    cachedPackages = result;
    inflightPackages = null;
    return result;
  }).catch((): PackageManifestItem[] => {
    inflightPackages = null;
    return [];
  });

  return inflightPackages;
}

// ── Destination visual manifest (used by BookingContent background images) ──
let cachedDestinations: Record<string, string> | null = null;
let inflightDestinations: Promise<Record<string, string>> | null = null;

export function getDestinationVisualManifest(): Promise<Record<string, string>> {
  if (cachedDestinations) return Promise.resolve(cachedDestinations);
  if (inflightDestinations) return inflightDestinations;

  // Wrap in Promise.resolve to get a true Promise (Supabase returns PromiseLike)
  inflightDestinations = Promise.resolve(
    supabase.from("destinations").select("name, cover_image").eq("is_published", true)
  ).then(({ data }) => {
    const manifest: Record<string, string> = {};
    (data ?? []).forEach((d: DestinationManifestItem) => {
      if (d.name && d.cover_image) {
        manifest[d.name.toUpperCase().trim()] = d.cover_image;
      }
    });
    cachedDestinations = manifest;
    inflightDestinations = null;
    return manifest;
  }).catch((): Record<string, string> => {
    inflightDestinations = null;
    return {};
  });

  return inflightDestinations;
}

/**
 * Warm both caches during page idle time.
 * Called once from PwaRegister after page hydration.
 */
export function prefetchManifests() {
  const run = () => {
    getPackageManifest();
    getDestinationVisualManifest();
  };

  if (typeof window === "undefined") return;

  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: object) => void })
      .requestIdleCallback(run, { timeout: 3000 });
  } else {
    // Safari fallback — fire after paint settles
    setTimeout(run, 1500);
  }
}

export function invalidateManifestCache() {
  cachedPackages = null;
  inflightPackages = null;
  cachedDestinations = null;
  inflightDestinations = null;
}

export function getCachedPackagesSync(): PackageManifestItem[] | null {
  return cachedPackages;
}

export function getCachedDestinationsSync(): Record<string, string> | null {
  return cachedDestinations;
}
