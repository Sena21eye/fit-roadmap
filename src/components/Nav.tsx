"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    // { href: "/onboarding", label: "Onboarding" }, // ← 非表示でOKならコメントアウト
    { href: "/today", label: "Today" },
    // { href: "/roadmap", label: "Roadmap" },       // ← 非表示でOKならコメントアウト
    { href: "/progress", label: "Progress" },
    { href: "/profile", label: "Profile" },
  ];

  const handleReset = () => {
    if (!confirm("デモデータを初期化します。よろしいですか？")) return;

    // デモで使っているキーだけクリア（全部消してOKなら localStorage.clear() でも可）
    [
      "demo_xp","demo_streak","demo_last_done","demo_history",
      "onboarding_form","bodyWeight","sessionsDone","schedule_map",
      "onboarding_done"
    ].forEach(k => localStorage.removeItem(k));

    router.push("/onboarding");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-3">
        <div className="flex gap-2">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${active
                    ? "bg-amber-500 text-white"
                    : "text-foreground hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  }`}
                data-active={active}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* 右側：デモリセット */}
        <button
          onClick={handleReset}
          className="text-xs rounded-md px-2 py-1 border hover:bg-amber-50"
          title="ローカルのデモデータを初期化します"
        >
          デモリセット
        </button>
      </div>
    </nav>
  );
}