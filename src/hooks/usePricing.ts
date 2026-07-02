/**
 * ═══ SOVEREIGN GLOBAL SETTINGS ENGINE ═══
 *
 * Single source of truth for ALL global configurations:
 * - Pricing (Tax, Currency)
 * - Discovery Taxonomy (Trip Types, Difficulty Levels)
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getSettings, invalidateSettingsCache } from "@/lib/settingsCache";

export { invalidateSettingsCache };

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
    getSettings()
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
    (pkg: any, adultCount: number = 1, childCount: number = 0, infantCount: number = 0, selectedTierName?: string, selectedAddons: string[] = []) => {
      // ── Aviation Anchor Recovery ──
      const getAviationAnchor = () => {
        try {
          const anchor = pkg?.itinerary_url;
          if (anchor && anchor.includes('{')) {
            return JSON.parse(anchor);
          }
        } catch (e) { return null; }
        return null;
      };
      const anchor = getAviationAnchor();

      // ── SAFE INT PARSER — never returns NaN ──
      const safeInt = (val: any): number => {
        const n = parseInt(String(val ?? "").replace(/[^0-9]/g, ""));
        return isNaN(n) ? 0 : n;
      };

      const taxRate = parseFloat(pkg?.tax_percentage ?? anchor?.tax_percentage ?? "0") || 0;
      const symbol = settings.currency_symbol || pkg?.currency || "₹";

      if (!pkg?.price) {
        return {
          finalTotal: 0, originalTotal: 0, hasSavings: false, discountPercent: 0,
          symbol, taxRate, isInclusive: false, shouldAddTaxLabel: false,
          formattedFinal: `From ${symbol}0`, formattedOriginal: "", taxLabel: "",
          perAdultFinal: 0, perChildFinal: 0, perInfantFinal: 0,
          breakdown: { subtotal: 0, taxAmount: 0, baseAmount: 0 }
        };
      }

      // ── PARSE RAW INPUTS ──
      let base = safeInt(pkg.price);

      // ── TIERED PRICING ARCHITECTURE ──
      let activeTier: any = null;
      if (anchor?.tiers && Array.isArray(anchor.tiers) && anchor.tiers.length > 0) {
        if (selectedTierName) {
          activeTier = anchor.tiers.find((t: any) => t.name === selectedTierName);
        }
        if (!activeTier) {
          activeTier = anchor.tiers[0];
        }
      }

      if (activeTier && activeTier.pax_prices) {
        const totalPax = adultCount + childCount;
        const keys = Object.keys(activeTier.pax_prices);
        
        let matchedPrice = 0;
        let matched = false;
        
        for (const key of keys) {
          if (key === String(totalPax)) {
            matchedPrice = safeInt(activeTier.pax_prices[key]);
            matched = true;
            break;
          }
          if (key.includes('-')) {
            const [min, max] = key.split('-').map(Number);
            if (totalPax >= min && totalPax <= max) {
              matchedPrice = safeInt(activeTier.pax_prices[key]);
              matched = true;
              break;
            }
          }
        }
        
        if (!matched && keys.length > 0) {
          const parsedKeys = keys.map(k => {
            if (k.includes('-')) {
              const [min, max] = k.split('-').map(Number);
              return { key: k, min, max };
            }
            const val = Number(k);
            return { key: k, min: val, max: val };
          }).sort((a, b) => a.min - b.min);
          
          let found = false;
          for (const pk of parsedKeys) {
            if (totalPax <= pk.max) {
              matchedPrice = safeInt(activeTier.pax_prices[pk.key]);
              found = true;
              break;
            }
          }
          if (!found) {
            const lastKey = parsedKeys[parsedKeys.length - 1].key;
            matchedPrice = safeInt(activeTier.pax_prices[lastKey]);
          }
        }
        
        if (matchedPrice > 0) {
          base = matchedPrice;
        }
      }

      const childBase = pkg.child_price && pkg.child_price !== "0"
        ? safeInt(pkg.child_price)
        : base;
        
      const infantBase = pkg.infant_price && pkg.infant_price !== "0"
        ? safeInt(pkg.infant_price)
        : base;

      const originalBase = safeInt(pkg.original_price || "0");

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
      const currentStatus = anchor?.status || pkg.flights_status;
      const isExcluded = currentStatus === 'excluded';
      
      const rawAdultEstimate = anchor?.estimate || pkg.flight_price_estimate || "0";
      const flightAdult = isExcluded ? 0 : safeInt(rawAdultEstimate);
      
      const rawChildFare = anchor?.child_fare || pkg.flight_price_child || (pkg.flight_segments && !Array.isArray(pkg.flight_segments) ? (pkg.flight_segments as any).child_fare : "");
      const rawInfantFare = anchor?.infant_fare || pkg.flight_price_infant || (pkg.flight_segments && !Array.isArray(pkg.flight_segments) ? (pkg.flight_segments as any).infant_fare : "");

      const flightChild = isExcluded ? 0 : ((rawChildFare && String(rawChildFare).trim()) ? safeInt(rawChildFare) : flightAdult);
      const flightInfant = isExcluded ? 0 : ((rawInfantFare && String(rawInfantFare).trim()) ? safeInt(rawInfantFare) : flightAdult);

      const perAdultFinal = landAdult + flightAdult;
      const perChildFinal = landChild + flightChild;
      const perInfantFinal = landInfant + flightInfant;
      const perOriginalFinal = landOriginal + (flightAdult > 0 ? flightAdult : 0);

      // ── Optional Add-Ons Calculator ──
      let addonsTotal = 0;
      const computedAddonsList: Array<{ name: string; price: number; type: string; qty: number; total: number }> = [];
      if (anchor?.addons && Array.isArray(anchor.addons) && selectedAddons.length > 0) {
        anchor.addons.forEach((addon: any) => {
          if (selectedAddons.includes(addon.id)) {
            const addPrice = safeInt(addon.price);
            let qty = 1;
            let total = 0;
            if (addon.type === "per_pax") {
              qty = adultCount + childCount;
              total = addPrice * qty;
            } else if (addon.type === "per_day") {
              qty = safeInt(addon.days || "1");
              total = addPrice * qty;
            } else {
              qty = 1;
              total = addPrice;
            }
            addonsTotal += total;
            computedAddonsList.push({
              name: addon.name,
              price: addPrice,
              type: addon.type,
              qty,
              total
            });
          }
        });
      }

      const baseFinalTotal = (perAdultFinal * adultCount) + (perChildFinal * childCount) + (perInfantFinal * infantCount);
      const finalTotal = baseFinalTotal + addonsTotal;
      
      const hasSavings = perOriginalFinal > 0 && perOriginalFinal > perAdultFinal;
      const discountPercent = hasSavings ? Math.round(((perOriginalFinal - perAdultFinal) / perOriginalFinal) * 100) : 0;

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
        formattedFinal: `From ${symbol}${finalTotal.toLocaleString("en-IN")}`,
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
          total: perAdultFinal,
          addons: computedAddonsList,
          addonsTotal
        }
      };
    },
    [settings]
  );

  return { computePrice, settings };
}

export const usePricing = useGlobalSettings;
