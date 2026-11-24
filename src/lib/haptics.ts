/**
 * TouraLuxe Native Apple Taptic & Vibration Haptics Bridge
 * Dynamically interfaces with @capacitor/haptics for Apple Taptic Engine feedback,
 * with graceful fallback to the Web Vibration API on supported mobile browsers.
 */

export type HapticImpactStyle = "light" | "medium" | "heavy" | "selection";

export async function triggerHaptic(style: HapticImpactStyle = "light"): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // Dynamic import to prevent SSR and bundle-time failures
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");

    if (style === "selection") {
      await Haptics.selectionChanged();
      return;
    }

    const impactMap: Record<"light" | "medium" | "heavy", typeof ImpactStyle[keyof typeof ImpactStyle]> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };

    await Haptics.impact({ style: impactMap[style] });
  } catch {
    // Fallback: Web Vibration API for Android and standard mobile browsers
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        if (style === "light" || style === "selection") {
          navigator.vibrate(10);
        } else if (style === "medium") {
          navigator.vibrate(22);
        } else {
          navigator.vibrate(40);
        }
      } catch {
        // Silently ignore if vibration is blocked by user policy
      }
    }
  }
}
