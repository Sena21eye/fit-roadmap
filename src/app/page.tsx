// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // localStorage がない環境は一旦 Today へ
    if (typeof window === "undefined") {
      router.replace("/today");
      return;
    }
    const done = localStorage.getItem("onboarding_done");
    router.replace(done ? "/today" : "/onboarding");
  }, [router]);

  // 何も描画しない（瞬時にリダイレクト）
  return null;
}