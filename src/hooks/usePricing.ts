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
    const destination = String(pkg?.location || "").toLowerCase();
    const isExclusive = taxStatus.includes("exclusive");
    
    // Sovereign Fallback: Certain destinations are ALWAYS inclusive by business rule
    const isSovereignInclusive = destination.includes("maldives") || destination.includes("bali");
    const isInclusive = taxStatus.includes("inclusive") || isSovereignInclusive || !isExclusive;

    // ── MASTER FISCAL RULE (Split Architecture) ──
    const landAdult = isExclusive && taxRate > 0 ? Math.round(base + (base * taxRate) / 100) : base;
    const landChild = isExclusive && taxRate > 0 ? Math.round(childBase + (childBase * taxRate) / 100) : childBase;
    const landInfant = isExclusive && taxRate > 0 ? Math.round(infantBase + (infantBase * taxRate) / 100) : infantBase;
    const landOriginal = isExclusive && taxRate > 0 ? Math.round(originalBase + (originalBase * taxRate) / 100) : originalBase;

    // ── AIRFARE COMPONENT (Sovereign Pass-Through) ──
    // We treat all entered airfare as 'Final Taxed' amounts to prevent double taxation.
    const flightEstimate = parseInt(String(pkg.flight_price_estimate || "0").replace(/[^0-9]/g, "")) || 0;
    const perAdultFinal = landAdult + flightEstimate;
    const perChildFinal = landChild + flightEstimate;
    const perInfantFinal = landInfant + flightEstimate;
    const perOriginalFinal = landOriginal + (flightEstimate > 0 ? flightEstimate : 0);

      // The "Unified Final Total" for a booking
      const finalTotal = (perAdultFinal * adultCount) + (perChildFinal * childCount) + (perInfantFinal * infantCount);
      
      const hasSavings = perOriginalFinal > 0 && perOriginalFinal > perAdultFinal;
      const discountPercent = hasSavings ? Math.round(((perOriginalFinal - perAdultFinal) / perOriginalFinal) * 100) : 0;

      // In this unified model, the customer always sees a price that includes tax
      const flightContext = pkg.flights_status === 'included' 
        ? " & Airfare" 
        : flightEstimate > 0 || pkg.flights_status === 'on_request'
          ? " + Flight Est." 
          : "";
      const taxLabel = `Incl. Tax${flightContext}`;
      const isEstimate = flightEstimate > 0 || pkg.flights_status === 'on_request';

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
          flightNet: flightEstimate * adultCount,
          total: perAdultFinal
        }
      };
    },
    [settings]
  );

  return { computePrice, settings };
}

export const usePricing = useGlobalSettings;
