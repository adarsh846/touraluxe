/**
 * TouraLuxe Apple HIG Haptics Engine (Native + High-Precision Web)
 *
 * 1. Native iOS / Android (Capacitor): Uses UIImpactFeedbackGenerator,
 *    UISelectionFeedbackGenerator, and UINotificationFeedbackGenerator.
 * 2. Android Web (Chrome/Edge/Firefox): Fires synchronously inside the user
 *    gesture with micro-calibrated pulses (6ms–24ms) tuned for linear motors.
 * 3. iOS Safari 17.4+ Web: Fires synchronously via a hidden native
 *    <input type="checkbox" switch> toggle to trigger real Apple Taptic feedback.
 */

export type HapticImpactStyle =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

type HapticsModule = typeof import("@capacitor/haptics");

let cachedHaptics: HapticsModule | null = null;
let loadingHaptics: Promise<HapticsModule | null> | null = null;
let lastHapticTime = 0;

// Hidden iOS 17.4+ native switch elements for Safari Taptic Engine fallback
let iosSwitchLabel: HTMLLabelElement | null = null;

const WEB_VIBRATION_PATTERNS: Record<HapticImpactStyle, number | number[]> = {
  selection: 6,
  light: 10,
  medium: 16,
  heavy: [24, 16, 12],
  success: [10, 48, 22],
  warning: [18, 42, 14],
  error: [22, 36, 22, 36, 30],
};

function isNativeCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

function preloadCapacitorHaptics(): Promise<HapticsModule | null> {
  if (cachedHaptics) return Promise.resolve(cachedHaptics);
  if (loadingHaptics) return loadingHaptics;
  loadingHaptics = import("@capacitor/haptics")
    .then((mod) => {
      cachedHaptics = mod;
      return mod;
    })
    .catch(() => null);
  return loadingHaptics;
}

function isIOSSafariFamily(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function triggerIOSSafariTaptic(): void {
  if (typeof document === "undefined" || !document.body) return;
  try {
    if (!iosSwitchLabel || !document.body.contains(iosSwitchLabel)) {
      const id = "touraluxe-ios-taptic-switch";
      const existingLabel = document.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
      if (existingLabel) {
        iosSwitchLabel = existingLabel;
      } else {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = id;
        input.setAttribute("switch", "");
        input.setAttribute("aria-hidden", "true");
        input.tabIndex = -1;
        input.style.cssText =
          "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;margin:0;padding:0;";

        const label = document.createElement("label");
        label.htmlFor = id;
        label.setAttribute("aria-hidden", "true");
        label.style.cssText =
          "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";

        document.body.appendChild(input);
        document.body.appendChild(label);
        iosSwitchLabel = label;
      }
    }
    // Synchronous click inside user gesture triggers native iOS 17.4+ switch Taptic tap
    iosSwitchLabel.click();
  } catch {
    // Ignore if browser blocks programmatic switch click
  }
}

async function fireNativeHaptic(mod: HapticsModule, style: HapticImpactStyle): Promise<void> {
  const { Haptics, ImpactStyle, NotificationType } = mod;
  switch (style) {
    case "selection":
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
      return;
    case "light":
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    case "medium":
      await Haptics.impact({ style: ImpactStyle.Medium });
      return;
    case "heavy":
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return;
    case "success":
      await Haptics.notification({ type: NotificationType.Success });
      return;
    case "warning":
      await Haptics.notification({ type: NotificationType.Warning });
      return;
    case "error":
      await Haptics.notification({ type: NotificationType.Error });
      return;
  }
}

export function triggerHaptic(style: HapticImpactStyle = "light"): void {
  if (typeof window === "undefined") return;

  // Prevent double-firing when pointerdown and click fire back-to-back (< 20ms)
  const now = performance.now();
  if (now - lastHapticTime < 20) return;
  lastHapticTime = now;

  // 1. Native Capacitor Path (iOS Taptic Engine & Android Native Vibrator)
  if (isNativeCapacitor()) {
    if (cachedHaptics) {
      void fireNativeHaptic(cachedHaptics, style).catch(() => {});
    } else {
      void preloadCapacitorHaptics().then((mod) => {
        if (mod) void fireNativeHaptic(mod, style).catch(() => {});
      });
    }
    return;
  }

  // 2. Synchronous Mobile Web Path (preserves browser UserActivation token)
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      const vibrated = navigator.vibrate(WEB_VIBRATION_PATTERNS[style]);
      if (vibrated) return;
    } catch {
      // Fall through to iOS Safari switch fallback
    }
  }

  // 3. iOS 17.4+ Safari Web Taptic Switch Fallback
  if (isIOSSafariFamily()) {
    triggerIOSSafariTaptic();
  }
}

/**
 * Installs a global touch-only tap haptic fallback for all interactive buttons,
 * links, and cards across the app. Only fires on completed taps (never on scroll)
 * and automatically yields to any component-level custom scenario haptic.
 */
export function installGlobalTouchHaptics(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  let pointerDownHandled = false;

  const isTouchEnvironment = (): boolean =>
    isNativeCapacitor() ||
    (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches);

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType && e.pointerType !== "touch" && e.pointerType !== "pen") {
      pointerDownHandled = false;
      return;
    }
    // Bubble phase: React's onPointerDown has already run if the button had one
    pointerDownHandled = performance.now() - lastHapticTime < 40;
  };

  const onClick = (e: MouseEvent) => {
    const handledByPointerDown = pointerDownHandled;
    pointerDownHandled = false;

    if (!isTouchEnvironment()) return;
    if (handledByPointerDown) return;
    // Bubble phase: React's onClick custom scenario haptic has already run if present
    if (performance.now() - lastHapticTime < 80) return;

    const target = e.target as Element | null;
    if (!target || typeof target.closest !== "function") return;

    const interactive = target.closest(
      'button, a[href], [role="button"], summary, [data-haptic]'
    );
    if (!interactive) return;
    if (interactive.closest("[data-no-haptic]")) return;
    if (
      (interactive as HTMLButtonElement).disabled ||
      interactive.getAttribute("aria-disabled") === "true"
    ) {
      return;
    }

    const customStyle = interactive.getAttribute("data-haptic") as HapticImpactStyle | null;
    triggerHaptic(customStyle || "light");
  };

  document.addEventListener("pointerdown", onPointerDown, { passive: true });
  document.addEventListener("click", onClick, { passive: true });

  return () => {
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("click", onClick);
  };
}
