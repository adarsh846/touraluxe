import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET all published packages (public) or all packages (admin)
// Supports filtering via query params for destination listing pages
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const isAdmin = token === process.env.ADMIN_PASSWORD;

  // If a token was provided but it's wrong, explicitly deny access
  if (token && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("packages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!isAdmin) {
    query = query.eq("is_published", true);
  }

  // ── Filter Parameters ──
  const { searchParams } = new URL(req.url);

  const destination = searchParams.get("destination");
  if (destination) {
    query = query.eq("destination", destination);
  }

  const region = searchParams.get("region");
  if (region) {
    query = query.eq("region", region);
  }

  const tripType = searchParams.get("trip_type");
  if (tripType) {
    query = query.eq("trip_type", tripType);
  }

  const category = searchParams.get("category");
  if (category) {
    query = query.contains("category", [category]);
  }

  const badge = searchParams.get("badge");
  if (badge) {
    query = query.eq("badge", badge);
  }

  const featured = searchParams.get("featured");
  if (featured === "true") {
    query = query.eq("is_featured", true);
  }

  const difficulty = searchParams.get("difficulty");
  if (difficulty) {
    query = query.eq("difficulty_level", difficulty);
  }

  // Pagination support
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST create new package (admin only)
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from("packages")
    .insert([
      {
        title: body.title,
        location: body.location,
        image: body.image || "/assets/placeholder.webp",
        price: body.price,
        duration: body.duration,
        guests: body.guests,
        season: body.season,
        tagline: body.tagline,
        description: body.description,
        highlights: body.highlights || [],
        category: body.category || ["Custom Journeys"],
        is_published: body.is_published ?? false,
        sort_order: body.sort_order ?? 99,
        tax_status: body.tax_status || "Inclusive of Taxes",
        currency: body.currency || "₹",
        child_price: body.child_price,
        infant_price: body.infant_price,
        inclusions: body.inclusions || [],
        itinerary: body.itinerary || [],

        // ── New Operational Fields ──
        original_price: body.original_price || null,
        badge: body.badge || null,
        is_featured: body.is_featured ?? false,
        exclusions: body.exclusions || [],
        route_start: body.route_start || null,
        route_end: body.route_end || null,
        difficulty_level: body.difficulty_level || "Easy",
        min_group_size: body.min_group_size ?? 1,
        max_group_size: body.max_group_size != null ? Math.min(20, Math.max(1, Number(body.max_group_size))) : null,
        gallery: body.gallery || [],
        faq: body.faq || [],
        tags: body.tags || [],
        destination: body.destination || null,
        region: body.region || null,
        trip_type: body.trip_type || "group",
        itinerary_url: body.itinerary_url ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
