// src/lib/menu.ts

// --- Types ---------------------------------------------------
export type Experience =
  | "初心者"
  | "ときどき"
  | "経験者"
  // 新Onboardingの文言も許容
  | "ほとんど運動していない"
  | "週1〜2回くらい"
  | "週3回以上している";

export type Barrier = "running" | "heavy" | "gym" | "long";
export type Area = "abs" | "legs" | "hips" | "arms" | "back" | "whole";
export type Duration = "10" | "20-30" | "45+";

export type OnboardingInput = {
  experience: Experience;
  goals: string[];      // 例: ["くびれを作りたい","お腹を引き締めたい"]
  barriers: Barrier[];  // 例: ["gym","heavy"]
  duration: Duration;
};

export type ProgressContext = {
  sessionsDone?: number;
  lastPerformed?: Record<string, { weight?: number; reps?: number; sets?: number }>;
};

export type GeneratedExercise = {
  name: string;
  targetSets: number;
  targetReps: number | string; // 30秒など
  weight?: number;             // 自重なら undefined
  restSec: number;
  notes?: string;
};

// --- Goal → Area 重み付け ------------------------------------
const GOAL_TO_AREA_WEIGHT: Record<string, Partial<Record<Area, number>>> = {
  "くびれを作りたい":         { abs: 2, back: 1 },
  "お腹を引き締めたい":       { abs: 3, whole: 1 },
  "ヒップアップしたい":       { hips: 3, legs: 1 },
  "二の腕をすっきりさせたい": { arms: 3 },
  "姿勢を良くしたい":         { back: 3, abs: 1 },
  "全体的に引き締めたい":     { whole: 3, legs: 1, abs: 1 },
};

// --- 経験文言の正規化 ----------------------------------------
function normalizeExperience(exp: Experience): "beginner" | "intermediate" | "advanced" {
  switch (exp) {
    case "初心者":
    case "ほとんど運動していない":
      return "beginner";
    case "経験者":
    case "週3回以上している":
      return "advanced";
    default:
      return "intermediate"; // ときどき / 週1〜2回くらい
  }
}

// --- 初期重量の推定（女性想定） + 漸進性 ---------------------
function estimateInitialWeight(exerciseKey: string, bodyWeight: number, sessionsDone = 0): number | undefined {
  const bw = Number.isFinite(bodyWeight) ? bodyWeight : 50;
  const coeff: Record<string, number> = {
    // 下半身
    squat: 0.35,
    legpress: 0.45,
    lunge: 0,
    hipbridge: 0.10,
    hipthrust: 0.35,
    abduction: 0.15,
    // 胸・腕
    bench: 0.22,
    chestpress: 0.25,
    kneepushup: 0,
    pushdown: 0.12,
    // 背中
    deadlift: 0.30,
    row: 0.25,
    seatedrow: 0.22,
    latpulldown: 0.20,
    // 肩
    ohp: 0.12,
    dbcurl: 0.08,
    // 体幹/有酸素系
    plank: 0,
    deadbug: 0,
    mountain: 0,
  };
  const c = coeff[exerciseKey];
  if (c == null || c === 0) return undefined; // 自重は重量提示なし
  let base = bw * c;
  const bumps = Math.floor((sessionsDone || 0) / 2); // 2セッションごとに +0.5kg
  base += bumps * 0.5;
  const rounded = Math.max(1, Math.round(base / 2.5) * 2.5);
  return Number(rounded.toFixed(1));
}

function parseRepRange(range: string): [number, number] {
  const cleaned = range.replace(/\s/g, "");
  const parts = cleaned.split(/–|-/);
  const a = Number(parts[0]);
  const b = Number(parts[1] ?? parts[0]);
  const lo = Number.isFinite(a) ? a : 10;
  const hi = Number.isFinite(b) ? b : lo;
  return [Math.min(lo, hi), Math.max(lo, hi)];
}

function pickRepsWithProgress(range: string | number, sessionsDone = 0): number | string {
  if (typeof range === "number") return range;
  const [lo, hi] = parseRepRange(range);
  const inc = Math.floor(sessionsDone / 2); // 2セッションごとに +1rep
  const target = Math.min(hi, lo + inc);
  return target;
}

// --- 種目プール ------------------------------------------------
const pool: Record<Area, { key: string; name: string; tag: string[] }[]> = {
  abs: [
    { key: "cablecrunch", name: "ケーブルクランチ", tag: ["gym"] },
    { key: "plank", name: "プランク", tag: ["no-weight"] },
    { key: "deadbug", name: "デッドバグ", tag: ["no-weight"] },
  ],
  legs: [
    { key: "squat", name: "スクワット（スミス可）", tag: ["gym", "heavy"] },
    { key: "legpress", name: "レッグプレス", tag: ["gym"] },
    { key: "lunge", name: "ランジ", tag: ["no-weight", "running-like"] },
    { key: "hipbridge", name: "ヒップリフト", tag: ["no-weight"] },
  ],
  hips: [
    { key: "hipthrust", name: "ヒップスラスト（バーベル/スミス）", tag: ["gym", "heavy"] },
    { key: "abduction", name: "ヒップアブダクション", tag: ["gym"] },
    { key: "hipbridge", name: "ヒップリフト", tag: ["no-weight"] },
  ],
  arms: [
    { key: "dbcurl", name: "ダンベルカール", tag: ["gym"] },
    { key: "pushdown", name: "トライセプスプレスダウン", tag: ["gym"] },
    { key: "kneepushup", name: "ニー・プッシュアップ", tag: ["no-weight"] },
  ],
  back: [
    { key: "deadlift", name: "デッドリフト（軽め）", tag: ["gym", "heavy"] },
    { key: "latpulldown", name: "ラットプルダウン", tag: ["gym"] },
    { key: "seatedrow", name: "シーテッドロー", tag: ["gym"] },
  ],
  whole: [
    { key: "row", name: "ダンベルロウ", tag: ["gym"] },
    { key: "ohp", name: "ショルダープレス（ダンベル）", tag: ["gym"] },
    { key: "mountain", name: "マウンテンクライマー", tag: ["no-weight", "running-like"] },
  ],
};

// --- メニュー生成 ---------------------------------------------
export function generateMenu(i: OnboardingInput, bodyWeight: number, progress?: ProgressContext): GeneratedExercise[] {
  // バリア→フィルタ
  const forbid = new Set<string>();
  if (i.barriers.includes("gym")) forbid.add("gym");
  if (i.barriers.includes("heavy")) forbid.add("heavy");
  if (i.barriers.includes("running")) forbid.add("running-like");
  // "long" は後段でボリュームを下げる

  const pickByArea = (a: Area) => pool[a].filter(x => x.tag.every(t => !forbid.has(t)));

  // 体験負荷ベース（goalsから代表プロファイルを決定）
  const has = (g: string) => i.goals.includes(g);
  const profile: "slim" | "tone" | "muscle" | "healthy" =
    has("筋肉をつけたい") ? "muscle" :
    has("全体的に引き締めたい") ? "tone" :
    has("お腹を引き締めたい") || has("くびれを作りたい") ? "slim" :
    has("姿勢を良くしたい") ? "healthy" : "tone";

  const base = (() => {
    switch (profile) {
      case "slim":   return { sets: [1,2], reps: "12–20", rest: 30 };
      case "tone":   return { sets: [2,3], reps: "10–15", rest: 45 };
      case "muscle": return { sets: [3,4], reps: "8–12",  rest: 60 };
      case "healthy":return { sets: [1,2], reps: "8–15",  rest: 45 };
    }
  })();

  const targetExerciseCount = i.duration === "10" ? 2 : i.duration === "20-30" ? 3 : 4;
  const setCap = i.duration === "10" ? base.sets[0] : i.duration === "20-30" ? Math.min(base.sets[1], 3) : base.sets[1];

  const exp = normalizeExperience(i.experience);
  const restAdj = exp === "beginner" ? +15 : exp === "advanced" ? -10 : 0;
  const restSec = Math.max(20, base.rest + restAdj);

  const sessionsDone = progress?.sessionsDone ?? 0;

  // goals → area weight 合成
  const areaWeight: Record<Area, number> = { abs: 0, legs: 0, hips: 0, arms: 0, back: 0, whole: 0 };
  for (const g of i.goals) {
    const w = GOAL_TO_AREA_WEIGHT[g];
    if (!w) continue;
    for (const [a, v] of Object.entries(w)) {
      areaWeight[a as Area] += v || 0;
    }
  }
  // 何もなければデフォルト
  const sum = Object.values(areaWeight).reduce((a,b)=>a+b,0);
  if (sum === 0) { areaWeight.whole = 2; areaWeight.abs = 1; }

  const areasSorted = (Object.keys(areaWeight) as Area[]).sort((a,b)=>areaWeight[b]-areaWeight[a]);

  // 種目選定（フィルタ適用 & 重複防止）
  const chosen: { key: string; name: string }[] = [];
  for (const area of areasSorted) {
    for (const ex of pickByArea(area)) {
      if (chosen.length >= targetExerciseCount) break;
      if (!chosen.find(c => c.key === ex.key)) chosen.push({ key: ex.key, name: ex.name });
    }
    if (chosen.length >= targetExerciseCount) break;
  }
  if (chosen.length === 0) {
    // バリアで全滅した場合の自重フォールバック
    chosen.push({ key: "hipbridge", name: "ヒップリフト" });
  }

  const out: GeneratedExercise[] = chosen.map((ex) => {
    const reps = pickRepsWithProgress(base.reps, sessionsDone);
    const w = estimateInitialWeight(ex.key, bodyWeight, sessionsDone);
    return {
      name: ex.name,
      targetSets: setCap,
      targetReps: reps,
      weight: w,
      restSec,
      notes: exp === "beginner" ? "フォーム優先／痛みがあれば中止" : undefined,
    };
  });

  if (i.barriers.includes("long")) {
    out.forEach(e => { e.targetSets = Math.max(1, e.targetSets - 1); });
  }

  return out;
}