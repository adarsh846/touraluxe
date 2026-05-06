import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET all published packages (public) or all packages (admin)
export async function GET(req: NextRequest) {
  console.log("DEBUG: Admin password loaded?", !!process.env.ADMIN_PASSWORD);
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
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
