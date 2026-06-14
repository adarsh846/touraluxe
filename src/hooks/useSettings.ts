"use client";

import { useState, useEffect } from "react";
import { getSettings } from "@/lib/settingsCache";

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then((data) => {
        setSettings(data as Record<string, string>);
      })
      .catch((err) => {
        console.error("Failed to fetch settings:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}
