// src/middleware.ts
import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();

  // localStorage は使えないので Cookie で制御する想定
  const onboardingDone = req.cookies.get("onboarding_done")?.value;

  // Onboarding未完了かつ今が /onboarding 以外 → リダイレクト
  if (!onboardingDone && !url.pathname.startsWith("/onboarding")) {
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// すべてのルートでチェック
export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};