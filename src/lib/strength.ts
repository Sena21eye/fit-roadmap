// src/lib/strength.ts
import type { Profile } from "@/types";

/**
 * 初心者向けの「最初の安全な重量」をざっくり決め打ち。
 * - 体重に対する係数で目安を作る
 * - 2.5kg刻みに丸める
 * - 下限/上限でクランプ
 */
const roundToPlate = (x: number, step = 2.5) =>
  Math.round(x / step) * step;

export type InitialLifts = {
  bench: number; // kg
  squat: number;
  dead: number;
};

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";


export function estimateInitialLifts(weightKg: number, level: ExperienceLevel) {
  // レベルに応じた係数を決め打ち
  const factors: Record<ExperienceLevel, { bench: number; squat: number; dead: number }> = {
    beginner:     { bench: 0.5, squat: 0.75, dead: 1.0 },
    intermediate: { bench: 0.75, squat: 1.0,  dead: 1.25 },
    advanced:     { bench: 1.0, squat: 1.25, dead: 1.5 },
  };

  const f = factors[level];
  return {
    bench: Math.round(weightKg * f.bench / 2.5) * 2.5,
    squat: Math.round(weightKg * f.squat / 2.5) * 2.5,
    dead:  Math.round(weightKg * f.dead  / 2.5) * 2.5,
  };
}