// src/components/ServiceWorkerRegister.tsx
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // ページ読み込み後にSW登録
    const onLoad = () => {
      navigator.serviceWorker
        // next-pwa のデフォルトは /sw.js（あなたの設定に合わせて必要なら変更）
        .register("/sw.js")
        .catch((err) => console.error("SW register failed:", err));
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}