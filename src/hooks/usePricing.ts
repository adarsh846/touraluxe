/**
 * ═══ SOVEREIGN GLOBAL SETTINGS ENGINE ═══
 *
 * Single source of truth for ALL global configurations:
 * - Pricing (Tax, Currency)
 * - Discovery Taxonomy (Trip Types, Difficulty Levels)
 */

"use client";

import { useEffect, useState, useCallback } from "react";

export interface GlobalSettings {
  tax_percentage: string;
  currency_symbol: string;
  available_trip_types: string;
  available_difficulties: string;
}

export interface ComputedPrice {
  finalTotal: number;
  originalTotal: number;
  hasSavings: boolean;
  discountPercent: number;
  symbol: string;
  taxRate: number;
  isInclusive: boolean;
  shouldAddTaxLabel: boolean;
  formattedFinal: string;
  formattedOriginal: string;
  taxLabel: string;
}

export function useGlobalSettings() {
  const [settings, setSettings] = useState<GlobalSettings>({
    tax_percentage: "0",
    currency_symbol: "",
    available_trip_types: "Group, Private, Custom",
    available_difficulties: "Easy, Moderate, Challenging",
  });

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(r => r.ok ? r.json() : {})
      .then((data: any) => {
        setSettings({
          tax_percentage: data.tax_percentage || "0",
          currency_symbol: data.currency_symbol || "",
          available_trip_types: data.available_trip_types || "Group, Private, Custom",
          available_difficulties: data.available_difficulties || "Easy, Moderate, Challenging",
        });
      });
  }, []);

  const computePrice = useCallback(
    (pkg: any, adultCount: number = 1, childCount: number = 0, infantCount: number = 0) => {
      const taxRate = parseFloat(settings.tax_percentage || "0");
      const symbol = settings.currency_symbol || pkg?.currency || "₹";

      if (!pkg?.price) {
        return {
          finalTotal: 0, originalTotal: 0, hasSavings: false, discountPercent: 0,
          symbol, taxRate, isInclusive: false, shouldAddTaxLabel: false,
          formattedFinal: `${symbol}0`, formattedOriginal: "", taxLabel: "",
          perAdultFinal: 0, perChildFinal: 0, perInfantFinal: 0,
          breakdown: { subtotal: 0, taxAmount: 0, baseAmount: 0 }
        };
      }

      // ── PARSE RAW INPUTS ──
      const base = parseInt(String(pkg.price).replace(/[^0-9]/g, "")) || 0;
      
      // No hardcoded fallbacks: Default to full adult rate if specific tier pricing is missing
      const childBase = pkg.child_price && pkg.child_price !== "0"
        ? (parseInt(String(pkg.child_price).replace(/[^0-9]/g, "")) || 0)
        : base;
        
      const infantBase = pkg.infant_price && pkg.infant_price !== "0"
        ? (parseInt(String(pkg.infant_price).replace(/[^0-9]/g, "")) || 0)
        : base;

      const originalBase = parseInt(String(pkg.original_price || "0").replace(/[^0-9]/g, "")) || 0;

    // ── RESILIENT STATUS CHECK ──
    const taxStatus = String(pkg?.tax_status || "").toLowerCase();
    const isExclusive = taxStatus.includes("exclusive");
    const isInclusive = taxStatus.includes("inclusive") || !isExclusive;

    // ── MASTER FISCAL RULE (Split Architecture) ──
    const landAdult = isExclusive && taxRate > 0 ? Math.round(base + (base * taxRate) / 100) : base;
    const landChild = isExclusive && taxRate > 0 ? Math.round(childBase + (childBase * taxRate) / 100) : childBase;
    const landInfant = isExclusive && taxRate > 0 ? Math.round(infantBase + (infantBase * taxRate) / 100) : infantBase;
    const landOriginal = isExclusive && taxRate > 0 ? Math.round(originalBase + (originalBase * taxRate) / 100) : originalBase;

    // ── AIRFARE COMPONENT (Sovereign Pass-Through) ──
    // ── Aviation Anchor Recovery ──
    const getAviationAnchor = () => {
      try {
        const anchor = pkg.itinerary_url;
        if (anchor && anchor.includes('{')) {
          return JSON.parse(anchor);
        }
      } catch (e) { return null; }
      return null;
    };
    const anchor = getAviationAnchor();

    // Tiered Aviation Fiscal Logic (Sovereign Model - No Hard-Coded Fallbacks)
    const currentStatus = anchor?.status || pkg.flights_status;
    const isExcluded = currentStatus === 'excluded';
    
    // Priority: Anchor Estimate -> Database Column -> Default 0
    const rawAdultEstimate = anchor?.estimate || pkg.flight_price_estimate || "0";
    const flightAdult = isExcluded ? 0 : (parseInt(String(rawAdultEstimate).replace(/[^0-9]/g, "")) || 0);
    
    // Support for both legacy columns and new nested JSON architecture
    const rawChildFare = anchor?.child_fare || pkg.flight_price_child || (pkg.flight_segments && !Array.isArray(pkg.flight_segments) ? (pkg.flight_segments as any).child_fare : "");
    const rawInfantFare = anchor?.infant_fare || pkg.flight_price_infant || (pkg.flight_segments && !Array.isArray(pkg.flight_segments) ? (pkg.flight_segments as any).infant_fare : "");

    const flightChild = isExcluded ? 0 : (rawChildFare ? parseInt(String(rawChildFare).replace(/[^0-9]/g, "")) : flightAdult);
    const flightInfant = isExcluded ? 0 : (rawInfantFare ? parseInt(String(rawInfantFare).replace(/[^0-9]/g, "")) : flightAdult);

    const perAdultFinal = landAdult + flightAdult;
    const perChildFinal = landChild + flightChild;
    const perInfantFinal = landInfant + flightInfant;
    const perOriginalFinal = landOriginal + (flightAdult > 0 ? flightAdult : 0);

      // The "Unified Final Total" for a booking
      const finalTotal = (perAdultFinal * adultCount) + (perChildFinal * childCount) + (perInfantFinal * infantCount);
      
      const hasSavings = perOriginalFinal > 0 && perOriginalFinal > perAdultFinal;
      const discountPercent = hasSavings ? Math.round(((perOriginalFinal - perAdultFinal) / perOriginalFinal) * 100) : 0;

      // In this unified model, the customer always sees a price that includes tax
      const flightTypeLabel = pkg.flight_type || (pkg.flights_status === 'included' ? "RT Flights" : "Flight Est.");
      const flightContext = pkg.flights_status === 'included' 
        ? ` & ${flightTypeLabel}` 
        : (flightAdult > 0 || pkg.flights_status === 'on_request')
          ? ` + ${flightTypeLabel}` 
          : "";
      const taxLabel = `Incl. Tax${flightContext}`;
      const isEstimate = flightAdult > 0 || pkg.flights_status === 'on_request';

      return {
        finalTotal,
        perAdultFinal,
        perChildFinal,
        perInfantFinal,
        originalTotal: perOriginalFinal,
        hasSavings,
        discountPercent,
        symbol,
        taxRate,
        isInclusive,
        shouldAddTaxLabel: true,
        formattedFinal: `${isEstimate ? "From " : ""}${symbol}${finalTotal.toLocaleString("en-IN")}`,
        formattedOriginal: hasSavings ? `${symbol}${perOriginalFinal.toLocaleString("en-IN")}` : "",
        taxLabel,
        breakdown: {
          landBase: isInclusive 
            ? Math.round((base * adultCount) / (1 + taxRate/100))
            : base * adultCount,
          taxAmount: isInclusive
            ? Math.round(base * adultCount - (base * adultCount) / (1 + taxRate/100))
            : (landAdult - base) * adultCount,
          flightNet: (flightAdult * adultCount) + (flightChild * childCount) + (flightInfant * infantCount),
          flight_segments: anchor?.segments || (Array.isArray(pkg.flight_segments) ? pkg.flight_segments : (pkg.flight_segments as any)?.segments || []),
          total: perAdultFinal
        }
      };
    },
    [settings]
  );

  return { computePrice, settings };
}

export const usePricing = useGlobalSettings;
