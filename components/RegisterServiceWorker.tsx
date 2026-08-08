"use client";

import { useEffect } from "react";

/** §21 — registra o service worker (Serwist) para a PWA instalável ficar disponível. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    import("@serwist/window").then(({ Serwist }) => {
      const serwist = new Serwist("/sw.js");
      serwist.register();
    });
  }, []);

  return null;
}
