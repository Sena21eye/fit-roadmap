// src/app/today/page.tsx
"use client";

import { useEffect, useState } from "react";
import Today from "@/components/Today";
import { generateMenu, type OnboardingInput } from "@/lib/menu";

type InitialPlanItem = {
  name: string;
  targetSets: number;
  targetReps: number | string;
  suggestedWeight?: number;
};

export default function TodayPage() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [initialPlan, setInitialPlan] = useState<InitialPlanItem[] | null>(null);

  useEffect(() => {
    const x = Number(localStorage.getItem("demo_xp") ?? "0");
    const s = Number(localStorage.getItem("demo_streak") ?? "0");
    setXp(x);
    setStreak(s);

    const formRaw = localStorage.getItem("onboarding_form");
    const form = formRaw ? JSON.parse(formRaw) : null;

    const experience = (form?.experience ?? "初心者") as OnboardingInput["experience"];
    const goal = (form?.goal ?? "tone") as OnboardingInput["goal"];
    const barriers = (form?.barriers ?? []) as OnboardingInput["barriers"];
    const targetAreas = (form?.targetAreas?.length ? form.targetAreas : ["whole"]) as OnboardingInput["targetAreas"];
    const duration = (form?.duration ?? "20-30") as OnboardingInput["duration"];
    const bodyWeight = Number(form?.bodyWeight ?? localStorage.getItem("bodyWeight") ?? 50);
    const sessionsDone = Number(localStorage.getItem("sessionsDone") ?? "0");


    const input: OnboardingInput = {
      experience,
      goal,
      barriers,
      targetAreas,
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
  }, []);

  const onWorkoutComplete = (workout: any) => {
    const anyDone = Array.isArray(workout)
      ? workout.some((ex: any) => ex.actualSets?.some((s: any) => s.completed))
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

    const history = JSON.parse(localStorage.getItem("demo_history") ?? "[]");
    history.push({
      date: today,
      items: workout.flatMap((ex: any) =>
        ex.actualSets.map((s: any) => ({
          exercise: ex.name,
          reps: s.reps,
          weight: s.weight,
          completed: s.completed,
        }))
      ),
    });
    localStorage.setItem("demo_history", JSON.stringify(history));

    // ✅ progression: セッション完了ごとにカウントを+1（次回の推奨重量/回数が少し上がる）
    const cur = Number(localStorage.getItem("sessionsDone") ?? "0");
    localStorage.setItem("sessionsDone", String(cur + 1));
  };

  return (
    <Today
      xp={xp}
      streak={streak}
      onWorkoutComplete={onWorkoutComplete}
      initialPlan={initialPlan ?? undefined}
    />
  );
}