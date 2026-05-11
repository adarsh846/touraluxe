"use client";

import { useState, useEffect, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { Magnetic } from "@/components/Magnetic";
import { FilterBar, type FilterState } from "@/components/FilterBar";
import { PackageCard } from "@/components/PackageCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { useBooking } from "@/components/BookingProvider";
import { DestinationNavbar } from "@/components/DestinationNavbar";
import type { Destination, Package } from "@/lib/supabase";

import { DestinationDetailContent } from "@/components/modals/DestinationDetailContent";

export default function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <DestinationNavbar />
      <DestinationDetailContent slug={slug} />
    </div>
  );
}
