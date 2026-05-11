import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET batch dates for a specific package
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const packageId = searchParams.get("package_id");

  if (!packageId) {
    return NextResponse.json({ error: "package_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("batch_dates")
    .select("*")
    .eq("package_id", packageId)
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST create batch date (admin only)
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.package_id || !body.start_date || !body.end_date) {
    return NextResponse.json(
      { error: "package_id, start_date, and end_date are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("batch_dates")
    .insert([{
      package_id: body.package_id,
      start_date: body.start_date,
      end_date: body.end_date,
      status: body.status || "available",
      slots_total: body.slots_total ?? 20,
      slots_booked: body.slots_booked ?? 0,
      price_override: body.price_override || null,
      notes: body.notes || null,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT update batch date (admin only)
export async function PUT(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("batch_dates")
    .update({
      start_date: body.start_date,
      end_date: body.end_date,
      status: body.status,
      slots_total: body.slots_total,
      slots_booked: body.slots_booked,
      price_override: body.price_override,
      notes: body.notes,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE batch date (admin only)
export async function DELETE(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("batch_dates")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
