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
      const childBase = parseInt(String(pkg.child_price || "0").replace(/[^0-9]/g, "")) || 0;
      const infantBase = parseInt(String(pkg.infant_price || "0").replace(/[^0-9]/g, "")) || 0;
      const originalBase = parseInt(String(pkg.original_price || "0").replace(/[^0-9]/g, "")) || 0;

    const isExclusive = pkg?.tax_status === "Exclusive of Taxes";
    const isInclusive = pkg?.tax_status === "Inclusive of Taxes";

    // ── MASTER FISCAL RULE ──
    // If Exclusive: The system ADDS the global tax percentage to the entered base.
    // If Inclusive: The system treats the entered base as the final, all-in price.
    const perAdultFinal = isExclusive && taxRate > 0 ? Math.round(base + (base * taxRate) / 100) : base;
    const perChildFinal = isExclusive && taxRate > 0 ? Math.round(childBase + (childBase * taxRate) / 100) : childBase;
    const perInfantFinal = isExclusive && taxRate > 0 ? Math.round(infantBase + (infantBase * taxRate) / 100) : infantBase;
    const perOriginalFinal = isExclusive && taxRate > 0 ? Math.round(originalBase + (originalBase * taxRate) / 100) : originalBase;

      // The "Unified Final Total" for a booking
      const finalTotal = (perAdultFinal * adultCount) + (perChildFinal * childCount) + (perInfantFinal * infantCount);
      
      const hasSavings = perOriginalFinal > 0 && perOriginalFinal > perAdultFinal;
      const discountPercent = hasSavings ? Math.round(((perOriginalFinal - perAdultFinal) / perOriginalFinal) * 100) : 0;

      // In this unified model, the customer always sees a price that includes tax
      const taxLabel = "incl. tax";

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
        formattedFinal: `${symbol}${perAdultFinal.toLocaleString("en-IN")}`,
        formattedOriginal: hasSavings ? `${symbol}${perOriginalFinal.toLocaleString("en-IN")}` : "",
        taxLabel,
        breakdown: {
          subtotal: finalTotal,
          taxAmount: Math.round(finalTotal - (finalTotal / (1 + taxRate/100))),
          baseAmount: Math.round(finalTotal / (1 + taxRate/100))
        }
      };
    },
    [settings]
  );

  return { computePrice, settings };
}

export const usePricing = useGlobalSettings;
