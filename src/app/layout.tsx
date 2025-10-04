import type { ReactNode } from "react";
import "./globals.css";
import Nav from "@/components/Nav";
import { Toaster } from "@/components/ui/sonner";
import { Inter, Noto_Sans_JP } from "next/font/google";
import type { Metadata } from "next";

// ✅ ここで import する（別ファイルにある）
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto" });

export const metadata: Metadata = {
  title: "Fit Roadmap",
  description: "Goal → Roadmap → Today",
  themeColor: "#ec4899",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* PWA 関連 */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#ec4899" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={[
          "min-h-screen antialiased",
          inter.variable,
          noto.variable,
          "bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(245,158,11,0.12),transparent),radial-gradient(900px_500px_at_90%_10%,rgba(245,158,11,0.08),transparent)]",
          "bg-white dark:bg-neutral-950",
          "text-neutral-900 dark:text-neutral-100",
        ].join(" ")}
      >
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <Toaster />

        {/* ✅ SW 登録コンポーネントを呼び出し */}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}