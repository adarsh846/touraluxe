import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET single package
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PUT update package (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabase
    .from("packages")
    .update({
      title: body.title,
      location: body.location,
      image: body.image,
      price: body.price,
      duration: body.duration,
      guests: body.guests,
      season: body.season,
      tagline: body.tagline,
      description: body.description,
      highlights: body.highlights,
      category: body.category,
      is_published: body.is_published,
      sort_order: body.sort_order,
      tax_status: body.tax_status,
      currency: body.currency,
      child_price: body.child_price,
      infant_price: body.infant_price,
      inclusions: body.inclusions,
      itinerary: body.itinerary,

      // ── New Operational Fields ──
      original_price: body.original_price ?? null,
      badge: body.badge ?? null,
      is_featured: body.is_featured ?? false,
      exclusions: body.exclusions ?? [],
      route_start: body.route_start ?? null,
      route_end: body.route_end ?? null,
      difficulty_level: body.difficulty_level ?? "Easy",
      min_group_size: body.min_group_size ?? 1,
      max_group_size: body.max_group_size ?? 20,
      gallery: body.gallery ?? [],
      faq: body.faq ?? [],
      tags: body.tags ?? [],
      destination: body.destination ?? null,
      region: body.region ?? null,
      trip_type: body.trip_type ?? "group",
      itinerary_url: body.itinerary_url ?? null,
      flights_status: body.flights_status ?? "excluded",
      flight_price_estimate: body.flight_price_estimate ?? null,
      departure_cities: body.departure_cities ?? [],
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE package (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase.from("packages").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
