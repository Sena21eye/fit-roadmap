// src/lib/menu.ts

export type Experience = "初心者" | "ときどき" | "経験者";
export type Goal = "slim" | "tone" | "muscle" | "healthy";
export type Barrier = "running" | "heavy" | "gym" | "long";
export type Area = "abs" | "legs" | "hips" | "arms" | "back" | "whole";
export type Duration = "10" | "20-30" | "45+";

export type OnboardingInput = {
  experience: Experience;
  goal: Goal;
  barriers: Barrier[];
  targetAreas: Area[];       // 少なくとも1つ
  duration: Duration;
};

export type ProgressContext = {
  /** これまで完了した同系セッション回数（0開始でOK） */
  sessionsDone?: number;
  /** 将来拡張用：直近実績（キーは exercise key） */
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

// 体重からの甘め推定（女性想定）+ 漸進性対応
function estimateInitialWeight(exerciseKey: string, bodyWeight: number, sessionsDone = 0): number | undefined {
  const bw = Number.isFinite(bodyWeight) ? bodyWeight : 50;

  // 甘めの初期係数（女性×ジム前提）。未記載は自重扱い(undefined)
  const coeff: Record<string, number> = {
    // 下半身
    squat: 0.35,
    legpress: 0.45,
    lunge: 0,            // 自重
    hipbridge: 0.10,     // 自重+軽負荷想定
    hipthrust: 0.35,     // スミス/バーベル
    abduction: 0.15,     // マシン軽め

    // 胸・腕
    bench: 0.22,
    chestpress: 0.25,
    kneepushup: 0,       // 自重
    pushdown: 0.12,

    // 背中
    deadlift: 0.30,
    row: 0.25,           // ダンベルロウ（片手あたりのつもりでやや控えめ）
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

  // 初期値（甘め）
  let base = bw * c;

  // 漸進性：2セッションごとに +0.5kg（控えめ）
  const bumps = Math.floor((sessionsDone || 0) / 2);
  base += bumps * 0.5;

  // 2.5kg刻みへ丸め（ジムの一般的なプレート刻み）。最低は 1kg 以上。
  const rounded = Math.max(1, Math.round(base / 2.5) * 2.5);
  return Number(rounded.toFixed(1));
}

function parseRepRange(range: string): [number, number] {
  // "8–12" または "8-12" を解析
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
  // 2セッションごとに +1rep、上限で打ち止め
  const inc = Math.floor(sessionsDone / 2);
  const target = Math.min(hi, lo + inc);
  return target;
}

export function generateMenu(i: OnboardingInput, bodyWeight: number, progress?: ProgressContext): GeneratedExercise[] {
  // 種目プール（ジム前提＋自重保険）
  const pool: Record<Area, { key: string; name: string; tag: string[] }[]> = {
    abs: [
      { key: "cablecrunch", name: "ケーブルクランチ", tag: ["gym"] },
      { key: "plank", name: "プランク", tag: ["no-weight"] },
      { key: "deadbug", name: "デッドバグ", tag: ["no-weight"] },
    ],
    legs: [
      { key: "squat", name: "スクワット（スミス可）", tag: ["heavy"] },
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
      { key: "deadlift", name: "デッドリフト（軽め）", tag: ["heavy"] },
      { key: "latpulldown", name: "ラットプルダウン", tag: ["gym"] },
      { key: "seatedrow", name: "シーテッドロー", tag: ["gym"] },
    ],
    whole: [
      { key: "row", name: "ダンベルロウ", tag: ["gym"] },
      { key: "ohp", name: "ショルダープレス（ダンベル）", tag: ["gym"] },
      { key: "mountain", name: "マウンテンクライマー", tag: ["no-weight", "running-like"] },
    ],
  };

  // バリアでフィルタ
  const forbid = new Set<string>();
  if (i.barriers.includes("gym")) forbid.add("gym");
  if (i.barriers.includes("heavy")) forbid.add("heavy");   // 将来拡張用
  if (i.barriers.includes("running")) forbid.add("running-like");
  // "long" は後でボリューム縮小

  const pickByArea = (a: Area) =>
    pool[a].filter(x => x.tag.every(t => !forbid.has(t)));

  // 目標×経験×時間 → ベースボリューム
  const base = (() => {
    switch (i.goal) {
      case "slim":   return { sets: [1,2], reps: "12–20", rest: 30 };
      case "tone":   return { sets: [2,3], reps: "10–15", rest: 45 };
      case "muscle": return { sets: [3,4], reps: "8–12",  rest: 60 };
      case "healthy":return { sets: [1,2], reps: "8–15",  rest: 45 };
    }
  })();

  const targetExerciseCount =
    i.duration === "10" ? 2
  : i.duration === "20-30" ? 3
  : 4;

  const setCap =
    i.duration === "10" ? base.sets[0]
  : i.duration === "20-30" ? Math.min(base.sets[1], 3)
  : base.sets[1];

  const restAdj =
    i.experience === "初心者" ? +15 :
    i.experience === "経験者" ? -10 : 0;

  const restSec = Math.max(20, base.rest + restAdj);

  const sessionsDone = progress?.sessionsDone ?? 0;

  const areasOrdered: Area[] = (i.targetAreas.length ? i.targetAreas : ["whole"]) as Area[];
  const chosen: { key: string; name: string }[] = [];
  for (const a of areasOrdered) {
    for (const ex of pickByArea(a)) {
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
      notes: i.experience === "初心者" ? "フォーム優先／痛みがあれば中止" : undefined,
    };
  });

  if (i.barriers.includes("long")) {
    out.forEach(e => { e.targetSets = Math.max(1, e.targetSets - 1); });
  }

  return out;
}