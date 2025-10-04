// src/app/progress/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Progress from "@/components/progress";

type HistoryItem = {
  date?: string; // "YYYY-MM-DD"
  items?: Array<{
    exercise?: string;
    reps?: string | number;
    weight?: string | number;
    completed?: boolean;
  }>;
};

export default function ProgressPage() {
  const [streak, setStreak] = useState(0);
  const [hist, setHist] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const s = Number(localStorage.getItem("demo_streak") ?? "0");
    setStreak(Number.isFinite(s) ? s : 0);

    // Today側で保存している想定の履歴（壊れていても落ちない）
    let arr: HistoryItem[] = [];
    try {
      const raw = localStorage.getItem("demo_history");
      arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) arr = [];
    } catch {
      arr = [];
    }
    setHist(arr);
  }, []);

  // 集計は useMemo で算出
  const { totalWorkouts, totalSets, totalWeight } = useMemo(() => {
    // 「ワークアウト回数」= その日1セットでも完了してたら1回
    const byDate = new Map<string, boolean>();
    let sets = 0;
    let volume = 0; // 重量×回数の総和（= トレーニングボリューム）

    for (const h of hist) {
      const date = h.date ?? "";
      const items = Array.isArray(h.items) ? h.items : [];
      const anyDone = items.some((it) => !!it.completed);
      if (anyDone && date) byDate.set(date, true);

      for (const it of items) {
        if (!it?.completed) continue;
        const w = Number(it.weight ?? 0);
        const r = Number(it.reps ?? 0);
        sets += 1;
        if (Number.isFinite(w) && Number.isFinite(r)) {
          volume += w * r;
        }
      }
    }

    return {
      totalWorkouts: byDate.size, // 日付単位でユニークカウント
      totalSets: sets,
      totalWeight: volume, // Progress側では「総重量(kg)」表示。体感的にOK
    };
  }, [hist]);

  return (
    <Progress
      streak={streak}
      workoutHistory={hist}
      totalWorkouts={totalWorkouts}
      totalSets={totalSets}
      totalWeight={totalWeight}
    />
  );
}