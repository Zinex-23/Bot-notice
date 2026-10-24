"use client";

import { useEffect } from "react";

export function TelegramWebAppInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        try {
          tg.ready();
          tg.expand();
          // Set header color matching the app
          if (tg.setHeaderColor) {
            tg.setHeaderColor("#2563eb");
          }
        } catch (e) {
          console.warn("Telegram WebApp initialization error:", e);
        }
      }
    }
  }, []);

  return null;
}
