import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Force dynamic behavior for Vercel build stability
export const dynamic = "force-dynamic";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const adminToken = req.headers.get("x-admin-token");
    if (!adminToken || adminToken !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Bookings Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    /*
      CREATE TABLE bookings (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        package_id TEXT NOT NULL,
        package_name TEXT NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        traveler_count INTEGER DEFAULT 1,
        special_requests TEXT,
        total_amount NUMERIC(10, 2),
        status TEXT DEFAULT 'pending'
      );
    */
    const body = await req.json();
    const { 
      packageId, 
      packageName, 
      travelerCount, 
      specialRequests, 
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      bookingSource 
    } = body;

    // 1. Validate the data
    if (!packageId || !packageName || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Insert into Supabase
    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          package_id: packageId,
          package_name: packageName,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          traveler_count: travelerCount,
          special_requests: specialRequests,
          total_amount: totalAmount,
          booking_source: bookingSource || "GENERAL_INQUIRY",
          status: "pending",
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const adminToken = req.headers.get("x-admin-token");
    if (!adminToken || adminToken !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, internal_notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({ status, internal_notes })
      .eq("id", id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Update Booking Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
