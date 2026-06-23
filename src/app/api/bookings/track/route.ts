import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    const email = searchParams.get("email")?.toLowerCase().trim() || "";
    const phone = searchParams.get("phone")?.trim() || "";

    if (!id) {
      return NextResponse.json({ error: "Booking Reference ID is required." }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ error: "Verification detail (Email or Phone Number) is required." }, { status: 400 });
    }

    // Fetch candidate bookings by email or phone to allow prefix matching on UUIDs
    let bookings: any[] = [];
    
    if (email) {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_email", email);
      if (data) bookings = data;
    }
    
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const suffix = cleanPhone.slice(-7);
      if (suffix) {
        const { data } = await supabase
          .from("bookings")
          .select("*")
          .ilike("customer_phone", `%${suffix}%`);
        if (data) {
          // Merge items uniquely
          bookings = [
            ...bookings,
            ...data.filter((d: any) => !bookings.some(b => b.id === d.id))
          ];
        }
      }
    }

    // Match the candidate booking using the prefix or full UUID
    const normalizedInputId = id.toLowerCase().replace(/-/g, "").trim();
    const booking = bookings.find((b: any) => {
      const normalizedDbId = b.id.toLowerCase().replace(/-/g, "");
      return normalizedDbId.startsWith(normalizedInputId);
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking reference not found. Please check your Reference ID." }, { status: 404 });
    }

    // Verification check
    const dbEmail = booking.customer_email?.toLowerCase().trim() || "";
    const dbPhone = booking.customer_phone || "";

    // Normalize phone numbers for flexible comparison (strip all non-digits)
    const normalizeDigits = (str: string) => str.replace(/\D/g, "");
    const normalizedInputPhone = normalizeDigits(phone);
    const normalizedDbPhone = normalizeDigits(dbPhone);

    const isEmailMatched = email && dbEmail === email;
    const isPhoneMatched = normalizedInputPhone && (
      normalizedDbPhone.includes(normalizedInputPhone) || 
      normalizedInputPhone.includes(normalizedDbPhone)
    );

    if (!isEmailMatched && !isPhoneMatched) {
      return NextResponse.json({ error: "Verification failed. Incorrect email or phone number associated with this booking." }, { status: 401 });
    }

    // Return sanitized booking details
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        created_at: booking.created_at,
        package_id: booking.package_id,
        package_name: booking.package_name,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        traveler_count: booking.traveler_count,
        special_requests: booking.special_requests,
        total_amount: booking.total_amount,
        status: booking.status || "pending",
        booking_source: booking.booking_source
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Booking Tracking Error:", error);
    return NextResponse.json({ error: "Failed to retrieve tracking information due to an internal server error." }, { status: 500 });
  }
}
