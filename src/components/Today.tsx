// src/components/today.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Zap, Flame, RotateCcw, CheckCircle } from "lucide-react";
import { analytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

type PlanItem = {
  name: string;
  targetSets: number;
  targetReps: number | string;
  suggestedWeight?: number;
};

interface TodayProps {
  xp: number;
  streak: number;
  onWorkoutComplete: (workout: any) => void;
  initialPlan?: PlanItem[];
}

export default function Today({ xp, streak, onWorkoutComplete, initialPlan }: TodayProps) {
  const defaultWorkout = useMemo(
    () => [
      {
        id: 1,
        name: "スクワット",
        targetSets: 3,
        targetReps: 15,
        completed: false,
        actualSets: Array.from({ length: 3 }, () => ({ reps: "", weight: "", completed: false })),
      },
      {
        id: 2,
        name: "プランク",
        targetSets: 3,
        targetReps: "30秒",
        completed: false,
        actualSets: Array.from({ length: 3 }, () => ({ reps: "", weight: "", completed: false })),
      },
      {
        id: 3,
        name: "ウォールプッシュアップ",
        targetSets: 2,
        targetReps: 10,
        completed: false,
        actualSets: Array.from({ length: 2 }, () => ({ reps: "", weight: "", completed: false })),
      },
    ],
    []
  );

  const initialFromPlan = useMemo(() => {
    if (!initialPlan || !initialPlan.length) return null;
        return initialPlan.map((p, idx) => ({
        id: idx + 1,
        name: p.name,
        targetSets: p.targetSets,
        targetReps: p.targetReps,
        suggestedWeight: p.suggestedWeight,  // ← これを追加！
        completed: false,
        actualSets: Array.from({ length: p.targetSets }, () => ({
            reps: typeof p.targetReps === "number" ? String(p.targetReps) : "",
            weight: p.suggestedWeight != null ? String(p.suggestedWeight) : "",
            completed: false,
        })),
        }));
  }, [initialPlan]);

  const [todayWorkout, setTodayWorkout] = useState<any[]>(initialFromPlan ?? defaultWorkout);

  // initialPlan は初回レンダー後に到着することがあるため、到着時に state を同期
  useEffect(() => {
    if (initialFromPlan) {
      setTodayWorkout(initialFromPlan);
    }
  }, [initialFromPlan]);

  const updateSet = (exerciseId: number, setIndex: number, field: string, value: string | boolean) => {
    setTodayWorkout(prev =>
      prev.map(exercise => {
        if (exercise.id === exerciseId) {
          const newSets = [...exercise.actualSets];
          newSets[setIndex] = { ...newSets[setIndex], [field]: value };
          const allSetsCompleted = newSets.every(s => s.completed);
          return { ...exercise, actualSets: newSets, completed: allSetsCompleted };
        }
        return exercise;
      })
    );
  };

  const saveWorkout = () => {
    if (canSaveWorkout()) {
      onWorkoutComplete(todayWorkout);

      // ✅ Firebase Analytics にイベント送信
      if (analytics) {
        const totalWeight = todayWorkout.reduce((sum, ex) => {
          const w = ex.actualSets.reduce((acc: number, s: any) => {
            const weight = Number(s.weight || 0);
            const reps = Number(s.reps || 0);
            return acc + (Number.isFinite(weight) && Number.isFinite(reps) ? weight * reps : 0);
          }, 0);
          return sum + w;
        }, 0);

        if (analytics) {
          logEvent(analytics, "workout_saved", {
          numExercises: todayWorkout.length,
          totalWeight,
  });
}
      }
    }
  };

  const canSaveWorkout = () =>
    todayWorkout.some(exercise => exercise.actualSets.some((s: any) => s.completed));



  const getAlternativeExercise = (exerciseId: number) => {
    const alternatives: Record<number, string[]> = {
      1: ["ワイドスクワット", "サイドスクワット", "ハーフスクワット"],
      2: ["サイドプランク", "ニープランク", "リバースプランク"],
      3: ["膝つき腕立て伏せ", "インクラインプッシュアップ", "チェアディップス"],
    };
    const options = alternatives[exerciseId] || [];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  };
// 代替名 → 種目キー（menu.tsと同じ系統のキーに寄せる）
const altNameToKey = (name: string): string | null => {
  if (name.includes("スクワット")) return "squat";
  if (name.includes("プランク")) return "plank";
  if (name.includes("腕立て") || name.includes("プッシュアップ")) return "kneepushup";
  if (name.includes("ディップ")) return "pushdown";
  if (name.includes("アブダクション")) return "abduction";
  if (name.includes("ヒップスラスト")) return "hipthrust";
  if (name.includes("ロウ")) return "row";
  if (name.includes("ラットプルダウン")) return "latpulldown";
  if (name.includes("シーテッドロー")) return "seatedrow";
  return null;
};

// 体重から甘めに推定（2.5kg刻みで丸め）
const estimateInitialWeight = (exerciseKey: string, bodyWeight: number): number | undefined => {
  const bw = Number.isFinite(bodyWeight) ? bodyWeight : 50;
  const coeff: Record<string, number> = {
    squat: 0.35,
    legpress: 0.45,
    hipthrust: 0.35,
    abduction: 0.15,
    bench: 0.22,
    chestpress: 0.25,
    pushdown: 0.12,
    deadlift: 0.30,
    row: 0.25,
    seatedrow: 0.22,
    latpulldown: 0.20,
    ohp: 0.12,
    dbcurl: 0.08,
    // 自重系
    plank: 0,
    kneepushup: 0,
  };
  const c = coeff[exerciseKey];
  if (c == null) return undefined;
  const rounded = Math.max(1, Math.round((bw * c) / 2.5) * 2.5);
  return Number(rounded.toFixed(1));
};


const replaceExercise = (exerciseId: number) => {
  const newName = getAlternativeExercise(exerciseId);
  const key = altNameToKey(newName || "");
  const bw = Number(localStorage.getItem("bodyWeight") ?? "50");
  const suggested = key ? estimateInitialWeight(key, bw) : undefined;

  setTodayWorkout(prev =>
    prev.map(ex => {
      if (ex.id !== exerciseId) return ex;

      // プランク系は「30秒」、それ以外は元の targetReps を継承
      const nextTargetReps = newName.includes("プランク") ? "30秒" : ex.targetReps;

      return {
        ...ex,
        name: newName,
        suggestedWeight: suggested,
        targetReps: nextTargetReps,
        // 入力欄も自動プリセット
        actualSets: Array.from({ length: ex.targetSets }, () => ({
          reps: typeof nextTargetReps === "number" ? String(nextTargetReps) : "",
          weight: suggested != null ? String(suggested) : "",
          completed: false,
        })),
        completed: false,
      };
    })
  );
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl text-pink-800">Today</h1>
          <div className="flex gap-2">
            <div className="bg-orange-200 text-orange-800 px-2 py-1 rounded flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>{xp} XP</span>
            </div>
            <div className="bg-pink-200 text-pink-800 px-2 py-1 rounded flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>{streak}日</span>
            </div>
          </div>
        </div>

        {/* Today's Menu */}
        <Card className="bg-white border-pink-100 shadow-sm">
          <div className="p-4 border-b border-pink-100">
            <h2 className="text-pink-800 flex items-center gap-2 font-semibold">
              <CheckCircle className="w-5 h-5" />
              今日のメニュー
            </h2>
          </div>
          <CardContent className="space-y-6">
            {todayWorkout.map((exercise) => (
              <div key={exercise.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className={`text-lg ${exercise.completed ? "text-green-600 line-through" : "text-pink-800"}`}>
                    {exercise.name}
                  </h3>
                  <Button
                    onClick={() => replaceExercise(exercise.id)}
                    className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 px-2 py-1 text-sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    代替
                  </Button>
                </div>

                <div className="text-sm text-pink-600 mb-2">
                    目標: {exercise.targetSets}セット × {exercise.targetReps}
                    {typeof exercise.suggestedWeight === "number" ? ` @ ${exercise.suggestedWeight}kg` : ""}
                </div>

                <div className="space-y-2">
                  {exercise.actualSets.map((set: any, setIndex: number) => (
                    <div key={setIndex} className="flex items-center gap-2 p-2 bg-pink-25 rounded-lg">
                      <span className="text-sm text-pink-600 w-8">{setIndex + 1}</span>

                      <Input
                        placeholder="回数"
                        value={set.reps}
                        onChange={(e) => updateSet(exercise.id, setIndex, "reps", e.target.value)}
                        className="h-8 text-center border-pink-200 focus:border-pink-400"
                      />

                      {exercise.name !== "プランク" && (
                        <Input
                          placeholder={
                            set.weight || (typeof exercise.suggestedWeight === "number" ? String(exercise.suggestedWeight) : "重量(kg)")
                          }
                          value={set.weight}
                          onChange={(e) => updateSet(exercise.id, setIndex, "weight", e.target.value)}
                          className="h-8 text-center border-pink-200 focus:border-pink-400"
                        />
                      )}

                      <Checkbox
                        checked={set.completed}
                        onCheckedChange={(checked) => updateSet(exercise.id, setIndex, "completed", !!checked)}
                        className="border-pink-300 data-[state=checked]:bg-pink-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={saveWorkout}
          disabled={!canSaveWorkout()}
          className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white h-14 rounded-xl text-lg"
        >
          <Zap className="mr-2 w-5 h-5" />
          保存してXP獲得
        </Button>
      </div>
    </div>
  );
}