// src/lib/roadmap.ts
import type { Profile, GoalType } from "@/types";

// 安全な数値化（数値でなければフォールバック）
const toNum = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** プレート刻みで四捨五入 */
function roundToPlate(x: number, step = 2.5) {
  if (!isFinite(x)) return 0;
  return Math.round(x / step) * step;
}

/** なりたい姿ごとの Big3 体重比 */
const RATIOS: Record<GoalType, { bench: number; squat: number; dead: number }> = {
  slim: { bench: 0.8, squat: 1.2, dead: 1.5 },
  fit:  { bench: 1.0, squat: 1.5, dead: 2.0 },
  bulk: { bench: 1.2, squat: 1.8, dead: 2.3 },
};

/** ゴール体脂肪率の目安 */
export function estimateGoalBodyFat(goal: GoalType): number {
  switch (goal) {
    case "slim": return 15;
    case "fit":  return 12;
    case "bulk": return 18;
  }
}

/** BMI フォールバック値 */
function targetBMI(goal: GoalType): number {
  switch (goal) {
    case "slim": return 21;
    case "fit":  return 23;
    case "bulk": return 25;
  }
}

/** 目標体重を推定 */
export function estimateGoalWeightKg(
  currentWeightKg: number,
  goalType: GoalType,
  opts?: { bodyFatPct?: number; heightCm?: number }
): number {
  const goalBf = estimateGoalBodyFat(goalType);

  if (opts?.bodyFatPct != null && !Number.isNaN(opts.bodyFatPct)) {
    const lbm = currentWeightKg * (1 - opts.bodyFatPct / 100);
    return +(lbm / (1 - goalBf / 100)).toFixed(1);
  }

  if (opts?.heightCm != null && !Number.isNaN(opts.heightCm)) {
    const m = opts.heightCm / 100;
    return +((targetBMI(goalType) * m * m)).toFixed(1);
  }

  return +currentWeightKg.toFixed(1);
}

/** Big3 目標算出 */
export function estimateBig3Targets(goalType: GoalType, goalWeightKg: number) {
  const r = RATIOS[goalType] ?? RATIOS.fit;
  return {
    bench: roundToPlate(goalWeightKg * r.bench),
    squat: roundToPlate(goalWeightKg * r.squat),
    dead:  roundToPlate(goalWeightKg * r.dead),
  };
}

/** 線形補間 */
function lerpSeries(start: number, goal: number, weeks: number) {
  const out: number[] = [];
  for (let i = 0; i <= weeks; i++) {
    const t = weeks === 0 ? 1 : i / weeks;
    out.push(start + (goal - start) * t);
  }
  return out;
}

/** 週次の伸びをクランプ */
function clampWeeklyGains(series: number[], maxGainPerWeek: number) {
  if (series.length < 2) return series.slice();
  const out = [roundToPlate(series[0])];
  for (let i = 1; i < series.length; i++) {
    const prev = out[i - 1];
    const raw  = series[i];
    const gain = raw - prev;
    const clamped =
      gain >  maxGainPerWeek ? prev + maxGainPerWeek :
      gain < -maxGainPerWeek ? prev - maxGainPerWeek :
      raw;
    out.push(roundToPlate(clamped));
  }
  return out;
}

const WEEKLY_MAX_GAIN_KG = { bench: 2, squat: 3, dead: 3 };

/** ロードマップ生成 */
export function generateRoadmap(profile: Profile) {
    // 週数（最低1）
  const weeks = Math.max(1, Math.floor(toNum((profile as any).weeksToGoal, 12)));

  // 目標体重（入力されていなければ推定する）
  const curW = toNum((profile as any).currentWeightKg, 0);
  const goalWeight = toNum((profile as any).goalWeightKg, 0) > 0
    ? toNum((profile as any).goalWeightKg, 0)
    : estimateGoalWeightKg(curW, (profile as any).goalType, {
        bodyFatPct: (profile as any).bodyFatPct,
        heightCm: (profile as any).heightCm,
    });

  // 日付（週次）
  const startDate = new Date((profile as any).startedAt || new Date().toISOString());
  const dates: string[] = [];
  for (let i = 0; i <= weeks; i++) {
    const d = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().split("T")[0]);
  }

  // 体重（線形）
  const weightSeries = lerpSeries(curW, goalWeight, weeks).map((x) => Math.round(x * 10) / 10);

  // Big3：開始値は current、目標は「入力 > 推定」の優先順で採用
  const benchStart = toNum((profile as any).lifts?.bench?.current?.weight, 0);
  const squatStart = toNum((profile as any).lifts?.squat?.current?.weight, 0);
  const deadStart  = toNum((profile as any).lifts?.dead ?.current?.weight, 0);  

  const est = estimateBig3Targets((profile as any).goalType, goalWeight);
  const benchGoal = toNum((profile as any).lifts?.bench?.goal?.weight, 0) > 0
    ? toNum((profile as any).lifts?.bench?.goal?.weight, 0)
    : est.bench;
  const squatGoal = toNum((profile as any).lifts?.squat?.goal?.weight, 0) > 0
    ? toNum((profile as any).lifts?.squat?.goal?.weight, 0)
    : est.squat;
  const deadGoal  = toNum((profile as any).lifts?.dead ?.goal?.weight, 0) > 0
    ? toNum((profile as any).lifts?.dead ?.goal?.weight, 0)
    : est.dead;  

  let benchSeries = lerpSeries(benchStart, benchGoal, weeks);
  let squatSeries = lerpSeries(squatStart, squatGoal, weeks);
  let deadSeries  = lerpSeries(deadStart,  deadGoal,  weeks);

  benchSeries = clampWeeklyGains(benchSeries, WEEKLY_MAX_GAIN_KG.bench);
  squatSeries = clampWeeklyGains(squatSeries, WEEKLY_MAX_GAIN_KG.squat);
  deadSeries  = clampWeeklyGains(deadSeries,  WEEKLY_MAX_GAIN_KG.dead);

  // デバッグ（ビルド時は消える）
  if (typeof window !== "undefined" && (process as any)?.env?.NODE_ENV !== "production") {
    // 末尾サンプルを出力
    console.debug("[roadmap] goals:", { goalWeight, benchGoal, squatGoal, deadGoal });
    console.debug("[roadmap] last point:", {
      bench: benchSeries[benchSeries.length - 1],
      squat: squatSeries[squatSeries.length - 1],
      dead: deadSeries[deadSeries.length - 1],
    });
  }

  return dates.map((date, i) => ({
    date,
    weight: weightSeries[i] ?? 0,
    bench:  benchSeries[i]  ?? 0,
    squat:  squatSeries[i]  ?? 0,
    dead:   deadSeries[i]   ?? 0,
  }));
}