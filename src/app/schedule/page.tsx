"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  weekStartMonday,
  loadWeekPlan,
  saveWeekPlan,
  copyLastWeekIfAny,
  type WeekPlan,
} from "@/lib/storage";

function emptyPlan(weekStartISO: string): WeekPlan {
  return {
    weekStartISO,
    sessionsPerWeek: 3,
    days: [true, false, true, false, true, false, false], // Mon/Wed/Fri 初期ON
  };
}

export default function SchedulePage() {
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10));
  const [weekStartISO, setWeekStartISO] = useState(() => weekStartMonday(todayIso));
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [saved, setSaved] = useState<null | "ok" | "ng">(null);

  useEffect(() => {
    const p = loadWeekPlan(weekStartISO) ?? copyLastWeekIfAny(weekStartISO) ?? emptyPlan(weekStartISO);
    setPlan(p);
  }, [weekStartISO]);

  const toggleDay = (idx: number) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = { ...prev, days: prev.days.slice() };
      next.days[idx] = !next.days[idx];
      return next;
    });
  };

  const onSave = () => {
    try {
      if (plan) saveWeekPlan(plan);
      setSaved("ok");
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setSaved("ng");
      setTimeout(() => setSaved(null), 2000);
    }
  };

  const label = useMemo(() => {
    const d = new Date(weekStartISO + "T00:00:00");
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    return `${mm}/${dd} 週`;
  }, [weekStartISO]);

  return (
    <main className="mx-auto w-full max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <div className="text-sm text-neutral-500">{label}</div>
      </header>

      {!plan ? (
        <p className="text-sm text-neutral-500">読み込み中…</p>
      ) : (
        <section className="card p-5 space-y-3">
          <div className="text-sm">月曜はじまりの週です。ONの日がトレーニング日になります。</div>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {["月", "火", "水", "木", "金", "土", "日"].map((d, i) => (
              <button
                key={d}
                className={
                  "rounded border px-2 py-3 " +
                  (plan.days[i] ? "bg-emerald-500 text-white" : "bg-white")
                }
                onClick={() => toggleDay(i)}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={onSave}
              className="rounded-full px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 text-sm"
            >
              保存
            </button>
          </div>

          {saved && (
            <div
              className={
                "rounded-md p-2 text-sm " +
                (saved === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")
              }
            >
              {saved === "ok" ? "保存しました" : "保存に失敗しました"}
            </div>
          )}
        </section>
      )}

      <nav className="text-sm text-neutral-500">
        <a className="underline underline-offset-4 hover:opacity-80" href="/today">
          Todayへ戻る
        </a>
      </nav>
    </main>
  );
}