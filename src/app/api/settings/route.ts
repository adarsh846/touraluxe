import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// site_settings table should have: id (uuid), key (text, unique), value (text)

export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform into a key-value object
  const settings = data.reduce((acc: Record<string, any>, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json(); // expected: { key: string, value: string }
  const { key, value } = body;

  if (!key) {
    return NextResponse.json({ error: "Key is required" }, { status: 400 });
  }

  // Use upsert logic
  const { data, error } = await supabase
    .from("site_settings")
    .upsert({ key, value }, { onConflict: 'key' })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
