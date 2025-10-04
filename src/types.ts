// src/types.ts

// ------- 基本の型 -------
export type LiftKey = "bench" | "squat" | "dead";
export type GoalType = "slim" | "fit" | "bulk";

export type LiftValue = { weight: number; reps: number };

export type LiftPerformance = {
  weight: number;
  reps: number;
  success: boolean;
};

export type DailyLift = {
  weight?: number;
  reps?: number;
  success: boolean;
};

export type DailyLog = {
  date: string; // YYYY-MM-DD
  weightKg?: number;
  lifts: Record<LiftKey, DailyLift>;
};

// 目標の保持（必要なら）
export type LiftTarget = {
  current: { weight: number | undefined; reps: number };
  goal: { weight: number; reps: number };
};

// ------- トレーニング設定 -------
export type SplitType = "fullbody" | "push_pull_legs" | "upper_lower";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

// ★ Program/Today から参照される正式な型
export type TrainingPrefs = {
  sessionsPerWeek: 2 | 3 | 4; // 週のトレ頻度（MVP）
  split?: SplitType;           // 未指定なら頻度から自動
  level: ExperienceLevel;      // 初心者/中級/上級
};

// ------- プロフィール -------
export type Profile = {
  startedAt: string;

  heightCm?: number;   // 任意
  bodyFatPct?: number; // 任意

  currentWeightKg: number;
  goalWeightKg?: number;
  weeksToGoal?: number;
  goalType: GoalType;

  lifts: {
    bench: { current: { weight: number; reps: number }, goal: { weight: number; reps: number } },
    squat: { current: { weight: number; reps: number }, goal: { weight: number; reps: number } },
    dead:  { current: { weight: number; reps: number }, goal: { weight: number; reps: number } },
  };

  // ★ 新しい設定
  training?: TrainingPrefs;
};

// ------- セッション履歴（必要なら） -------
export type SetRecord = { setIndex: number; weight: number; reps: number; success?: boolean };

export type Session = {
  id: string;
  createdAt: string;
  lift: LiftKey;
  sets: SetRecord[];
};

// 例）types.ts の TrainingPreference に
export type TrainingPreference = {
  sessionsPerWeek: 2 | 3 | 4;
  split?: "fullbody" | "push_pull_legs" | "upper_lower";
  customDaysMon0?: number[]; // Mon=0 ... Sun=6 の配列（週回数と同じ長さ）
};