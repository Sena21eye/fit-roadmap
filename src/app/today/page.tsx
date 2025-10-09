// src/app/today/page.tsx
"use client";

import { useEffect, useState } from "react";
import Today from "@/components/Today";
import { generateMenu, type OnboardingInput } from "@/lib/menu";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Types used only in this page
export type InitialPlanItem = {
  name: string;
  targetSets: number;
  targetReps: number | string;
  suggestedWeight?: number;
};

// To avoid `any` in callback typing
type CompletedSet = { reps: number | string; weight?: number; completed: boolean };
type WorkoutExercise = { name: string; actualSets: CompletedSet[] };

export default function TodayPage() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [initialPlan, setInitialPlan] = useState<InitialPlanItem[] | null>(null);
  const [isWorkoutDay, setIsWorkoutDay] = useState<boolean | null>(null);

  useEffect(() => {
    // XP / ストリーク復元（デモ保存）
    const x = Number(localStorage.getItem("demo_xp") ?? "0");
    const s = Number(localStorage.getItem("demo_streak") ?? "0");
    setXp(x);
    setStreak(s);

    // Onboarding からの入力（ローカル）
    const formRaw = localStorage.getItem("onboarding_form");
    const form = formRaw ? JSON.parse(formRaw) : null;

    // ---- OnboardingInput を構築（新フォーマットに対応） ----
    const experience = (form?.experience ??
      "ほとんど運動していない") as OnboardingInput["experience"];

    // goals は複数選択（日本語ラベルの配列を想定）
    const goals = (Array.isArray(form?.goals) ? form.goals : []) as OnboardingInput["goals"];

    // barriers は配列（例: ["gym","heavy"]）
    const barriers = (Array.isArray(form?.barriers) ? form.barriers : []) as OnboardingInput["barriers"];

    // duration は "10" | "20-30" | "45+"
    const duration = ((form?.duration as OnboardingInput["duration"]) ?? "20-30") as OnboardingInput["duration"];

    // 体重は任意。なければ 50kg として推定
    const bodyWeight = Number(
      form?.bodyWeight ?? localStorage.getItem("bodyWeight") ?? 50
    );

    // 進捗（セッション実施回数）
    const sessionsDone = Number(localStorage.getItem("sessionsDone") ?? "0");

    const input: OnboardingInput = {
      experience,
      goals,
      barriers,
      duration,
    };

    const plan = generateMenu(input, bodyWeight, { sessionsDone });
    setInitialPlan(
      plan.map((p) => ({
        name: p.name,
        targetSets: p.targetSets,
        targetReps: p.targetReps,
        suggestedWeight:
          typeof p.weight === "number"
            ? Math.round(p.weight * 2) / 2
            : undefined,
      }))
    );

    // 今日はトレーニング日か？（Firestore → localStorage の順で判定）
    const stop = onAuthStateChanged(auth, async (user) => {
      try {
        let schedule: string[] = [];

        if (user) {
          const ref = doc(db, "users", user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as { schedule?: string[] };
            if (Array.isArray(data.schedule)) {
              schedule = data.schedule;
            }
          }
        }

        // Firestore に無ければ localStorage を参照
        if (schedule.length === 0) {
          // 1) schedule_map 形式（{ "月": true, ... }）
          try {
            const mapRaw = localStorage.getItem("schedule_map");
            const map = mapRaw ? JSON.parse(mapRaw) : null;
            if (map && typeof map === "object") {
              schedule = Object.keys(map).filter((k) => !!(map as Record<string, boolean>)[k]);
            }
          } catch {
            /* noop */
          }
          // 2) onboarding_form.schedule 形式（["月","水","金"]）
          if (schedule.length === 0 && form?.schedule && Array.isArray(form.schedule)) {
            schedule = form.schedule as string[];
          }
        }

        const today = ["日", "月", "火", "水", "木", "金", "土"][new Date().getDay()];
        setIsWorkoutDay(schedule.includes(today));
      } catch {
        // 失敗時は安全側で休息日に
        setIsWorkoutDay(false);
      }
    });

    return () => stop();
  }, []);

  const onWorkoutComplete = (workout: WorkoutExercise[]) => {
    const anyDone = Array.isArray(workout)
      ? workout.some((ex) => ex.actualSets?.some((s) => s.completed))
      : false;
    if (!anyDone) return;

    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem("demo_last_done");

    const nextXp = xp + 10;
    const nextStreak = last === today ? streak : streak + 1;

    setXp(nextXp);
    setStreak(nextStreak);
    localStorage.setItem("demo_xp", String(nextXp));
    localStorage.setItem("demo_streak", String(nextStreak));
    localStorage.setItem("demo_last_done", today);

    const historyRaw = localStorage.getItem("demo_history");
    const history: Array<{ date: string; items: Array<{ exercise: string; reps: number | string; weight?: number; completed: boolean }> }> = historyRaw ? JSON.parse(historyRaw) : [];
    history.push({
      date: today,
      items: workout.flatMap((ex) =>
        ex.actualSets.map((s) => ({
          exercise: ex.name,
          reps: s.reps,
          weight: s.weight,
          completed: s.completed,
        }))
      ),
    });
    localStorage.setItem("demo_history", JSON.stringify(history));

    // progression: セッション完了ごとにカウント+1（次回の推奨重量/回数が少し上がる）
    const cur = Number(localStorage.getItem("sessionsDone") ?? "0");
    localStorage.setItem("sessionsDone", String(cur + 1));
  };

  // 読み込み中
  if (isWorkoutDay === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-pink-700">
        読み込み中…
      </div>
    );
  }

  // 休息日
  if (!isWorkoutDay) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-pink-800 mb-2">今日は休息日です🛌</h1>
        <p className="text-pink-700">「プロフィール &gt; 運動する曜日」で設定を変更できます。</p>
      </div>
    );
  }

  // トレーニング日
  return (
    <Today
      xp={xp}
      streak={streak}
      onWorkoutComplete={onWorkoutComplete}
      initialPlan={initialPlan ?? undefined}
    />
  );
}