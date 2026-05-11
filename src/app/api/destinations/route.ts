import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET all destinations (public: published only, admin: all)
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const isAdmin = token === process.env.ADMIN_PASSWORD;

  if (token && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("destinations")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!isAdmin) {
    query = query.eq("is_published", true);
  }

  // Filter by region or type
  const { searchParams } = new URL(req.url);
  
  const region = searchParams.get("region");
  if (region) {
    query = query.eq("region", region);
  }

  const international = searchParams.get("international");
  if (international === "true") {
    query = query.eq("is_international", true);
  } else if (international === "false") {
    query = query.eq("is_international", false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST create new destination (admin only)
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Auto-generate slug from name if not provided
  const slug = body.slug || body.name?.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const { data, error } = await supabase
    .from("destinations")
    .insert([{
      name: body.name,
      slug,
      region: body.region || null,
      country: body.country || null,
      cover_image: body.cover_image || null,
      description: body.description || null,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      faq: body.faq || [],
      stats: body.stats || {},
      is_international: body.is_international ?? true,
      sort_order: body.sort_order ?? 99,
      is_published: body.is_published ?? true,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
