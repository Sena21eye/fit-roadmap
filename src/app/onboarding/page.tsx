"use client";

import { useRouter } from "next/navigation";
import { Onboarding } from "@/components/Onboarding";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <Onboarding
      onComplete={(data) => {
        try {
          const expires = new Date();
          expires.setDate(expires.getDate() + 30);
          document.cookie = `onboarding_done=true; expires=${expires.toUTCString()}; path=/`;
        } catch {}
        router.push("/today");
      }}
    />
  );
}
