"use client";

import { useEffect } from "react";

export function NativeAppBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cleanupBackButton: (() => void) | undefined;

    // Dynamically initialize Capacitor native runtime features
    async function initNativeRuntime() {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#000000" });
      } catch {
        // Not running inside native runtime or plugin unavailable
      }

      try {
        const { App } = await import("@capacitor/app");
        const backListener = await App.addListener("backButton", ({ canGoBack }) => {
          // If a modal or mobile search is open, dispatch custom event or history back
          const isSearchOpen = document.querySelector("[data-mobile-search-open='true']");
          if (isSearchOpen) {
            window.dispatchEvent(new CustomEvent("close-mobile-search"));
            return;
          }

          if (canGoBack && window.history.length > 1) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });

        cleanupBackButton = () => {
          backListener.remove();
        };
      } catch {
        // Silent fallback
      }

      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        // Hide splash screen after a brief settle to avoid flashing
        const hideSplash = () => {
          SplashScreen.hide({ fadeOutDuration: 400 });
        };

        if ((window as any).preloaderPlayed) {
          hideSplash();
        } else {
          window.addEventListener("preloaderComplete", hideSplash, { once: true });
        }
      } catch {
        // Silent fallback
      }
    }

    initNativeRuntime();

    return () => {
      if (cleanupBackButton) cleanupBackButton();
    };
  }, []);

  return null;
}
