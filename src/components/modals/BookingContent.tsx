"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, memo } from "react";
import { 
  X, 
  ArrowLeft,
  ArrowRight, 
  MapPin, 
  Calendar, 
  Users, 
  MessageSquare, 
  ChevronRight,
  Plane,
  Sparkles,
  Command,
  Search,
  Check,
  Globe,
  CloudSun,
  Diamond,
  LockKeyhole,
  ChevronDown,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBooking } from "../BookingProvider";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getSettings, invalidateSettingsCache } from "@/lib/settingsCache";
import { useDiscovery } from "@/hooks/useDiscovery";
import { useSovereign } from "@/hooks/useSovereign";
import { Magnetic } from "@/components/Magnetic";
import { PackageBadges } from "@/components/ui/PackageBadges";
import gsap from "gsap";
import { usePricing } from "@/hooks/usePricing";
import { MAJOR_DESTINATIONS } from "@/lib/geography";

// --- DOMAIN CONSTANTS ---
const MS_PER_DAY = 86400000;
const REFERENCE_PREFIX = "TRX-";
const DEFAULT_CURRENCY = "₹";
const APPLE_SILVER = "#f5f5f7";

const INITIAL_ADULTS = 1;
const INITIAL_KIDS = 0;
const INITIAL_INFANTS = 0;

const TAX_INCLUSIVE_LABEL = "Inclusive of Taxes";
const TAX_EXCLUSIVE_LABEL = "Exclusive of Taxes";
const STATUS_ESTABLISHED = "Established";
const STATUS_REVIEW = "Review Your Journey";

const DOSSIER_PROTOCOL = {
  LABELS: {
    NIGHTS_DAYS: (n: number, d: number) => `${n} Nights / ${d} Days`,
    LEAD_TRAVELER: "Lead Traveler",
    SPECIAL_DESIRES: "Special Desires",
    PARTY_MANIFEST: "Party Manifest",
    FULL_NAME: "Full Name",
    EMAIL: "Email Address",
    CONTACT: "Contact Number",
    GUEST_LEAD: "Lead (Adult)",
    GUEST_LABEL: (idx: number, type: string, age?: string) => `Guest ${idx} (${type}${age ? `, ${age}y` : ""})`,
    PACKAGE_RATE: "Package Rate",
    BASE_RATE: "Base Rate",
    TAXES_LABEL: (rate: number) => `Taxes (${rate}%)`,
    INVESTMENT_HEADER: "Itinerary Investment",
    TOTAL_UNIFIED: "Unified Final Total",
    TOTAL_PRE_TAX: "Pre-Tax Total",
    TAX_INCL: "Incl. Tax",
    TAX_EXCL: "Excl. Tax"
  },
  FALLBACKS: {
    LOCATION: "Bespoke Journey",
    REFERENCE_PREFIX: "TRX-",
    ESTABLISHED_TITLE: "Established",
    CLOSE_ACTION: "Close"
  }
};

// ════ LUXURY VISUAL MANIFEST ════
// DECOMMISSIONED: Relying 100% on Sovereign Visual Intelligence for Universal Magic
const LUXURY_VISUAL_MAP: Record<string, string> = {};

const UI_CONFIG = {
  THRESHOLDS: {
    SCROLL_MIN: 30,
    SCROLL_BUFFER: 50,
    ANIM_DELAY_SM: 100,
    ANIM_DELAY_MD: 250,
    SEARCH_DEBOUNCE: 400
  },
  COLORS: {
    FOUNDATION: "#0a0a0b"
  }
};

export const BookingContent = memo(function BookingContent({
  data: packageData,
  isActive,
  source: bookingSource,
  onScroll,
  startClosing,
  setInternalCanGoBack,
  registerBackHandler,
  openModal,
  onPhaseChange,
  onStepChange,
}: {
  data: any;
  isActive: boolean;
  source: string;
  onScroll: (scrolled: boolean) => void;
  startClosing: () => void;
  setInternalCanGoBack?: (can: boolean) => void;
  registerBackHandler?: (handler: (() => boolean) | null) => void;
  openModal?: (view: any, data?: any, source?: string) => void;
  onPhaseChange?: (phase: number) => void;
  onStepChange?: (step: number) => void;
}) {
  const { setError, intent } = useBooking();
  const { user, profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevIntent = useRef<string | undefined>(undefined);

  // Flow State
  const [step, setStep] = useState(1);
  const [discoveryPhase, setDiscoveryPhase] = useState(packageData ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Form Data
  const [adults, setAdults] = useState(() => {
    return (packageData?.selectedPax) ? Number(packageData.selectedPax) : INITIAL_ADULTS;
  });
  const [kids, setKids] = useState(INITIAL_KIDS);
  const [infants, setInfants] = useState(INITIAL_INFANTS);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [internalPackage, setInternalPackage] = useState(packageData);
  const [destination, setDestination] = useState("");
  const [defaultImage, setDefaultImage] = useState<string | null>(null);
  const [dynamicImage, setDynamicImage] = useState<string | null>(null);
  const [dynamicVideo, setDynamicVideo] = useState<string | null>(null);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [additionalGuests, setAdditionalGuests] = React.useState<{ name: string; age: string; type: 'adult' | 'child' | 'infant' }[]>([]);



  // Synchronize additionalGuests when traveler counts change
  useEffect(() => {
    const totalAdditional = (adults - 1) + kids + infants;
    setAdditionalGuests(prev => {
      const next = [...prev];
      if (next.length > totalAdditional) {
        return next.slice(0, totalAdditional);
      }
      while (next.length < totalAdditional) {
        const index = next.length;
        let type: 'adult' | 'child' | 'infant' = 'adult';
        if (index >= (adults - 1) + kids) {
          type = 'infant';
        } else if (index >= (adults - 1)) {
          type = 'child';
        }
        next.push({ name: "", age: "", type });
      }
      return next;
    });
  }, [adults, kids, infants]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [includeFlights, setIncludeFlights] = useState(false);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ flag: "🇮🇳", code: "+91", name: "India", length: 10 });
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showGuestScroll, setShowGuestScroll] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [visualManifest, setVisualManifest] = useState<Record<string, string>>({});
  const curationScrollRef = useRef<HTMLDivElement>(null);

  // Auto-fill traveler information from active Supabase profile
  useEffect(() => {
    if (user) {
      if (profile?.full_name) setCustomerName(profile.full_name);
      if (user.email) setCustomerEmail(user.email);
      if (profile?.phone) {
        const rawPhone = profile.phone;
        const codeMatch = rawPhone.match(/^\+(\d+)\s*/);
        if (codeMatch) {
          const matchedCode = `+${codeMatch[1]}`;
          const cleanPhone = rawPhone.replace(matchedCode, "").trim();
          setCustomerPhone(cleanPhone);
          const countries = [
            { flag: "🇮🇳", code: "+91", name: "India", length: 10 },
            { flag: "🇺🇸", code: "+1", name: "USA", length: 10 },
            { flag: "🇬🇧", code: "+44", name: "UK", length: 10 },
            { flag: "🇦🇪", code: "+971", name: "UAE", length: 9 },
            { flag: "🇸🇬", code: "+65", name: "Singapore", length: 8 },
            { flag: "🇦🇺", code: "+61", name: "Australia", length: 9 }
          ];
          const country = countries.find(c => c.code === matchedCode);
          if (country) setSelectedCountry(country);
        } else {
          setCustomerPhone(rawPhone);
        }
      }
      if (profile?.departure_city) setDepartureCity(profile.departure_city);
    }
  }, [user, profile]);
  const guestScrollRef = useRef<HTMLDivElement>(null);



  const handleCurationScroll = () => {
    if (curationScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = curationScrollRef.current;
      // Precision threshold: only show if content is significantly larger (buffer)
      setShowScrollIndicator(
        scrollHeight > clientHeight + UI_CONFIG.THRESHOLDS.SCROLL_BUFFER && 
        scrollTop + clientHeight < scrollHeight - UI_CONFIG.THRESHOLDS.SCROLL_MIN
      );
    }
  };

  const handleGuestScroll = () => {
    if (guestScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = guestScrollRef.current;
      // Precision threshold: show if content is scrollable and we haven't reached the bottom yet
      setShowGuestScroll(scrollHeight > clientHeight + 10 && scrollTop + clientHeight < scrollHeight - 20);
    }
  };

  useEffect(() => {
    // ════ SOVEREIGN INTELLIGENCE HYDRATION ════
    
    // 1. ATOMSPHERE HYDRATION: Instant local persistence recovery
    const cachedAtmosphere = localStorage.getItem('tr_discovery_atmosphere');
    if (cachedAtmosphere) {
      setDefaultImage(cachedAtmosphere);
    }

    // 2. VISUAL MANIFEST HYDRATION: Pre-load curated destination visuals
    const fetchVisualManifest = async () => {
      try {
        const { data } = await supabase
          .from("destinations")
          .select("name, cover_image")
          .eq("is_published", true);
        
        if (data) {
          const manifest = data.reduce((acc: Record<string, string>, curr: any) => {
            acc[curr.name.toUpperCase().trim()] = curr.cover_image;
            return acc;
          }, {});
          setVisualManifest(manifest);
        }
      } catch (err) {
        console.warn("Visual Manifest Hydration Error:", err);
      }
    };

    // 3. ADMINISTRATIVE SYNC: Fetch taxes and default imagery
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        if (data.tax_percentage) setTaxRate(parseFloat(data.tax_percentage));
        if (data.discovery_default_image) {
          setDefaultImage(data.discovery_default_image);
          localStorage.setItem('tr_discovery_atmosphere', data.discovery_default_image);
        }
      } catch (err) {
        console.warn("Settings fetch error:", err);
      }
    };

    fetchVisualManifest();
    fetchSettings();

    // 4. REAL-TIME AUTHORITY: Synchronize updates from Supabase
    const channel = supabase
      .channel('site_settings_discovery_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'site_settings' }, 
        (payload: any) => {
          // Invalidate the singleton cache so next consumer gets fresh data
          invalidateSettingsCache();
          if (payload.new && payload.new.key === 'tax_percentage') {
            setTaxRate(parseFloat(payload.new.value));
          }
          if (payload.new && payload.new.key === 'discovery_default_image') {
            setDefaultImage(payload.new.value);
            localStorage.setItem('tr_discovery_atmosphere', payload.new.value);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Consolidated state synchronization
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    onPhaseChange?.(discoveryPhase);
    
    let t1: NodeJS.Timeout | null = null;
    let t2: NodeJS.Timeout | null = null;

    // Initial check for scrollability when entering phase 4
    if (discoveryPhase === 4) {
      t1 = setTimeout(handleCurationScroll, UI_CONFIG.THRESHOLDS.ANIM_DELAY_SM);
    }
    // Check guest manifest scrollability in step 2
    if (step === 2) {
      t2 = setTimeout(handleGuestScroll, UI_CONFIG.THRESHOLDS.ANIM_DELAY_MD);
    }

    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [discoveryPhase, step, onPhaseChange]);

  // Dynamic Scroll & Resize Intelligence
  useEffect(() => {
    const scrollContainer = curationScrollRef.current;
    if (!scrollContainer || discoveryPhase !== 4) return;

    // Monitor both scrolling and content size changes (ResizeObserver)
    const handleUpdate = () => handleCurationScroll();
    
    const resizeObserver = new ResizeObserver(handleUpdate);
    resizeObserver.observe(scrollContainer);
    
    scrollContainer.addEventListener('scroll', handleUpdate, { passive: true });
    
    return () => {
      resizeObserver.disconnect();
      scrollContainer.removeEventListener('scroll', handleUpdate);
    };
  }, [discoveryPhase, handleCurationScroll]);

  // Discovery Architecture
  const {
    search,
    searchResults,
    isSearching,
    trending,
    manifest,
    clearSearch: clearDiscovery,
  } = useDiscovery<any>();
  
  const {
    askSovereign,
    clearSovereign,
    isThinking,
    sovereignResponse,
    state: sovereignState
  } = useSovereign();

  // Sovereign Portal Intent Synchronization
  useEffect(() => {
    if (intent && discoveryPhase === 1 && step === 1 && intent !== prevIntent.current) {
      let cleanedDestination = intent;
      const bracketIndex = intent.indexOf('(');
      if (bracketIndex !== -1) {
        cleanedDestination = intent.substring(0, bracketIndex).trim();
      }
      
      const finalDest = cleanedDestination || "Luxury";
      setDestination(finalDest);
      prevIntent.current = intent;
      if (manifest.length > 0) {
        askSovereign(intent, manifest);
      }
    }
  }, [intent, manifest, discoveryPhase, step, askSovereign]);

  const [isValidating, setIsValidating] = useState(false);
  const [requestId, setRequestId] = useState<string>("");

  const clearSearch = useCallback(() => {
    clearDiscovery();
    clearSovereign();
  }, [clearDiscovery, clearSovereign]);
  const [searchFocused, setSearchFocused] = useState(false);

  // Navigation Logic
  const nextPhase = () => setDiscoveryPhase((prev) => Math.min(4, prev + 1));
  const prevPhase = () => setDiscoveryPhase((prev) => Math.max(1, prev - 1));
  const goToPhase = (phase: number) => {
    if (phase < discoveryPhase) setDiscoveryPhase(phase);
  };

  const initiateSovereignBooking = (pkg: any) => {
    setIsImgLoaded(false); 
    setDynamicImage(null); // CRITICAL: Kill the search visual instantly so the package visual can take over
    setInternalPackage(pkg);
    
    if (pkg?.selectedPax) {
      setAdults(Number(pkg.selectedPax));
    } else {
      setAdults(INITIAL_ADULTS);
    }
    setKids(INITIAL_KIDS);
    setInfants(INITIAL_INFANTS);
    
    // Auto-select flight assistance for 'Included' or 'On Request' packages
    setIncludeFlights(pkg?.flights_status === 'on_request' || pkg?.flights_status === 'included');
    
    // Generate TRX ID (Prompt Section III.2 - Idempotency)
    // We do this instantly now to keep the flow snappy
    const newRequestId = `${REFERENCE_PREFIX}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setRequestId(newRequestId);

    // Skip the simulated validation delay and go straight to Phase 2
    setDiscoveryPhase(2);
  };

  // ════ LIQUID VISUAL ENGINE (DIRECT AUTHORITY) ════
  const lastImgRef = useRef<string | null>(null);

  // Sync loading state with image URL changes
  useLayoutEffect(() => {
    const currentUrl = dynamicImage || internalPackage?.image;
    if (currentUrl && currentUrl !== lastImgRef.current) {
      setIsImgLoaded(false);
      lastImgRef.current = currentUrl;
    }
  }, [dynamicImage, internalPackage?.image]);

  useEffect(() => {
    // ════ SOVEREIGN VISUAL ENGINE ════
    // Clear previous visual buffer instantly to prevent "Atmospheric Ghosting"
    // If we have an internal package, we keep its visual authority
    if (!internalPackage) {
      setDynamicImage(defaultImage);
    }
    setDynamicVideo(null);
    setIsImgLoaded(false);

    // 1. ATMOSPHERE SYNC: If search is empty or too short, adopt administrative atmosphere
    const rawQuery = (destination || "").trim();
    if (rawQuery.length < 2) {
      if (!internalPackage && defaultImage) setDynamicImage(defaultImage);
      return;
    }
    
    // 2. INSTANT MANIFEST MATCH: Check the high-speed local cache for destination visual
    const queryKey = rawQuery.toUpperCase().trim();
    const manifestMatch = visualManifest[queryKey];

    if (manifestMatch) {
      setDynamicImage(manifestMatch);
      setIsVisualLoading(false);
      return; // Absolute zero-latency match found
    }

    // 3. FUZZY MANIFEST MATCH: Check for partial name matches in local cache
    const fuzzyMatch = Object.keys(visualManifest).find(key => key.includes(queryKey));
    if (fuzzyMatch) {
      setDynamicImage(visualManifest[fuzzyMatch]);
      setIsVisualLoading(false);
      return;
    }

    // 4. FALLBACK: Revert to the administrative atmosphere instantly
    setDynamicImage(defaultImage);
    setIsVisualLoading(false);
  }, [destination, internalPackage?.title, defaultImage, internalPackage, visualManifest]);

  const handlePackageSelect = (pkg: any) => {
    // Open the full package details view
    setIsImgLoaded(false);
    setDynamicImage(null); // Purge search buffer on selection
    openModal?.("PACKAGE", pkg, bookingSource);
  };

  // Sync state with props (Essential for seamless flow between Discovery and Details)
  // We rely exclusively on the onLoad event of the image for visual authority.


  useEffect(() => {
    if (packageData) {
      // If we have packageData, initiate the Sovereign Volatility Protocol
      // instead of jumping straight to Phase 2.
      initiateSovereignBooking(packageData);
    } else {
      setDiscoveryPhase(1);
      setStep(1);
      setBookingId(null);
    }
  }, [packageData]);

  useEffect(() => {
    // If we have packageData, our "internal start" is Phase 2.
    // Going back from Phase 2 should respect global history (taking us back to Details).
    const canGoBackInternally =
      (packageData ? discoveryPhase > 2 : discoveryPhase > 1) || step === 2;
    setInternalCanGoBack?.(canGoBackInternally);

    registerBackHandler?.(() => {
      // Step 1: Step-level regression (Back from Verification/Success)
      if (step > 1) {
        setStep(1);
        return true;
      }
      // Step 2: Phase-level regression (Internal Discovery phases)
      if (discoveryPhase > (packageData ? 2 : 1)) {
        prevPhase();
        return true;
      }
      return false;
    });
  }, [
    discoveryPhase,
    step,
    registerBackHandler,
    setInternalCanGoBack,
    packageData,
  ]);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (destination.trim().length >= 2) {
        askSovereign(destination, manifest);
      } else {
        clearSovereign();
      }
    }, UI_CONFIG.THRESHOLDS.SEARCH_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [destination, manifest, askSovereign, clearSovereign]);

  const startInputRef = React.useRef<HTMLInputElement>(null);
  const endInputRef = React.useRef<HTMLInputElement>(null);

  // Temporal Intelligence: Auto-calculate return date for fixed-duration packages
  const isDurationFixed = Boolean(
    internalPackage?.duration?.match(/(\d+)\s*Night/i),
  );

  useEffect(() => {
    if (startDate && isDurationFixed) {
      const nightsMatch = internalPackage.duration.match(/(\d+)\s*Night/i);
      if (nightsMatch) {
        const nights = parseInt(nightsMatch[1]);
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + nights);
        setEndDate(end.toISOString().split("T")[0]);
      }
    }
  }, [startDate, internalPackage, isDurationFixed]);

  const { computePrice } = usePricing();
  const pricing = React.useMemo(() => {
    const tier = internalPackage?.selectedTier || packageData?.selectedTier;
    return computePrice(internalPackage || packageData, adults, kids, infants, tier);
  }, [adults, kids, infants, internalPackage, packageData, computePrice]);

  const totalInvestment = `${pricing.symbol}${pricing.finalTotal.toLocaleString()}`;

  // Haptic Feedback Trigger for Pricing Updates
  const pillRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const jellyRef = useRef<HTMLDivElement>(null);

  // iOS 26 Pointer-Tracking Glow (zero re-renders, direct DOM)
  const handleGlowMove = useCallback((clientX: number, clientY: number) => {
    if (!pillRef.current || !glowRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // iOS 26: Multi-layered elliptical bloom — large, diffused, warm-tinted
    // Layer 1: Core warmth. Layer 2: Mid diffusion. Layer 3: Ambient spread.
    glowRef.current.style.background = `
      radial-gradient(ellipse 300px 180px at ${x}px ${y}px, rgba(255,251,240,0.15), rgba(255,255,255,0.02) 60%, transparent 100%),
      radial-gradient(ellipse 500px 300px at ${x}px ${y}px, rgba(255,255,255,0.03), transparent 70%),
      radial-gradient(ellipse 800px 500px at ${x}px ${y}px, rgba(255,255,255,0.01), transparent 80%)
    `;
    glowRef.current.style.opacity = '1';
    pillRef.current.style.borderColor = 'rgba(255,255,255,0.35)';
  }, []);

  const handleGlowLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = '0';
    if (pillRef.current) pillRef.current.style.borderColor = 'rgba(255,255,255,0.2)';
  }, []);

  // Dynamic Island Observed Kinetic Engine (Zero-Jitter Adaptive Fit)
  const lastWidth = useRef<number>(0);
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);
  const [scrollMask, setScrollMask] = useState<'right' | 'left' | 'both' | 'none'>('none');
  const [isMobile, setIsMobile] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Viewport Awareness Engine (Resize + Orientation)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    const handleOrientation = () => {
      setTimeout(checkMobile, 100);
    };
    window.addEventListener('resize', checkMobile, { passive: true });
    window.addEventListener('orientationchange', handleOrientation, { passive: true });
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // ═══ JELLY INTERACTION ENGINE ═══
  // Triggers a tactile vertical "squash & stretch" pulse when data updates.
  // Targeted at the background shell (jellyRef) to prevent content stretching.
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!jellyRef.current || !isActive) return;

    // Kill any existing jelly tweens on the background
    gsap.killTweensOf(jellyRef.current, "scaleX,scaleY");

    // Phase 1: Rapid Compression (Reaction)
    gsap.to(jellyRef.current, {
      scaleY: 0.82,
      scaleX: 1.08,
      duration: 0.1,
      ease: "power2.out",
      onComplete: () => {
        // Phase 2: Elastic Settle (Resolution)
        gsap.to(jellyRef.current, {
          scaleY: 1,
          scaleX: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.3)",
          clearProps: "scaleX,scaleY"
        });
      }
    });
  }, [totalInvestment, startDate, endDate, adults, kids, infants, discoveryPhase, step, isActive]);

  // Dynamic Kinetic Mask Engine (Bidirectional Scroll Hints)
  useEffect(() => {
    const el = segmentsRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollWidth <= clientWidth + 4) {
        setScrollMask('none');
        return;
      }
      
      const isAtStart = scrollLeft <= 5;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 85;
      
      if (isAtStart) setScrollMask('right');
      else if (isAtEnd) setScrollMask('left');
      else setScrollMask('both');
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    // Create a ResizeObserver for the content itself to update masks when segments bud
    const ro = new ResizeObserver(handleScroll);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      ro.disconnect();
    };
  }, [discoveryPhase, step, adults, kids, infants, startDate, endDate, isMobile]);

  useLayoutEffect(() => {
    if (!pillRef.current || !segmentsRef.current || !actionRef.current) return;
    
    const updateGeometry = () => {
      if (!pillRef.current || !segmentsRef.current || !actionRef.current) return;
      
      const vw = window.innerWidth;
      
      // Calculate Total Intrinsic Mass (Precision Calibration)
      const segmentsWidth = segmentsRef.current.scrollWidth;
      const actionWidth = actionRef.current.scrollWidth;
      
      // Fluid Geometry Tokens — continuous scaling, no breakpoints
      // Pill gap: clamp(4px, 2vw, 32px). Pill padding: p-2 = 16px constant.
      const gap = Math.min(Math.max(vw * 0.02, 4), 32);
      const padding = 16; 
      
      // Calculate Natural Content Width (true intrinsic mass)
      const naturalWidth = segmentsWidth + actionWidth + gap + padding;
      
      // Fluid safe margin: clamp(24px, 4vw, 80px)
      const safeMargin = Math.min(Math.max(vw * 0.04, 24), 80);
      const maxSafeWidth = vw - safeMargin;
      
      // Determine if content overflows — drives scroll behavior
      const overflows = naturalWidth > maxSafeWidth;
      setIsOverflowing(overflows);
      
      // Target: fit content exactly, or cap at max if overflowing
      const targetWidth = overflows ? maxSafeWidth : naturalWidth;
      
      if (Math.abs(lastWidth.current - targetWidth) > 0.5) {
        // Kill any existing tween for clean transitions
        gsap.killTweensOf(pillRef.current);
        
        // ═══ DYNAMIC ISLAND ELASTIC SPRING ═══
        // Single tween, single property (width) = zero conflicts.
        // elastic.out(1, 0.35): smooth rubbery overshoot with gentle bounce.
        // Duration 1.5s: unhurried settle — the spring breathes naturally.
        gsap.to(pillRef.current, {
          width: targetWidth,
          duration: 1.5,
          ease: "elastic.out(1, 0.35)",
          force3D: true,
          transformOrigin: "center center",
          onComplete: () => {
            setTimeout(() => {
              if (pillRef.current) pillRef.current.style.width = `${targetWidth}px`;
            }, 50);
          }
        });
        
        lastWidth.current = targetWidth;
      }
    };

    // Use ResizeObserver for surgical geometric tracking
    const observer = new ResizeObserver(() => {
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(updateGeometry, 16); 
    });

    observer.observe(segmentsRef.current);
    observer.observe(actionRef.current);
    
    // Initial measurement
    updateGeometry();

    // PHASE-DRIVEN KINETIC PULSE: Force geometry update when discovery states change
    const pulseTimer = setTimeout(() => {
      requestAnimationFrame(updateGeometry);
    }, 100);

    return () => {
      observer.disconnect();
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      clearTimeout(pulseTimer);
    };
  }, [discoveryPhase, step, adults, kids, infants, startDate, endDate, isMobile]);

  // Discovery Analytics: Silent Trend Tracking
  useEffect(() => {
    if (sovereignResponse && sovereignResponse.results.length > 0 && destination) {
      const logDiscovery = async () => {
        try {
          await supabase
            .from('discovery_logs')
            .insert([{ 
              query: destination, 
              result_count: sovereignResponse.results.length,
              timestamp: new Date().toISOString()
            }]);
        } catch (err) {
          // Silent fail for analytics
        }
      };
      logDiscovery();
    }
  }, [sovereignResponse]);

  const submitBooking = async () => {
    if (!startDate || !endDate || !isPhaseValid) return;
    setIsSubmitting(true);

    try {
      // ════ DATABASE RECORDING (PURE AUTHORITY MODEL) ════
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestId || "LEGACY-INQUIRY",
          packageId: internalPackage?.id || packageData?.id || "GENERAL_INQUIRY",
          packageName: internalPackage?.title || packageData?.title || destination || "Tailored Experience",
          travelerCount: adults + kids + infants,
          travelers: { adults, kids, infants, guests: additionalGuests },
          customerName,
          customerEmail,
          customerPhone: `${selectedCountry.code}${customerPhone}`,
          specialRequests: `Dates: ${startDate} to ${endDate} | Departure Hub: ${departureCity} | Flights: ${includeFlights ? 'Yes' : 'No'} | Notes: ${notes}`,
          bookingSource: bookingSource || "SOVEREIGN_ENGINE",
          totalAmount: Math.round(pricing.finalTotal),
          userId: user?.id || null, // Traveler lounge integration
          metadata: { departureCity, includeFlights } // Optional: For future-proof API handling
        }),
      });

      const res = await response.json();

      if (response.ok) {
        setBookingId(res.data?.[0]?.id || "SOV-" + Math.random().toString(36).substr(2, 9).toUpperCase());
        setStep(3);
        console.warn("Booking Submission Error:", res.error);
        setError?.(res.error || "Failed to establish journey. Please verify your connection.");
      }
    } catch (err) {
      console.warn("Sovereign Submission Failure:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForDisplay = (dateStr: string, compact = false) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    if (compact) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
    }
    return `${d}/${m}/${y}`;
  };

  const canSubmit = Boolean(
    customerName.trim().length >= 3 && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) &&
    customerPhone.trim().length === selectedCountry.length &&
    additionalGuests.every(guest => {
      const nameValid = (guest?.name?.trim()?.length || 0) >= 2;
      if (guest.type === 'adult') return nameValid;
      const ageValid = (guest?.age?.trim()?.length || 0) >= 1;
      return nameValid && ageValid;
    })
  );

  const isPhaseValid = React.useMemo(() => {
    switch (discoveryPhase) {
      case 2:
        return Boolean(startDate && endDate);
      case 3:
        return adults > 0;
      case 4:
        return canSubmit;
      default:
        return true;
    }
  }, [discoveryPhase, startDate, endDate, adults, canSubmit, customerName, customerEmail, customerPhone]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const isScrolled = e.currentTarget.scrollTop > UI_CONFIG.THRESHOLDS.SCROLL_MIN;
    onScroll(isScrolled);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0a0a0b] text-[#f5f5f7] selection:bg-white selection:text-black font-sans antialiased overflow-hidden">
      {/* 1. PROGRESS LINE (PINNED) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] z-[150] flex gap-px px-px">
        {[1, 2, 3, 4].map((p) => (
          <div
            key={p}
            className={cn(
              "flex-1 h-full transition-colors duration-1000",
              discoveryPhase >= p ? "bg-white/30" : "bg-white/5",
            )}
          />
        ))}
      </div>

      {/* 2. SOVEREIGN BLACK FOUNDATION (IMMERSIVE CONTEXT) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#0a0a0b]">
        {/* Cinematic Video Layer */}
        {dynamicVideo ? (
          <video
            key={dynamicVideo}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setIsVisualLoading(false)}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-[transform,opacity,filter] duration-[1200ms] ease-out brightness-[0.7] transform-gpu",
              isVisualLoading ? "scale-110 blur-xl opacity-0" : "scale-100 blur-0 opacity-40"
            )}
            style={{ transform: "translate3d(0,0,0)" }}
          >
            <source src={dynamicVideo} type="video/mp4" />
          </video>
        ) : (internalPackage?.image || dynamicImage) && (
          <img
            src={internalPackage?.image || dynamicImage}
            onLoad={() => setIsVisualLoading(false)}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-[transform,opacity,filter] duration-[1200ms] ease-out brightness-[0.7] transform-gpu",
              isVisualLoading ? "scale-110 blur-xl opacity-0" : "scale-100 blur-0 opacity-40"
            )}
            alt={internalPackage?.title || destination}
            style={{ transform: "translate3d(0,0,0)" }}
          />
        )}

        {/* Luxury Vignette & Depth Mask */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0a0b] opacity-90 transform-gpu" style={{ transform: "translate3d(0,0,0)" }} />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[140%] aspect-square bg-gradient-to-b from-white/[0.02] to-transparent rounded-full blur-[140px] opacity-20 transform-gpu" style={{ transform: "translate3d(0,0,0)" }} />
      </div>

      {/* 3. VIEWPORT-LOCKED WORKSPACE */}
      <div className="flex-1 w-full relative z-10 flex flex-col overflow-hidden transform-gpu" style={{ transform: "translate3d(0,0,0)" }}>
        <div className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden transform-gpu" style={{ transform: "translate3d(0,0,0)" }}>
          {/* Background Hero was here - moved to root foundation */}
          {step === 1 && (
            <div className="w-full h-full flex flex-col items-center justify-center px-6 md:px-12 relative">
              {/* PHASE 01: DESTINY (PAN-HORIZON) */}
              {discoveryPhase === 1 && (
                <div
                  className={cn(
                    "w-full h-full flex flex-col transition-all duration-[1.2s] cubic-bezier(0.23,1,0.32,1)",
                    searchResults.length > 0 && destination.length > 0
                      ? "pt-[clamp(5rem,10vh,6rem)]"
                      : "pt-[clamp(6.5rem,12vh,8rem)]",
                  )}
                >
                  <div
                    className={cn(
                      "w-full transition-all duration-1000 cubic-bezier(0.23,1,0.32,1) px-[clamp(1.5rem,6vw,4rem)]",
                      searchResults.length > 0 && destination.length > 0
                        ? "opacity-70 scale-[0.85] mb-[clamp(0.5rem,3vh,1.5rem)]"
                        : "opacity-100 scale-100 mb-[clamp(1rem,3vh,2rem)]",
                    )}
                  >
                    <h2 className="text-[clamp(1.5rem,7vw,8rem)] font-black tracking-[-0.07em] leading-none mb-[clamp(0.8rem,3vh,1.2rem)] text-center whitespace-nowrap">
                      <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 pr-[0.05em] pl-[0.02em]">Explore</span>{" "}
                      <span className="text-white/20 font-light italic tracking-tight">
                        new horizons.
                      </span>
                    </h2>
                    <p
                      className={cn(
                        "text-[clamp(0.55rem,1.5vw,0.8rem)] font-medium uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/40 text-center transition-all duration-700 whitespace-nowrap",
                        (sovereignResponse || isThinking) && destination.length > 0
                          ? "opacity-0 h-0 overflow-hidden"
                          : "opacity-100 mb-[clamp(1.5rem,4vh,2.5rem)]",
                      )}
                    >
                      Search your destination
                    </p>

                    <div
                      className={cn(
                        "transition-all duration-1000 cubic-bezier(0.23,1,0.32,1) mx-auto",
                        (sovereignResponse || isThinking) && destination.length > 0
                          ? "max-w-md"
                          : "max-w-2xl",
                      )}
                    >
                      <div className="relative group/search">
                        <Search
                          className={cn(
                            "absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-500 z-10",
                            searchFocused ? "text-white/80" : "text-white/20",
                          )}
                          size={22}
                        />
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          onFocus={() => setSearchFocused(true)}
                          onBlur={() =>
                            setTimeout(() => setSearchFocused(false), 200)
                          }
                          placeholder="Where should your journey begin?"
                          autoComplete="off"
                          className="w-full py-3.5 md:py-5 pl-14 pr-12 text-lg md:text-xl font-medium focus:outline-none transition-all duration-700 bg-white/[0.02] border border-white/[0.08] focus:border-white/30 rounded-full text-white placeholder:text-white/5 backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(255,255,255,0.05)] focus:shadow-[0_0_60px_-12px_rgba(255,255,255,0.1)]"
                          autoFocus
                        />
                        {destination.length > 0 && (
                          <button
                            onClick={() => {
                              setDestination("");
                              clearSearch();
                            }}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full z-10"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEARCH MANIFEST & STATUS BAR */}
                  <div
                    className={cn(
                      "w-full px-[clamp(1rem,6vw,3rem)] mb-6 md:mb-8 flex items-center justify-center transition-opacity duration-700",
                      (sovereignResponse || isThinking) && destination.length > 0
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none",
                    )}
                  >
                    <div className="flex items-center justify-center gap-6 w-full">
                      {sovereignResponse && !isThinking && (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700 w-full justify-center text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Sparkles size={12} className="text-amber-400 shrink-0 animate-pulse" />
                            <div className="max-w-[280px] md:max-w-none">
                              <span className="text-[10px] md:text-xs font-medium tracking-wide text-white/50 md:text-white/90 leading-relaxed block text-center">
                                {sovereignState === 'SUGGESTING' && (sovereignResponse as any).suggestion ? (
                                  <>
                                    I couldn't find an exact match for "{destination}". Did you mean{" "}
                                    <button 
                                      onClick={() => {
                                        const sugg = (sovereignResponse as any).suggestion;
                                        setDestination(sugg);
                                        askSovereign(sugg, manifest);
                                      }}
                                      className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 font-black cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      {(sovereignResponse as any).suggestion}
                                    </button>?
                                  </>
                                ) : (
                                  (() => {
                                    const msg = (sovereignResponse as any).ui_message || "";
                                    const results = (sovereignResponse as any).results || [];
                                    const queryDest = (sovereignResponse as any).tool_call?.parameters?.destination;
                                    
                                    // Collect all terms to highlight
                                    const terms = new Set<string>();
                                    if (queryDest) terms.add(queryDest);
                                    results.forEach((r: any) => terms.add(r.title));
                                    
                                    if (terms.size > 0) {
                                      // Create a combined regex for all terms
                                      const sortedTerms = Array.from(terms).sort((a, b) => b.length - a.length);
                                      const regex = new RegExp(`(${sortedTerms.join('|')})`, 'gi');
                                      const parts = msg.split(regex);
                                      
                                      return parts.map((part: string, i: number) => {
                                        const isMatch = sortedTerms.some(t => t.toLowerCase() === part.toLowerCase());
                                        return isMatch ? (
                                          <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 font-black">
                                            {part}
                                          </span>
                                        ) : part;
                                      });
                                    }
                                    return msg;
                                  })()
                                )}
                              </span>
                            </div>
                          </div>
                          {sovereignState === 'ESCALATING' && (
                            <Magnetic>
                              <button
                                onClick={() => {
                                  const customPkg = {
                                    id: `custom-${Date.now()}`,
                                    title: destination.charAt(0).toUpperCase() + destination.slice(1),
                                    location: "Tailored Experience",
                                    duration: "Custom Duration",
                                    price: 0,
                                    image: dynamicImage || defaultImage || "",
                                    isCustom: true,
                                  };
                                  setInternalPackage(customPkg);
                                  setDiscoveryPhase(2);
                                }}
                                className="w-fit md:w-auto px-6 py-2.5 md:px-8 md:py-3.5 bg-white text-black rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all duration-500 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.3)] whitespace-nowrap"
                              >
                                 Let's Craft Your {(sovereignResponse as any).tool_call?.parameters?.destination || "Unique"} Journey
                              </button>
                            </Magnetic>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ADAPTIVE KINETIC COLLECTION (HORIZONTAL) */}
                  <div className="w-full flex-1 flex flex-col overflow-y-hidden overflow-x-hidden scrollbar-hide min-h-0 relative">
                    {isThinking ? (
                      <div className="w-full h-40 flex flex-col items-center justify-center gap-4 text-white/20">
                        <div className="flex items-center gap-8 mb-2">
                          <Globe size={18} className="text-white/40 animate-pulse [animation-duration:2s]" />
                          <CloudSun size={18} className="text-white/40 animate-pulse [animation-duration:2s] [animation-delay:0.3s]" />
                          <Diamond size={18} className="text-white/40 animate-pulse [animation-duration:2s] [animation-delay:0.6s]" />
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse">
                            {sovereignResponse?.state === 'CURATING' ? "Curating Excellence" : 
                             sovereignResponse?.state === 'ESCALATING' ? "Designing Bespoke" : 
                             "Mapping your desires..."}
                          </span>
                          
                          {/* Reasoning Stream (The Intelligence) */}
                          <div className="flex flex-col items-center gap-2 max-w-md text-center">
                            <p className="text-[9px] font-medium leading-relaxed text-white/40 italic animate-in fade-in slide-in-from-bottom-2 duration-1000">
                              {isThinking ? (
                                <span className="flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-white/20 animate-bounce [animation-delay:-0.3s]" />
                                  <span className="w-1 h-1 rounded-full bg-white/20 animate-bounce [animation-delay:-0.15s]" />
                                  <span className="w-1 h-1 rounded-full bg-white/20 animate-bounce" />
                                  Orchestrating Narrative...
                                </span>
                              ) : sovereignResponse?.thought_process}
                            </p>
                            
                            {/* Tool Call Indicator (The Agency) */}
                            {sovereignResponse?.tool_call && !isThinking && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 animate-in zoom-in duration-500">
                                <Command size={10} className="text-white/40" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-white/60">
                                  Applied Tool: {sovereignResponse.tool_call.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : sovereignResponse && sovereignResponse.results?.length > 0 && destination.length > 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          "flex-1 flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide pt-6 pb-8 min-h-0",
                          sovereignResponse.results?.length === 1 ? "justify-center" : "justify-start"
                        )}
                      >
                        {(sovereignResponse.results?.length ?? 0) > 1 && (
                          <div className="w-1 md:w-4 flex-shrink-0" />
                        )}
                        
                        {sovereignResponse.results.map((pkg, idx) => {
                          const pkgPricing = computePrice(pkg, 1, 0, 0);
                          return (
                            <motion.div 
                              key={pkg.id} 
                              initial={{ opacity: 0, y: 30, scale: 0.98 }}
                              animate={{ 
                                opacity: 1, 
                                y: 0, 
                                scale: 1,
                                transition: {
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 30,
                                  delay: idx * 0.08
                                }
                              }}
                              className="flex-shrink-0 snap-start w-[75vw] sm:w-[60vw] md:w-auto md:flex-1 md:min-w-[320px] md:max-w-[450px] h-full transform-gpu"
                            >
                              <Magnetic intensity={0.04} className="w-full h-full block">
                                <div
                                  onClick={() => handlePackageSelect(pkg)}
                                    className={cn(
                                      "group/card relative w-full h-full rounded-[2.5rem] overflow-hidden cursor-pointer border transition-all duration-[1.2s] shadow-2xl transform-gpu hover:translate-y-[-12px] hover:scale-[1.02]",
                                      (pkg as any).authority_type === 'gold' ? "border-amber-400/40 hover:border-amber-400/60 shadow-[0_10px_40px_-5px_rgba(251,191,36,0.2)] hover:shadow-[0_15px_50px_-5px_rgba(251,191,36,0.3)]" :
                                      (pkg as any).authority_type === 'silver' ? "border-white/10 hover:border-white/20 shadow-[0_10px_30px_-5px_rgba(255,255,255,0.05)] hover:shadow-[0_15px_40px_-5px_rgba(255,255,255,0.1)]" :
                                      "border-white/[0.03] hover:border-white/10 hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.5)]"
                                    )}
                                  >
                                    <div className="absolute inset-0">
                                      <img
                                        src={pkg.image}
                                        className="w-full h-full object-cover transition-transform duration-[2s] group-hover/card:scale-[1.08]"
                                        alt={pkg.title}
                                      />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
                                    
                                    {/* Centered Arrow on Hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-700 pointer-events-none">
                                      <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center transform scale-90 group-hover/card:scale-100 transition-all duration-500 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                        <ArrowRight size={24} strokeWidth={2.5} />
                                      </div>
                                    </div>
                                    
                                    <PackageBadges 
                                      pkg={pkg} 
                                      pricing={pkgPricing} 
                                      className="top-5 left-5 right-5" 
                                      matchData={{
                                        label: (pkg as any).match_label,
                                        authority: (pkg as any).authority_type
                                      }}
                                    />
                                    
                                    <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                                      <div className="space-y-4 w-full">
                                        <div className="flex items-end justify-between gap-4">
                                          <div className="space-y-1 flex-1 min-w-0">
                                            <h3 className="text-[clamp(1.5rem,4vw,2.25rem)] text-balance font-black tracking-tight text-white/90 drop-shadow-2xl">
                                              {pkg.title}
                                            </h3>
                                          </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/10 flex items-end justify-between gap-4">
                                          <div className="space-y-1">
                                            <p className="text-base md:text-xl font-bold text-white/90 italic drop-shadow-lg leading-tight">
                                              {pkg.duration.includes('Nights') ? (
                                                <>
                                                  <span className="whitespace-nowrap">{pkg.duration.split('Nights')[0].trim()} Nights</span>
                                                  <br />
                                                  <span className="whitespace-nowrap">{pkg.duration.split('Nights')[1].trim()}</span>
                                                </>
                                              ) : pkg.duration}
                                            </p>
                                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 block drop-shadow-md">
                                              Duration
                                            </span>
                                          </div>

                                          <div className="space-y-0.5 text-right">
                                            {pkgPricing.hasSavings && (
                                              <span className="text-[10px] font-bold line-through text-white/50 block mb-1 drop-shadow-md">
                                                {pkgPricing.symbol}{pkgPricing.originalTotal.toLocaleString()}
                                              </span>
                                            )}
                                            <p className="text-[clamp(1.8rem,4vw,2.25rem)] font-black text-white tracking-tighter leading-none drop-shadow-xl">
                                              {pkgPricing.formattedFinal}
                                            </p>
                                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 block mt-1 drop-shadow-md">
                                              Per Person
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Magnetic>
                              </motion.div>
                            );
                          })}


                        {/* Visual Spacer for Horizontal End */}
                        {(sovereignResponse.results?.length ?? 0) > 1 && (
                          <div className="flex-shrink-0 w-8 md:w-32 h-1" />
                        )}
                      </motion.div>
                    ) : (
                      <div className="w-full flex-1 flex flex-col animate-in fade-in duration-1000 min-h-0">
                        <div className="flex items-center gap-4 px-5 md:px-[clamp(2rem,6vw,4rem)] mb-6 md:mb-10 flex-shrink-0">
                          <span className="text-[9px] font-bold uppercase tracking-[0.6em] text-white/70 whitespace-nowrap">
                            {isThinking 
                              ? "Seeking the extraordinary..."
                              : sovereignState === 'ESCALATING' 
                                ? "Crafting your bespoke escape"
                                : (sovereignResponse?.results?.length ?? 0) > 0
                                  ? "Curated for your vision"
                                  : destination.length > 0
                                    ? "Exploring possibilities..."
                                    : "Suggested Destinies"
                            }
                          </span>
                          <div className="h-[1px] w-full bg-white/[0.08]" />
                        </div>

                        <div
                          className={cn(
                            "flex-1 flex gap-4 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide pt-6 pb-8 transition-all duration-1000 min-h-0",
                            destination.length > 0
                              ? "opacity-30 blur-sm scale-[0.98] pointer-events-none"
                              : "opacity-100 blur-0 scale-100",
                          )}
                        >
                          {/* Anti-Clip Spacer */}
                          <div className="w-1 md:w-4 flex-shrink-0" />

                          {trending.map((pkg) => {
                            return (
                              <Magnetic key={pkg.id} intensity={0.08} className="flex-shrink-0 snap-start w-[75vw] sm:w-[60vw] md:w-auto md:flex-1 md:min-w-[280px] md:max-w-[420px] h-full">
                                <button
                                  onClick={() => handlePackageSelect(pkg)}
                                  className="group/mini relative w-full h-full rounded-[2rem] overflow-hidden border border-white/[0.08] hover:border-white/30 transition-all duration-700 shadow-2xl transform-gpu hover:translate-y-[-4px] hover:shadow-[0_20px_60px_-20px_rgba(255,255,255,0.06)]"
                                >
                                  <img
                                  src={pkg.image}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover/mini:scale-[1.08]"
                                  alt={pkg.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                                
                                {/* Status Badges Layer */}
                                <PackageBadges pkg={pkg} className="top-5 left-5 right-5" />
                                
                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                  <div className="flex items-end justify-between gap-4">
                                    <div className="text-left space-y-1">
                                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 block">
                                        Trending Destiny
                                      </span>
                                      <h3 className="text-xl md:text-2xl font-black tracking-tight text-white/90 italic">
                                        {pkg.title}
                                      </h3>
                                    </div>
                                    
                                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center translate-y-2 opacity-0 group-hover/mini:translate-y-0 group-hover/mini:opacity-100 transition-all duration-500 shadow-2xl">
                                      <ArrowRight size={18} strokeWidth={2.5} className="text-white" />
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </Magnetic>
                          );
                        })}
                          {/* Visual Spacer for Horizontal End */}
                          <div className="flex-shrink-0 w-8 md:w-32 h-1" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* DISCOVERY PHASES 02-04: CONTENT ORCHESTRATION */}
              {discoveryPhase > 1 && (
                <div className="absolute inset-0 w-full h-full z-[200] overflow-hidden pointer-events-none">
                  <div className="flex-1 w-full flex flex-col justify-between p-8 md:p-20 lg:p-24 pb-28 md:pb-20 relative z-20 h-full pointer-events-auto">
                    {/* Top Section: Title (Hidden in Phase 04 to avoid duplication) */}
                    <div className={cn(
                      "max-w-4xl space-y-3 px-4 md:px-0 transition-all duration-1000",
                      discoveryPhase === 4 ? "opacity-0 -translate-y-8 pointer-events-none h-0" : "mt-20 md:mt-24"
                    )}>
                    {/* Top Section: Title (Unified Phase 2-4 Header) */}
                    <div className="w-full flex flex-col items-center gap-[clamp(1.5rem,5vh,2.5rem)] px-[clamp(1rem,4vw,2.5rem)] mt-[clamp(2rem,6vh,6rem)] shrink-0">
                      <div className="text-center space-y-1 animate-in fade-in slide-in-from-top-2 duration-1000">
                        <h2 className="text-[clamp(1.2rem,6vw,2.2rem)] font-black tracking-[0.5em] md:tracking-[1.2em] text-white drop-shadow-2xl uppercase leading-none md:pl-[1.2em] flex items-center justify-center">
                          {(internalPackage?.title || "Journey").split('').map((char: string, index: number) => (
                            <span 
                              key={`${char}-${index}`}
                              className="animate-in fade-in zoom-in duration-1000"
                              style={{ 
                                animationDelay: `${index * 100}ms`,
                                display: 'inline-block'
                              }}
                            >
                              {char === ' ' ? '\u00A0' : char}
                            </span>
                          ))}
                        </h2>
                        <div className="flex items-center justify-center gap-4 pt-1">
                          <div className="w-8 md:w-12 h-[1px] bg-white/10" />
                          <span className="text-[6px] md:text-[8px] font-bold uppercase tracking-[0.8em] text-white/40 pl-[0.8em]">
                            {internalPackage?.location || "Bespoke"}
                          </span>
                          <div className="w-8 md:w-12 h-[1px] bg-white/10" />
                        </div>
                      </div>
                    </div>
                    </div>

                    {/* Bottom Section: Discovery Hub (Bottom-Anchored for Uniformity) */}
                    <div className="flex-1 flex flex-col justify-end items-center pb-[clamp(2rem,8vh,6rem)]">
                      <div className="w-full max-w-5xl min-h-[160px] h-auto relative flex items-center justify-center">
                        
                        <div className={cn("absolute inset-0 transition-all duration-700 transform-gpu flex flex-col justify-center", discoveryPhase === 2 ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 -translate-x-8 pointer-events-none")}>
                          <div className="w-full flex justify-center px-6 md:px-0">
                            <div 
                              className={cn(
                                "relative w-full max-w-[280px] sm:max-w-md md:max-w-4xl h-auto md:h-[120px] transition-all duration-700 bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[32px] md:rounded-2xl flex flex-col md:flex-row items-stretch overflow-hidden group/bar shadow-2xl hover:border-white/40",
                                isDurationFixed && "md:max-w-xl"
                              )}
                            >
                              {/* LEFT: DEPARTURE */}
                              <div 
                                onClick={() => {
                                  const startInput = startInputRef.current as any;
                                  if (!startInput) return;
                                  try {
                                    if ('showPicker' in startInput) {
                                      startInput.showPicker();
                                    } else {
                                      startInput.click();
                                    }
                                  } catch (e) {
                                    startInput.click();
                                  }
                                }}
                                className="flex-1 relative flex flex-col items-center justify-center gap-2 py-8 md:py-0 cursor-pointer hover:bg-white/[0.05] active:bg-white/[0.08] transition-all group/arrival border-b md:border-b-0 md:border-r border-white/10 md:border-transparent"
                              >
                                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40 group-hover/arrival:text-white/70 transition-colors">
                                  Departure
                                </span>
                              <div className="flex flex-col items-center">
                                {startDate ? (
                                  <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <span className="text-2xl font-light tracking-tight text-white">
                                      {new Date(startDate).toLocaleDateString('default', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                    {/* Spacer to match Return side's badge rhythm */}
                                    <div className="h-[14px] opacity-0" />
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 group-hover/arrival:text-white/50 transition-colors">
                                    Set Date
                                  </span>
                                )}
                              </div>
                              {/* Selection Indicator */}
                              <div className={cn(
                                "absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-white/60 transition-all duration-700",
                                startDate ? "w-12 opacity-100" : "w-0 opacity-0"
                              )} />

                              <input
                                ref={startInputRef}
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-20"
                              />
                            </div>

                            {/* DIVIDER (HIDDEN ON MOBILE DUE TO BORDER) */}
                            <div className="hidden md:block w-[1px] h-8 my-auto bg-white/20" />

                            {/* RIGHT: RETURN */}
                            <div 
                              onClick={() => {
                                if (isDurationFixed) return;
                                const endInput = endInputRef.current as any;
                                if (!endInput) return;
                                try {
                                  if ('showPicker' in endInput) {
                                    endInput.showPicker();
                                  } else {
                                    endInput.click();
                                  }
                                } catch (e) {
                                  endInput.click();
                                }
                              }}
                              className={cn(
                                "flex-1 relative flex flex-col items-center justify-center gap-2 py-8 md:py-0 transition-all group/return",
                                isDurationFixed ? "cursor-default bg-white/[0.02]" : "cursor-pointer hover:bg-white/[0.05] active:bg-white/[0.08]"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-[0.5em] transition-colors",
                                  isDurationFixed ? "text-white/20" : "text-white/40 group-hover/return:text-white/70"
                                )}>
                                  Return
                                </span>
                                {isDurationFixed && <LockKeyhole size={12} className="text-white/40" />}
                              </div>
                              <div className="flex flex-col items-center">
                                {endDate ? (
                                    <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                      <span className={cn(
                                        "text-2xl font-light tracking-tight transition-colors",
                                        isDurationFixed ? "text-white/30" : "text-white"
                                      )}>
                                        {new Date(endDate).toLocaleDateString('default', { day: '2-digit', month: 'long', year: 'numeric' })}
                                      </span>
                                      
                                      {/* Subtle Duration Badge */}
                                      <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 opacity-60">
                                        <span className="text-[6px] font-black uppercase tracking-widest text-white/40">
                                          {Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate ? startDate : endDate).getTime()) / (1000 * 60 * 60 * 24)))} Nights
                                        </span>
                                        <div className="w-[1px] h-1.5 bg-white/10" />
                                        <span className="text-[6px] font-black uppercase tracking-widest text-white/40">
                                          {Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate ? startDate : endDate).getTime()) / (1000 * 60 * 60 * 24))) + 1} Days
                                        </span>
                                      </div>
                                    </div>
                                ) : (
                                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 group-hover/return:text-white/50 transition-colors">
                                    {isDurationFixed ? "Awaiting Arrival" : "Set Date"}
                                  </span>
                                )}
                              </div>
                              {/* Selection Indicator */}
                              {!isDurationFixed && (
                                <div className={cn(
                                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-white/60 transition-all duration-700",
                                  endDate ? "w-12 opacity-100" : "w-0 opacity-0"
                                )} />
                              )}

                              {!isDurationFixed && (
                                <input
                                  ref={endInputRef}
                                  type="date"
                                  value={endDate}
                                  onChange={(e) => setEndDate(e.target.value)}
                                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-20"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Phase 03: Group */}
                      <div className={cn("absolute inset-0 transition-all duration-700 transform-gpu flex flex-col justify-center", discoveryPhase === 3 ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-8 pointer-events-none")}>
                        <div className="w-full flex justify-center px-6 md:px-0">
                          <div className="relative w-full max-w-[280px] sm:max-w-md md:max-w-4xl h-auto md:h-[120px] transition-all duration-700 bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[32px] md:rounded-2xl flex flex-col md:flex-row items-stretch overflow-hidden group/bar shadow-2xl hover:border-white/40">
                            {[
                              { id: 'adults', label: adults <= 1 ? "Adult" : "Adults", count: adults, set: setAdults, min: 1 },
                              { id: 'kids', label: kids <= 1 ? "Child" : "Children", count: kids, set: setKids, min: 0 },
                              { id: 'infants', label: infants <= 1 ? "Infant" : "Infants", count: infants, set: setInfants, min: 0 },
                            ].map((t, idx) => (
                              <React.Fragment key={t.id}>
                                <div className="flex-1 relative flex flex-col items-center justify-center gap-2 py-8 md:py-0 group/segment transition-all">
                                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.5em] text-white/40 group-hover/segment:text-white/70 transition-colors">
                                    {t.label}
                                  </span>
                                  <div className="flex items-center gap-6 md:gap-8">
                                    <button
                                      onClick={() => t.set(Math.max(t.min, t.count - 1))}
                                      className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:bg-white hover:text-black hover:border-white transition-all text-xs font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="text-[clamp(1.5rem,3vw,1.875rem)] font-light tracking-tight text-white tabular-nums">
                                      {t.count}
                                    </span>
                                    <button
                                      onClick={() => t.set(t.count + 1)}
                                      className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:bg-white hover:text-black hover:border-white transition-all text-xs font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                {idx < 2 && (
                                  <>
                                    {/* Mobile Divider */}
                                    <div className="block md:hidden h-[1px] w-12 mx-auto bg-white/10" />
                                    {/* Desktop Divider */}
                                    <div className="hidden md:block w-[1px] h-8 my-auto bg-white/20" />
                                  </>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>

                        {/* Phase 04: Curation (Intrinsic Architectural Model) */}
                        <div className={cn("absolute inset-0 transition-all duration-700 transform-gpu flex flex-col justify-end pb-[clamp(1.5rem,5vh,4rem)]", discoveryPhase === 4 ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-8 pointer-events-none")}>
                            <div className="w-full flex flex-col items-center gap-[clamp(1.5rem,5vh,2.5rem)] px-[clamp(1rem,4vw,2.5rem)] mt-[clamp(2rem,6vh,6rem)]">
                            

                            <div className="relative w-full max-w-[min(850px,94vw)] sm:max-w-md md:max-w-5xl transition-all duration-700 bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[40px] flex flex-col shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] hover:border-white/40 overflow-hidden group/instrument mx-auto">
                            
                              {/* Scrollable Protocol Area */}
                              <div 
                                ref={curationScrollRef}
                                onScroll={handleCurationScroll}
                                className="w-full max-h-[calc(100vh-clamp(220px,45vh,450px))] md:max-h-[clamp(350px,55vh,650px)] overflow-y-auto scrollbar-hide p-[clamp(1.5rem,6vw,3rem)] space-y-[clamp(1.5rem,5vh,3rem)] rounded-[inherit] overflow-hidden"
                              >
                                
                                {/* Section 1: Primary Identification */}
                                <div className="space-y-6 md:space-y-10">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                                      Lead Traveler
                                    </span>
                                    <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">
                                      Step 04 / 04
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[clamp(1.5rem,4vw,4rem)] gap-y-8 items-start">
                                    <div className="space-y-3 md:space-y-4 group/id min-w-0">
                                      <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 group-hover/id:text-white/80 transition-colors">
                                        Full Name
                                      </span>
                                      <div className="h-10 flex items-end pb-1 border-b border-white/20 focus-within:border-white/50 transition-all w-full min-w-0">
                                        <input
                                          type="text"
                                          value={customerName}
                                          onChange={(e) => setCustomerName(e.target.value)}
                                          placeholder="Enter your name"
                                          className="w-full bg-transparent text-sm md:text-base font-light text-white placeholder:text-white/30 focus:outline-none transition-all"
                                        />
                                      </div>
                                    </div>

                                    {/* Section 1.5: Flight Concierge Details */}
                                    {(internalPackage?.flights_status === 'included' || internalPackage?.flights_status === 'on_request') && (
                                      <div className="space-y-6 md:space-y-8 p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06] animate-in fade-in slide-in-from-top-4 duration-700">
                                        <div className="flex items-center justify-between">
                                          <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Flight Concierge</span>
                                            <p className="text-[9px] text-white/40 uppercase tracking-widest">Help us find the best routes for you</p>
                                          </div>
                                          <button 
                                            type="button"
                                            onClick={() => setIncludeFlights(!includeFlights)}
                                            className={cn(
                                              "px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all",
                                              includeFlights ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white/5 border-white/10 text-white/40"
                                            )}
                                          >
                                            {includeFlights ? "Assistance Requested" : "Land Only"}
                                          </button>
                                        </div>

                                        {includeFlights && (
                                          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/50">Departure City / Hub</span>
                                            <div className="flex flex-wrap gap-2">
                                              {internalPackage?.departure_cities?.map((city: string) => (
                                                <button
                                                  key={city}
                                                  type="button"
                                                  onClick={() => setDepartureCity(city)}
                                                  className={cn(
                                                    "px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all",
                                                    departureCity === city ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                                                  )}
                                                >
                                                  {city}
                                                </button>
                                              ))}
                                              <input
                                                type="text"
                                                value={internalPackage?.departure_cities?.includes(departureCity) ? "" : departureCity}
                                                onChange={(e) => setDepartureCity(e.target.value)}
                                                placeholder={internalPackage?.departure_cities?.length ? "Other city..." : "Enter departure city"}
                                                className="bg-transparent border-b border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 px-2 min-w-[150px]"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="space-y-4 group/contact min-w-0">
                                      <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 group-hover/contact:text-white/80 transition-colors">
                                        Contact Information
                                      </span>
                                      <div className="flex flex-col gap-6 items-stretch min-w-0">
                                        <div className="flex-1 h-10 flex items-end pb-1 border-b border-white/20 focus-within:border-white/50 transition-all w-full">
                                          <input
                                            type="email"
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="Email address"
                                            className="w-full bg-transparent text-sm md:text-base font-light text-white placeholder:text-white/30 focus:outline-none transition-all"
                                          />
                                        </div>
                                        
                                        {/* Contact Number with Country Selector */}
                                        <div className="flex-1 flex items-center gap-3 h-10 border-b border-white/20 group/phone focus-within:border-white/50 transition-all relative w-full">
                                          <div className="relative mb-1">
                                            <div 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCountryMenuOpen(!countryMenuOpen);
                                              }}
                                              className="flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-white/10 rounded-lg transition-all active:scale-95 bg-white/5"
                                            >
                                              <span className="text-xs">{selectedCountry.flag}</span>
                                              <span className="text-[10px] md:text-xs font-bold text-white/60 group-focus-within/phone:text-white/90">{selectedCountry.code}</span>
                                            </div>
                                            {countryMenuOpen && (
                                              <div className="absolute top-full left-0 mt-2 w-48 max-h-40 overflow-y-auto bg-[#121214] backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-[150] animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 scrollbar-hide">
                                                {[
                                                  { flag: "🇮🇳", code: "+91", name: "India", length: 10 },
                                                  { flag: "🇺🇸", code: "+1", name: "USA", length: 10 },
                                                  { flag: "🇬🇧", code: "+44", name: "UK", length: 10 },
                                                  { flag: "🇦🇪", code: "+971", name: "UAE", length: 9 },
                                                  { flag: "🇸🇬", code: "+65", name: "Singapore", length: 8 },
                                                  { flag: "🇦🇺", code: "+61", name: "Australia", length: 9 },
                                                ].map((c) => (
                                                  <div key={c.name} onClick={() => { setSelectedCountry(c); setCustomerPhone(""); setCountryMenuOpen(false); }} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/10 cursor-pointer transition-colors group/item">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs">{c.flag}</span>
                                                      <span className="text-[10px] font-bold text-white/70 group-hover/item:text-white">{c.name}</span>
                                                    </div>
                                                    <span className="text-[9px] font-black text-white/30 group-hover/item:text-white/50">{c.code}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <input
                                            type="tel"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ""))}
                                            maxLength={selectedCountry.length}
                                            placeholder="Phone number"
                                            onFocus={() => setCountryMenuOpen(false)}
                                            className="flex-1 bg-transparent mb-1 text-sm md:text-base font-light text-white placeholder:text-white/30 focus:outline-none transition-all"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2: Group Manifesto (If > 1 Guest) */}
                                {(adults > 1 || kids > 0 || infants > 0) && (
                                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                                        Group Manifesto
                                      </span>
                                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                                        {adults} {adults === 1 ? 'ADULT' : 'ADULTS'}{kids > 0 ? ` • ${kids} ${kids === 1 ? 'CHILD' : 'CHILDREN'}` : ''}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 md:gap-x-16 gap-y-12">
                                      {/* Additional Adults */}
                                      {Array.from({ length: adults - 1 }).map((_, i) => (
                                        <div key={`adult-${i}`} className="space-y-4 group/guest animate-in fade-in zoom-in-95 duration-500 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] text-white/40 group-hover/guest:text-white/70 transition-colors">
                                              Guest {i + 2} <span className="text-[8px] text-white/20 pl-1">(Adult)</span>
                                            </span>
                                          </div>
                                          <div className="border-b border-white/10 pb-2 focus-within:border-white/40 transition-all w-full min-w-0">
                                            <input
                                              type="text"
                                              placeholder="Full name"
                                              value={additionalGuests[i]?.name || ""}
                                              onChange={(e) => {
                                                const next = [...additionalGuests];
                                                if (next[i]) next[i].name = e.target.value;
                                                setAdditionalGuests(next);
                                              }}
                                              className="w-full bg-transparent text-xs md:text-sm font-light text-white placeholder:text-white/20 focus:outline-none transition-all"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                      
                                      {/* Children */}
                                      {Array.from({ length: kids }).map((_, i) => {
                                        const guestIdx = (adults - 1) + i;
                                        return (
                                          <div key={`child-${i}`} className="space-y-4 group/guest animate-in fade-in zoom-in-95 duration-500">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] text-white/40 group-hover/guest:text-white/70 transition-colors">
                                                Guest {adults + i + 1} <span className="text-[7px] text-white/20 pl-1">(Child)</span>
                                              </span>
                                            </div>
                                            <div className="flex gap-4 border-b border-white/10 pb-2 focus-within:border-white/40 transition-all">
                                              <input
                                                type="text"
                                                placeholder="Full name"
                                                value={additionalGuests[guestIdx]?.name || ""}
                                                onChange={(e) => {
                                                  const next = [...additionalGuests];
                                                  if (next[guestIdx]) next[guestIdx].name = e.target.value;
                                                  setAdditionalGuests(next);
                                                }}
                                                className="flex-[2] bg-transparent text-xs md:text-sm font-light text-white placeholder:text-white/20 focus:outline-none transition-all"
                                              />
                                              <div className="w-[1px] h-3 bg-white/10 my-auto" />
                                              <input
                                                type="text"
                                                placeholder="Age"
                                                value={additionalGuests[guestIdx]?.age || ""}
                                                onChange={(e) => {
                                                  const next = [...additionalGuests];
                                                  if (next[guestIdx]) next[guestIdx].age = e.target.value;
                                                  setAdditionalGuests(next);
                                                }}
                                                className="w-10 bg-transparent text-xs md:text-sm font-light text-white placeholder:text-white/20 focus:outline-none transition-all text-center"
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {/* Infants */}
                                      {Array.from({ length: infants }).map((_, i) => {
                                        const guestIdx = (adults - 1) + kids + i;
                                        return (
                                          <div key={`infant-${i}`} className="space-y-4 group/guest animate-in fade-in zoom-in-95 duration-500">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] text-white/40 group-hover/guest:text-white/70 transition-colors">
                                                Guest {adults + kids + i + 1} <span className="text-[7px] text-white/20 pl-1">(Infant)</span>
                                              </span>
                                            </div>
                                            <div className="flex gap-4 border-b border-white/10 pb-2 focus-within:border-white/40 transition-all">
                                              <input
                                                type="text"
                                                placeholder="Full name"
                                                value={additionalGuests[guestIdx]?.name || ""}
                                                onChange={(e) => {
                                                  const next = [...additionalGuests];
                                                  if (next[guestIdx]) next[guestIdx].name = e.target.value;
                                                  setAdditionalGuests(next);
                                                }}
                                                className="flex-[2] bg-transparent text-xs md:text-sm font-light text-white placeholder:text-white/20 focus:outline-none transition-all"
                                              />
                                              <div className="w-[1px] h-3 bg-white/10 my-auto" />
                                              <input
                                                type="text"
                                                placeholder="Age"
                                                value={additionalGuests[guestIdx]?.age || ""}
                                                onChange={(e) => {
                                                  const next = [...additionalGuests];
                                                  if (next[guestIdx]) next[guestIdx].age = e.target.value;
                                                  setAdditionalGuests(next);
                                                }}
                                                className="w-10 bg-transparent text-xs md:text-sm font-light text-white placeholder:text-white/20 focus:outline-none transition-all text-center"
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Section 3: Protocol Refinements */}
                                <div className="space-y-4 md:space-y-6 group/notes pb-20 md:pb-24">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                                      Special Requests <span className="text-[8px] md:text-[10px] opacity-40 ml-1">(Optional)</span>
                                    </span>
                                  </div>
                                  <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any special desire? Tell us!"
                                    className="w-full h-24 md:h-32 bg-white/[0.03] border border-white/10 rounded-2xl p-4 md:p-6 text-xs md:text-sm font-light tracking-wide text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all resize-none scrollbar-hide shadow-inner"
                                  />
                                </div>
                              </div>

                              {/* Atmospheric Bottom Blur with Subtle Arrow (Sovereign Signal) */}
                              <div className={cn(
                                "absolute bottom-0 left-0 right-0 h-16 md:h-12 pointer-events-none transition-all duration-[1.2s] z-[125] flex flex-col items-center justify-end pb-2 md:pb-12",
                                showScrollIndicator ? "opacity-100" : "opacity-0"
                              )}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
                                <div className="relative z-10 flex flex-col items-center gap-1">
                                  <span className="hidden md:block text-[7px] font-black uppercase tracking-[0.4em] text-white/80 animate-pulse drop-shadow-md">
                                    Scroll
                                  </span>
                                  <div className="animate-[bounce_3s_infinite] drop-shadow-lg">
                                    <ChevronDown size={12} strokeWidth={3} className="text-white/40 md:text-white" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (() => {
            const totalNights = Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / MS_PER_DAY));
            const totalDays = totalNights + 1;
            
            return (
              <div 
                onScroll={handleScroll}
              className="w-full h-full relative z-[210] flex flex-col items-center justify-start p-[clamp(1rem,4vw,2.5rem)] pt-[clamp(10rem,15vh,14rem)] pb-[clamp(10rem,25vh,15rem)] overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-bottom-8 duration-1000 transform-gpu"
            >
              <div className="w-full max-w-5xl flex flex-col items-center space-y-[clamp(1.5rem,4vh,3rem)]">
                
                {/* 1. Cinematic Title Manifest */}
                <div className="text-center space-y-2 md:space-y-4">
                  <h3 className="text-[clamp(1.2rem,6vw,2.8rem)] font-black tracking-tighter text-white uppercase drop-shadow-2xl leading-none">
                    {STATUS_REVIEW}
                  </h3>
                  <p className="text-[clamp(8px,1.5vw,11px)] font-bold uppercase tracking-[0.4em] text-white/60">
                    Double-check your curated details for secure transmission
                  </p>
                </div>

                {/* 2. The Executive Dossier (Unified Curation Card) */}
                <div className="w-full relative">
                  {/* Chromatic Glow: High-Density Neutral Accents */}
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-white/20 via-transparent to-white/10 rounded-[2.5rem] blur opacity-40 transition duration-1000" />
                  
                  <div className="relative w-full bg-black/80 backdrop-blur-3xl border border-white/20 rounded-[2.2rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)]">
                    
                    {/* Dossier Header: Primary Identification */}
                    <div className="w-full p-6 md:p-10 border-b border-white/15 bg-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 text-center md:text-left">
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] text-white/60">Destination</span>
                        <h4 className="text-[clamp(1.25rem,3vw,1.875rem)] text-balance font-black text-white tracking-tight leading-tight">
                          {internalPackage?.title || destination}
                        </h4>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-white/80">
                          <span className="text-[9px] md:text-[11px] font-medium uppercase tracking-[0.2em]">
                            {internalPackage?.location || "Personalized for you"}
                          </span>
                        </div>
                        </div>
                      <div className="flex flex-col items-center gap-3">
                        <div className="px-5 py-2 rounded-full bg-white/[0.08] border border-white/15 flex items-center gap-3 shadow-inner">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                          <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                            {formatDateForDisplay(startDate)} — {formatDateForDisplay(endDate)}
                          </span>
                        </div>
                        {packageData?.flights_status === 'included' && (
                          <div className="px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                            <Plane size={10} className="text-blue-400" />
                            <span className="text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap">Flights Included</span>
                          </div>
                        )}
                        {packageData?.flights_status === 'on_request' && (
                          <div className="px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                            <Plane size={10} className="text-blue-400/80" />
                            <span className="text-[9px] md:text-[10px] font-black text-blue-400/80 uppercase tracking-widest whitespace-nowrap">Flights on Request</span>
                          </div>
                        )}
                        <span className="text-[8px] md:text-[9px] font-bold text-white/50 uppercase tracking-[0.3em]">
                          {DOSSIER_PROTOCOL.LABELS.NIGHTS_DAYS(totalNights, totalDays)}
                        </span>
                      </div>
                    </div>

                    {/* Dossier Body: Curation Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                      
                      {/* Left Column: Lead Information */}
                      <div className="p-8 md:p-12 space-y-12">
                        <div className="space-y-8 flex flex-col items-center">
                          <div className="flex items-center justify-center gap-3 w-full">
                            <div className="w-1 h-5 bg-white/40 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/80">{DOSSIER_PROTOCOL.LABELS.LEAD_TRAVELER}</span>
                            <div className="w-1 h-5 bg-white/40 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                          </div>
                          <div className="space-y-3 w-full">
                            {/* Unified Bar: Full Name */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.08] border border-white/15 shadow-sm text-center gap-1">
                              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">{DOSSIER_PROTOCOL.LABELS.FULL_NAME}</span>
                              <span className="text-[11px] font-black text-white uppercase tracking-widest">{customerName}</span>
                            </div>
                            
                            {/* Unified Bar: Email Address */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.08] border border-white/15 shadow-sm text-center gap-1">
                              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">{DOSSIER_PROTOCOL.LABELS.EMAIL}</span>
                              <span className="text-[10px] font-black text-white/90 break-all tracking-wide">{customerEmail}</span>
                            </div>

                            {/* Unified Bar: Contact Number */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.08] border border-white/15 shadow-sm text-center gap-1">
                              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">{DOSSIER_PROTOCOL.LABELS.CONTACT}</span>
                              <span className="text-[10px] font-black text-white/90 tracking-widest">{selectedCountry.code} {customerPhone}</span>
                            </div>

                            {/* Unified Bar: Departure Hub */}
                            {departureCity && (
                              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm text-center gap-1 animate-in fade-in zoom-in duration-500">
                                <span className="text-[8px] font-black text-emerald-400/60 uppercase tracking-[0.3em]">Departure Hub</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">{departureCity}</span>
                                  {includeFlights && <Plane size={10} className="text-emerald-400/40" />}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {notes && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 flex flex-col items-center">
                            <div className="flex items-center justify-center gap-3 w-full">
                              <div className="w-1 h-5 bg-white/40 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/80">{DOSSIER_PROTOCOL.LABELS.SPECIAL_DESIRES}</span>
                              <div className="w-1 h-5 bg-white/40 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                            </div>
                            <div className="bg-white/[0.04] border border-white/15 rounded-2xl p-6 relative overflow-hidden shadow-sm w-full text-center">
                              <div className="absolute top-0 left-0 right-0 h-1 w-full bg-white/40" />
                              <p className="text-xs md:text-sm font-light text-white leading-relaxed italic">
                                "{notes}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Party Manifest */}
                      <div className="p-8 md:p-12 space-y-8 bg-white/[0.02] flex flex-col items-center">
                        <div className="flex items-center justify-center gap-3 w-full">
                          <div className="w-1 h-5 bg-white/40 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/80">{DOSSIER_PROTOCOL.LABELS.PARTY_MANIFEST}</span>
                          <div className="w-1 h-5 bg-white/40 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                        </div>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.5em] -mt-4">
                          {adults} {adults > 1 ? "Adults" : "Adult"}{kids > 0 ? ` • ${kids}K` : ""}{infants > 0 ? ` • ${infants}I` : ""}
                        </span>

                        <div className="space-y-3 w-full">
                          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.08] border border-white/15 text-center gap-1">
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">{DOSSIER_PROTOCOL.LABELS.GUEST_LEAD}</span>
                            <span className="text-[11px] font-black text-white uppercase tracking-widest">{customerName}</span>
                          </div>
                          {additionalGuests.filter(g => g.name).map((guest, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.08] border border-white/15 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center gap-1">
                              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">
                                {DOSSIER_PROTOCOL.LABELS.GUEST_LABEL(i + 2, guest.type === 'child' ? 'Child' : guest.type === 'infant' ? 'Infant' : 'Adult', guest.age)}
                              </span>
                              <span className="text-[11px] font-black text-white uppercase tracking-widest">{guest.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dossier Footer: Fiscal Summary */}
                    <div className="p-8 md:p-10 bg-white/[0.08] border-t border-white/15 flex flex-col md:flex-row items-center justify-between gap-8">
                      {/* Left Column: Tax Breakdown or Custom Message */}
                      <div className="w-full flex flex-col items-center md:items-start gap-3">
                        {internalPackage?.isCustom ? (
                          <div className="flex flex-col items-center md:items-start gap-1">
                            <span className="text-[7px] md:text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">Investment Profile</span>
                            <span className="text-[10px] md:text-xs font-black text-white/80 uppercase">Handcrafted just for you</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-4">
                            <div className="flex flex-col items-center md:items-start gap-0.5">
                              <span className="text-[7px] md:text-[8px] font-bold text-white/50 uppercase tracking-widest text-center md:text-left">Tour & Services</span>
                              <span className="text-[10px] md:text-xs font-black text-white/80 uppercase whitespace-nowrap">{pricing.symbol}{(pricing.breakdown?.landBase || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start gap-0.5">
                              <span className="text-[7px] md:text-[8px] font-bold text-white/50 uppercase tracking-widest text-center md:text-left">
                                GST ({pricing.taxRate}%)
                              </span>
                              <span className="text-[10px] md:text-xs font-black text-white/80 uppercase">
                                + {pricing.symbol}{(pricing.breakdown?.taxAmount || 0).toLocaleString()}
                              </span>
                            </div>
                            {(pricing.breakdown?.flightNet || 0) > 0 && (
                              <div className="flex flex-col items-center md:items-start gap-0.5">
                                <span className="text-[7px] md:text-[8px] font-bold text-white/50 uppercase tracking-widest text-center md:text-left">Final Airfare</span>
                                <span className="text-[10px] md:text-xs font-black text-white/80 uppercase whitespace-nowrap">+ {pricing.symbol}{(pricing.breakdown?.flightNet || 0).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Column: Itinerary Investment */}
                      <div className="space-y-3 w-full flex flex-col items-center md:items-end text-center md:text-right">
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] text-white/60">{DOSSIER_PROTOCOL.LABELS.INVESTMENT_HEADER}</span>
                        <div className="flex flex-col items-center md:items-end gap-3">
                          <span className="text-[clamp(1.8rem,5vw,3rem)] font-black text-white tracking-tighter tabular-nums leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            {internalPackage?.isCustom ? "Personalized" : totalInvestment}
                          </span>
                          <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 shadow-sm flex items-center justify-center min-w-[120px]">
                            <span className="text-[7px] md:text-[8px] font-black text-white/60 uppercase tracking-[0.3em] text-center leading-none">
                              {internalPackage?.isCustom ? "PRICING ON REQUEST" : DOSSIER_PROTOCOL.LABELS.TOTAL_UNIFIED}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            );
          })()}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center space-y-12 animate-in zoom-in-95 duration-1000">
              <div className="w-20 h-20 rounded-full bg-[#f5f5f7] text-black flex items-center justify-center shadow-2xl">
                <Check size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-[clamp(2.5rem,6vw,3rem)] text-balance font-bold tracking-tight text-white/90 uppercase">
                  {internalPackage?.isCustom ? "Inquiry Received" : DOSSIER_PROTOCOL.FALLBACKS.ESTABLISHED_TITLE}
                </h3>
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80 pl-[0.4em]">
                    Reference ID: {requestId || `${DOSSIER_PROTOCOL.FALLBACKS.REFERENCE_PREFIX}${bookingId?.split("-")[0].toUpperCase()}`}
                  </p>
                  <div className="h-[1px] w-12 bg-white/20" />
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">
                      {internalPackage?.isCustom ? "Handcrafting Your Journey" : "Your Journey Begins Here"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  startClosing();
                  // Reset state for next time
                  setTimeout(() => {
                    setStep(1);
                    setDiscoveryPhase(packageData ? 2 : 1);
                    setBookingId(null);
                    setInternalPackage(packageData);
                    setDestination("");
                  }, 500);
                }}
                className="px-20 py-5 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white/90 hover:bg-[#f5f5f7] hover:text-black transition-all shadow-lg"
              >
                {DOSSIER_PROTOCOL.FALLBACKS.CLOSE_ACTION}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. PROGRESSIVE BOTTOM MASK (MIRRORED iOS STYLE) */}
      {((step === 1 && discoveryPhase > 1) || step === 2) && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 md:h-48 transition-all duration-1000 backdrop-blur-sm z-[110] transform-gpu will-change-[opacity,backdrop-filter] animate-in fade-in duration-1000"
          style={{
            opacity: 0.95,
            background:
              "linear-gradient(to top, #0a0a0b 0%, #0a0a0b 45%, rgba(10,10,11,0.8) 70%, rgba(10,10,11,0) 100%)",
            maskImage:
              "linear-gradient(to top, black 0%, black 45%, rgba(0,0,0,0.8) 75%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, black 45%, rgba(0,0,0,0.8) 75%, transparent 100%)",
          }}
        />
      )}

      {/* 5. PRECISION PILL MANIFEST (SOVEREIGN COCKPIT - LIQUID SPRING) */}
      {((step === 1 && discoveryPhase > 1) || step === 2) && (
        <>
          {/* Liquid Morphing Filter Definition */}
          <svg className="hidden">
            <defs>
              <filter id="pill-goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>
            </defs>
          </svg>

          <div className="absolute bottom-4 md:bottom-8 left-0 right-0 px-4 md:px-10 z-[120] pointer-events-none flex justify-center animate-in slide-in-from-bottom-12 duration-[1.2s] cubic-bezier(0.23,1,0.32,1)">
            <div 
              ref={pillRef}
              className="relative flex items-center justify-between p-2 rounded-full pointer-events-auto mx-auto transform-gpu will-change-[width,transform] w-fit overflow-hidden"
              style={{ gap: 'clamp(0.25rem, 2vw, 2rem)' }}
              onMouseMove={(e) => handleGlowMove(e.clientX, e.clientY)}
              onMouseEnter={(e) => handleGlowMove(e.clientX, e.clientY)}
              onMouseLeave={handleGlowLeave}
              onTouchStart={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => handleGlowMove(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={handleGlowLeave}
            >
              {/* ════ PHYSICAL JELLY SHELL ════ */}
              <div 
                ref={jellyRef}
                className="absolute inset-0 bg-black/95 backdrop-blur-[40px] border border-white/20 rounded-full shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-[border-color] duration-300 pointer-events-none"
              />

              {/* iOS 26 Pointer-Tracking Glow Overlay */}
              <div 
                ref={glowRef}
                className="absolute inset-0 rounded-full pointer-events-none z-[1] transition-opacity duration-300"
                style={{ opacity: 0, mixBlendMode: 'screen' }}
              />

              {/* 
                  SOVEREIGN UNIFIED MANIFEST ENGINE
                  Liquid scaling with horizontal 'Marquee' scroll for extreme narrowness
              */}
              <div className={cn(
                "min-w-0 scrollbar-hide scroll-smooth relative z-10 transition-[mask-image]",
                isOverflowing ? "overflow-x-auto scroll-snap-x" : "overflow-x-hidden",
                isOverflowing && scrollMask === 'right' && "mask-fade-right",
                isOverflowing && scrollMask === 'left' && "mask-fade-left",
                isOverflowing && scrollMask === 'both' && "mask-fade-both",
                (!isOverflowing || scrollMask === 'none') && "mask-none"
              )}>
                <div 
                  ref={segmentsRef} 
                  className="flex items-center justify-start md:justify-center w-fit"
                  style={{ gap: 'clamp(4px, 0.5vw, 8px)' }}
                >
              
                {/* Segment 1: Terminal Investment */}
                <div className={cn(
                  "flex flex-col items-center justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] island-enter min-w-fit shrink-0 snap-center",
                  (discoveryPhase === 4 || step === 2) ? "opacity-100 scale-100" : "opacity-65 scale-[0.98]"
                )} style={{ padding: '0 clamp(0.4rem, 2vw, 2rem)', gap: 'clamp(1px, 0.4vw, 6px)' }}>
                  <span className="font-black uppercase text-white/50 whitespace-nowrap text-center" style={{ fontSize: 'clamp(5px, 1vw, 8px)', letterSpacing: 'clamp(0.1em, 0.5vw, 0.4em)' }}>
                    {isMobile ? (internalPackage?.isCustom ? 'Quote' : 'Cost') : (internalPackage?.isCustom ? 'Personalized Pricing' : 'Itinerary Cost')}
                  </span>
                  <div className="flex items-center justify-center" style={{ gap: 'clamp(4px, 1vw, 12px)' }}>
                    <p className="font-bold tracking-tighter text-white leading-none tabular-nums whitespace-nowrap" style={{ fontSize: 'clamp(10px, 2.5vw, 1.8rem)' }}>
                      {internalPackage?.isCustom ? "Upon Request" : totalInvestment}
                    </p>
                    {!internalPackage?.isCustom && (
                      <span className="font-bold uppercase tracking-wider text-white/35 leading-none whitespace-nowrap" style={{ fontSize: 'clamp(5px, 0.8vw, 8px)' }}>
                        incl. tax
                      </span>
                    )}
                  </div>
                </div>

                {/* Segment 2: Timeline Spawning */}
                {startDate && endDate && (
                  <div className={cn(
                    "flex flex-col items-center justify-center border-l border-white/10 transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] island-enter min-w-fit shrink-0 will-change-[opacity,transform] snap-center",
                    discoveryPhase === 2 ? "opacity-100 scale-100" : "opacity-65 scale-[0.98]"
                  )} style={{ padding: '0 clamp(0.4rem, 2vw, 2rem)', gap: 'clamp(2px, 0.5vw, 6px)' }}>
                    <span className="font-black uppercase text-white/50 whitespace-nowrap text-center" style={{ fontSize: 'clamp(5px, 1vw, 8px)', letterSpacing: 'clamp(0.1em, 0.5vw, 0.4em)' }}>
                      Timeline
                    </span>
                    <div className="flex items-center justify-center whitespace-nowrap" style={{ gap: 'clamp(3px, 1.2vw, 20px)' }}>
                      <span className="font-bold text-white/95 tracking-tighter tabular-nums uppercase" style={{ fontSize: 'clamp(8px, 1.8vw, 14px)' }}>
                        {formatDateForDisplay(startDate, isMobile)}
                      </span>
                      <div className="h-[1px] bg-white/30 shrink-0" style={{ width: 'clamp(4px, 1.5vw, 2rem)' }} />
                      <span className="font-bold text-white/95 tracking-tighter tabular-nums uppercase" style={{ fontSize: 'clamp(8px, 1.8vw, 14px)' }}>
                        {formatDateForDisplay(endDate, isMobile)}
                      </span>
                    </div>
                    {(() => {
                      const nights = Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / MS_PER_DAY));
                      return (
                        <span className="font-bold uppercase tracking-wider text-white/35 whitespace-nowrap" style={{ fontSize: 'clamp(5px, 0.8vw, 7px)' }}>
                          {nights}N / {nights + 1}D
                        </span>
                      );
                    })()}
                  </div>
                )}

                {/* Segment 3: Manifest Spawning */}
                {discoveryPhase >= 3 && (
                  <div className={cn(
                    "flex flex-col items-center justify-center border-l border-white/10 transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] island-enter min-w-fit shrink-0 will-change-[opacity,transform] snap-center",
                    discoveryPhase === 3 ? "opacity-100 scale-100" : "opacity-65 scale-[0.98]"
                  )} style={{ padding: '0 clamp(0.4rem, 2vw, 2rem)', gap: 'clamp(1px, 0.4vw, 6px)' }}>
                    <span className="font-black uppercase text-white/50 whitespace-nowrap text-center" style={{ fontSize: 'clamp(5px, 1vw, 8px)', letterSpacing: 'clamp(0.1em, 0.5vw, 0.4em)' }}>
                      Guests
                    </span>
                    <div className="flex items-center justify-center whitespace-nowrap" style={{ gap: 'clamp(3px, 1vw, 12px)' }}>
                      <span className="font-bold text-white/95 tracking-tighter leading-none uppercase text-center" style={{ fontSize: 'clamp(8px, 1.8vw, 14px)' }}>
                        {adults} {adults <= 1 ? "Adult" : "Adults"}
                        {(kids > 0 || infants > 0) && (
                          <>
                            <span className="mx-1 text-white/20">|</span>
                            {kids + infants} {kids + infants === 1 ? "Child" : "Children"}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Right: Action Button Area (Surgically Merged) */}
              <div ref={actionRef} className="flex items-center justify-end border-white/10 shrink-0" style={{ paddingLeft: 'clamp(0px, 1vw, 16px)' }}>
                {discoveryPhase > 1 && (
                  <Magnetic>
                    <button
                      onClick={() => {
                        if (!isPhaseValid || isSubmitting) return;
                        if (step === 2) {
                          submitBooking();
                        } else if (discoveryPhase === 4) {
                          setStep(2);
                        } else {
                          nextPhase();
                        }
                      }}
                      disabled={isSubmitting || !isPhaseValid}
                      className={cn(
                        "group/btn relative overflow-hidden h-10 w-10 md:h-12 md:w-12 xl:h-14 xl:w-auto rounded-full transition-all duration-700 active:scale-95 flex items-center justify-center shrink-0 flex-none",
                        isPhaseValid 
                          ? "bg-white text-black shadow-[0_15px_40px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_20px_50px_-10px_rgba(255,255,255,0.5)] opacity-100" 
                          : "bg-white/10 text-white/20 cursor-not-allowed border border-white/5 opacity-50",
                        discoveryPhase >= 2 && "xl:px-10"
                      )}
                    >
                      <div className="relative z-10 flex items-center justify-center gap-0 xl:gap-2.5">
                        <span className="hidden xl:block text-[9px] xl:text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap animate-in fade-in duration-700">
                          {step === 2 ? (isSubmitting ? "Orchestrating..." : (internalPackage?.isCustom ? "Submit Inquiry" : "Secure My Journey")) : 
                           discoveryPhase === 4 ? (internalPackage?.isCustom ? "Review Details" : "Review Selection") : 
                           discoveryPhase === 3 ? (internalPackage?.isCustom ? "Preferences" : "Define Manifest") : "Next"}
                        </span>
                        <ChevronRight 
                          size={20} 
                          strokeWidth={3} 
                          className="text-black group-hover/btn:translate-x-0.5 xl:group-hover/btn:translate-x-1 transition-transform shrink-0" 
                        />
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                  </Magnetic>
                )}
              </div>
          </div>
        </div>
      </>
      )}
    </div>
  );
});
