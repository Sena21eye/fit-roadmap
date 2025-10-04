// src/lib/program.ts
import type { Profile } from "@/types";
import {
  weekStartMonday,
  loadWeekPlan,
  isPlannedDay,
  addDays,
  formatISO,
  loadDailyLogs,
} from "@/lib/storage";

// 種目型
export type ExerciseKey =
  | "squat"
  | "bench"
  | "dead"
  | "ohp"
  | "row"
  | "pulldown"
  | "accessory"
  | "stretch";

export type Exercise = {
  key: ExerciseKey;
  name: string;
  sets: number;
  reps: number;
  baseFrom?: "bench" | "squat" | "dead";
  percentOfTarget?: number;
  notes?: string;
};
export type SessionPlan = {
  label: string;
  dayKey: string;
  exercises: (Exercise & { suggestedWeight?: number })[];
};

// ---------- 追加：ターゲット推定 ----------
function round25(x: number) {
  if (typeof x !== "number" || !isFinite(x)) return undefined as unknown as number;
  return Math.round(x / 2.5) * 2.5;
}
function lastLoggedTargets(): { bench?: number; squat?: number; dead?: number } {
  const logs = loadDailyLogs().slice().reverse();
  for (const l of logs) {
    if (l?.lifts) {
      const b = l.lifts.bench?.weight as number | undefined;
      const s = l.lifts.squat?.weight as number | undefined;
      const d = l.lifts.dead?.weight as number | undefined;
      if (b || s || d) return { bench: b, squat: s, dead: d };
    }
  }
  return {};
}
/** Profileから「推定ターゲット」を作る（直近ログ > 体重×係数） */
export function inferTargets(
  profile: Profile
): { bench?: number; squat?: number; dead?: number } {
  // 1) 直近のログがあれば優先
  const fromLog = lastLoggedTargets();

  // 2) 体重×係数（レベル/目標で補正）
  const bwRaw = Number((profile as any).currentWeightKg);
  const bw = Number.isFinite(bwRaw) && bwRaw > 0 ? bwRaw : 60;
  const lvl = profile.training?.level || "beginner";
  const goal = (profile as any).goalType || "fit";

  const base: Record<string, { bench: number; squat: number; dead: number }> = {
    beginner: { bench: 0.7, squat: 1.0, dead: 1.2 },
    intermediate: { bench: 0.9, squat: 1.3, dead: 1.6 },
    advanced: { bench: 1.05, squat: 1.6, dead: 2.0 },
  };
  const goalAdj = goal === "bulk" ? 1.05 : goal === "slim" ? 0.95 : 1.0;

  const est = {
    bench: round25(bw * base[lvl].bench * goalAdj),
    squat: round25(bw * base[lvl].squat * goalAdj),
    dead: round25(bw * base[lvl].dead * goalAdj),
  };

  // 3) Profileにもし目標/現在があればそれで上書き（入力してなくてもOK）
  const fromProfile = {
    bench: Number((profile.lifts?.bench?.goal?.weight ?? profile.lifts?.bench?.current?.weight) as any),
    squat: Number((profile.lifts?.squat?.goal?.weight ?? profile.lifts?.squat?.current?.weight) as any),
    dead:  Number((profile.lifts?.dead?.goal?.weight  ?? profile.lifts?.dead?.current?.weight) as any),
  };

  return {
    bench: fromLog.bench ?? fromProfile.bench ?? est.bench,
    squat: fromLog.squat ?? fromProfile.squat ?? est.squat,
    dead: fromLog.dead ?? fromProfile.dead ?? est.dead,
  };
}

// ---------- テンプレ（あなたの元コードを再掲） ----------
function template2(): Record<string, SessionPlan> {
  return {
    A: {
      label: "Full A",
      dayKey: "A",
      exercises: [
        { key: "squat", name: "Back Squat", sets: 5, reps: 5, percentOfTarget: 0.85 },
        { key: "bench", name: "Bench Press", sets: 5, reps: 5, percentOfTarget: 0.85 },
        { key: "row", name: "1-Arm DB Row", sets: 3, reps: 10, baseFrom: "dead", percentOfTarget: 0.55, notes: "RPE 8 / 片手ずつ" },
      ],
    },
    B: {
      label: "Full B",
      dayKey: "B",
      exercises: [
        { key: "dead", name: "Deadlift", sets: 3, reps: 5, percentOfTarget: 0.85 },
        { key: "ohp", name: "Overhead Press", sets: 5, reps: 5, percentOfTarget: 0.8 },
        { key: "pulldown", name: "Lat Pulldown", sets: 3, reps: 10, baseFrom: "dead", percentOfTarget: 0.45, notes: "広背筋意識" },
      ],
    },
  };
}
function template3(): Record<string, SessionPlan> {
  return {
    PUSH: {
      label: "Push",
      dayKey: "PUSH",
      exercises: [
        { key: "bench", name: "Bench Press", sets: 5, reps: 5, percentOfTarget: 0.85 },
        { key: "ohp", name: "Overhead Press", sets: 3, reps: 8, percentOfTarget: 0.75 },
        { key: "accessory", name: "Triceps Pushdown", sets: 3, reps: 12, baseFrom: "bench", percentOfTarget: 0.30 },
      ],
    },
    PULL: {
      label: "Pull",
      dayKey: "PULL",
      exercises: [
        { key: "row", name: "Barbell Row", sets: 4, reps: 8, baseFrom: "dead", percentOfTarget: 0.75, notes: "フォーム重視" },
        { key: "pulldown", name: "Lat Pulldown", sets: 3, reps: 10, baseFrom: "dead", percentOfTarget: 0.45 },
        { key: "accessory", name: "Face Pull", sets: 3, reps: 15, baseFrom: "bench", percentOfTarget: 0.20 },
      ],
    },
    LEGS: {
      label: "Legs",
      dayKey: "LEGS",
      exercises: [
        { key: "squat", name: "Back Squat", sets: 5, reps: 5, percentOfTarget: 0.85 },
        { key: "dead", name: "Romanian DL", sets: 3, reps: 8, percentOfTarget: 0.7 },
        { key: "accessory", name: "Leg Extension", sets: 3, reps: 12, baseFrom: "squat", percentOfTarget: 0.30 },
      ],
    },
  };
}
function template4(): Record<string, SessionPlan> {
  return {
    UP1: {
      label: "Upper 1",
      dayKey: "UP1",
      exercises: [
        { key: "bench", name: "Bench Press", sets: 5, reps: 5, percentOfTarget: 0.85 },
        { key: "row", name: "Barbell Row", sets: 4, reps: 8, baseFrom: "dead", percentOfTarget: 0.75 },
        { key: "ohp", name: "Overhead Press", sets: 3, reps: 8, percentOfTarget: 0.75 },
      ],
    },
    LOW1: {
      label: "Lower 1",
      dayKey: "LOW1",
      exercises: [
        { key: "squat", name: "Back Squat", sets: 5, reps: 5, percentOfTarget: 0.85 },
        { key: "dead", name: "Deadlift", sets: 3, reps: 5, percentOfTarget: 0.85 },
        { key: "accessory", name: "Calf Raise", sets: 3, reps: 15, baseFrom: "squat", percentOfTarget: 0.30 },
      ],
    },
    UP2: {
      label: "Upper 2",
      dayKey: "UP2",
      exercises: [
        { key: "ohp", name: "Overhead Press", sets: 5, reps: 5, percentOfTarget: 0.8 },
        { key: "bench", name: "Incline Bench", sets: 3, reps: 8, percentOfTarget: 0.75 },
        { key: "pulldown", name: "Lat Pulldown", sets: 3, reps: 10, baseFrom: "dead", percentOfTarget: 0.45 },
      ],
    },
    LOW2: {
      label: "Lower 2",
      dayKey: "LOW2",
      exercises: [
        { key: "squat", name: "Front Squat (軽め)", sets: 3, reps: 5, percentOfTarget: 0.7 },
        { key: "dead", name: "Romanian DL", sets: 3, reps: 8, percentOfTarget: 0.7 },
        { key: "accessory", name: "Leg Curl", sets: 3, reps: 12, baseFrom: "dead", percentOfTarget: 0.35 },
      ],
    },
  };
}
function pickTemplate(s: 2 | 3 | 4) {
  return s === 2 ? template2() : s === 3 ? template3() : template4();
}

// 提案重量埋め
function enrich(
  ex: Exercise,
  targets?: { bench?: number; squat?: number; dead?: number }
) {
  // Coerce targets to numbers (they might arrive as strings)
  const tBench = typeof targets?.bench === "number" ? targets!.bench : undefined;
  const tSquat = typeof targets?.squat === "number" ? targets!.squat : undefined;
  const tDead  = typeof targets?.dead  === "number" ? targets!.dead  : undefined;

  // Fallback base from bodyweight when targets are missing
  const defaultBaseByBW = (key: ExerciseKey, bw: number) => {
    const safeBW = Number.isFinite(bw) && bw > 0 ? bw : 60;
    switch (key) {
      case "bench": return safeBW * 0.7;
      case "squat": return safeBW * 1.0;
      case "dead":  return safeBW * 1.2;
      case "ohp":   return safeBW * 0.45; // 片手ダンベル換算の目安
      case "row":   return safeBW * 0.8;
      case "pulldown": return safeBW * 0.8;
      case "accessory": return safeBW * 0.3;
      case "stretch": return 0;
    }
  };

  // Minimum sensible loads by category (kg)
  const minByKey: Record<ExerciseKey, number> = {
    bench: 20,
    squat: 20,
    dead: 20,
    ohp: 10,
    row: 20,
    pulldown: 15,
    accessory: 5,
    stretch: 0,
  };

  // Decide base
  const chooseBase = (bwHint: number | undefined): number | undefined => {
    if (ex.baseFrom === "bench") return tBench ?? (bwHint ? defaultBaseByBW("bench", bwHint) : undefined);
    if (ex.baseFrom === "squat") return tSquat ?? (bwHint ? defaultBaseByBW("squat", bwHint) : undefined);
    if (ex.baseFrom === "dead")  return tDead  ?? (bwHint ? defaultBaseByBW("dead",  bwHint) : undefined);
    // legacy fallback by key
    const map: Record<ExerciseKey, number | undefined> = {
      squat: tSquat,
      bench: tBench,
      dead:  tDead,
      ohp:   tBench ? tBench * 0.65 : undefined,
      row:   tDead  ? tDead  * 0.55 : undefined,
      pulldown: tDead,
      accessory: tBench,
      stretch: undefined,
    };
    return map[ex.key] ?? (bwHint ? defaultBaseByBW(ex.key, bwHint) : undefined);
  };

  // Try deriving a bodyweight hint from inferred targets if missing
  const bwFromTargets = tBench && tBench > 0 ? (tBench / 0.7) : tSquat && tSquat > 0 ? (tSquat / 1.0) : tDead && tDead > 0 ? (tDead / 1.2) : 60;

  const base = chooseBase(bwFromTargets);

  let suggested: number | undefined;
  if (typeof base === "number" && isFinite(base) && ex.percentOfTarget) {
    const raw = base * ex.percentOfTarget;
    const rounded = Math.round(raw / 2.5) * 2.5;
    const floored = Math.max(minByKey[ex.key], rounded);
    suggested = floored;
  } else if (ex.key !== "stretch") {
    // If still undefined, present the minimum sensible load
    suggested = minByKey[ex.key];
  }

  return { ...ex, suggestedWeight: suggested };
}

// 休息テンプレ
function recoveryTemplate(): SessionPlan {
  return {
    label: "Recovery / Stretch",
    dayKey: "REC",
    exercises: [
      { key: "stretch", name: "Cat & Cow", sets: 2, reps: 10, notes: "背骨を滑らかに" },
      { key: "stretch", name: "Seated Hamstring", sets: 2, reps: 30, notes: "左右 30 秒" },
      { key: "stretch", name: "Hip Flexor", sets: 2, reps: 30, notes: "左右 30 秒" },
    ],
  };
}

// WeekPlan ベースで「今週の予定日配列」を作る（Mon..Sun）
function getPlannedDatesInThisWeek(dateISO: string): string[] {
  const ws = weekStartMonday(dateISO);
  const wp = loadWeekPlan(ws);
  if (!wp) return [];
  const mon = new Date(ws + "T00:00:00");
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    if ((wp.days as boolean[])[i]) dates.push(formatISO(addDays(mon, i)));
  }
  return dates;
}
function isPlannedWorkoutToday(dateISO: string): boolean {
  const ws = weekStartMonday(dateISO);
  const wp = loadWeekPlan(ws);
  return !!(wp && isPlannedDay(dateISO, wp));
}

// その週の予定配列上での“n回目”によりセッションを決定
export function sessionKeyForDate(
  profile: Profile,
  dateISO: string
): string | null {
  const sessions = (profile.training?.sessionsPerWeek ?? 2) as 2 | 3 | 4;
  const template = pickTemplate(sessions);
  const planned = getPlannedDatesInThisWeek(dateISO);
  if (!planned.length) return null;

  const nth = planned.findIndex((d) => d === dateISO);
  if (nth < 0) return null;

  const order: Record<2 | 3 | 4, string[]> = {
    2: ["A", "B"],
    3: ["PUSH", "PULL", "LEGS"],
    4: ["UP1", "LOW1", "UP2", "LOW2"],
  };
  const key = order[sessions][nth % order[sessions].length];
  return template[key] ? key : null;
}

export function planForToday(
  profile: Profile,
  dateISO: string,
  targets?: { bench?: number; squat?: number; dead?: number }
) {
  if (!isPlannedWorkoutToday(dateISO)) {
    return { rest: true as const, ...recoveryTemplate() };
  }
  const sessions = (profile.training?.sessionsPerWeek ?? 2) as 2 | 3 | 4;
  const template = pickTemplate(sessions);
  const key = sessionKeyForDate(profile, dateISO);
  if (!key) return { rest: true as const, ...recoveryTemplate() };

  const base = template[key];
  const t = targets ?? inferTargets(profile);

  return {
    rest: false as const,
    label: base.label,
    dayKey: base.dayKey,
    exercises: base.exercises.map((e) => enrich(e, t)),
  };
}