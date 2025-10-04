// src/lib/alt-exercises.ts
// 各種目キーごとの代替候補と、ターゲットからの推奨重量換算ロジック

export type ExerciseKey =
  | "squat" | "bench" | "dead" | "ohp" | "row" | "pulldown"
  | "accessory" | "stretch";

export type AltCandidate = {
  key: ExerciseKey;
  name: string;
  sets: number;
  reps: number;
  // base は種目に応じて与える（ex: bench系なら bench ターゲットなど）
  // base が undefined のときは undefined を返して重量未提示にする
  suggest: (base: number | undefined) => number | undefined;
  notes?: string;
};

// 小数を 2.5kg 刻みに
function roundPlate(x: number) {
  return Math.round(x / 2.5) * 2.5;
}

function withRatio(ratio: number) {
  return (base: number | undefined) =>
    typeof base === "number" && isFinite(base) ? roundPlate(base * ratio) : undefined;
}

// それぞれのキーで「ベースにするターゲット」は Today 側で決める。
// ここでは「換算比」と「標準セット/レップ」を持った代替だけ定義。
export function alternativesFor(key: ExerciseKey): AltCandidate[] {
  switch (key) {
    case "bench":
      return [
        { key: "bench", name: "Dumbbell Bench Press", sets: 4, reps: 8,  suggest: withRatio(0.6),  notes: "ベンチの約60%" },
        { key: "accessory", name: "Machine Chest Press", sets: 4, reps: 10, suggest: withRatio(0.55), notes: "ベンチの約55%" },
        { key: "accessory", name: "Incline DB Press", sets: 3, reps: 10, suggest: withRatio(0.5) },
        { key: "accessory", name: "Cable Fly", sets: 3, reps: 12, suggest: withRatio(0.25) },
      ];
    case "squat":
      return [
        { key: "accessory", name: "Leg Press", sets: 4, reps: 10, suggest: withRatio(1.6), notes: "プレート総重量として" },
        { key: "accessory", name: "Goblet Squat", sets: 4, reps: 10, suggest: withRatio(0.5) },
        { key: "accessory", name: "Hack Squat", sets: 4, reps: 8,  suggest: withRatio(1.1) },
        { key: "accessory", name: "Front Squat", sets: 3, reps: 5,  suggest: withRatio(0.7) },
      ];
    case "dead":
      return [
        { key: "dead", name: "Trap Bar Deadlift", sets: 3, reps: 5, suggest: withRatio(1.05) },
        { key: "dead", name: "Romanian Deadlift", sets: 3, reps: 8, suggest: withRatio(0.7) },
        { key: "accessory", name: "Back Extension (Plate)", sets: 3, reps: 12, suggest: withRatio(0.3) },
        { key: "row", name: "Barbell Row", sets: 4, reps: 8, suggest: withRatio(0.55), notes: "デッドの~55%" },
      ];
    case "ohp":
      return [
        { key: "ohp", name: "Dumbbell Shoulder Press", sets: 3, reps: 10, suggest: withRatio(0.6) }, // base=bench
        { key: "accessory", name: "Machine Shoulder Press", sets: 4, reps: 10, suggest: withRatio(0.55) },
        { key: "accessory", name: "Lateral Raise (Pair Total)", sets: 3, reps: 15, suggest: withRatio(0.25) },
      ];
    case "row":
      return [
        { key: "row", name: "Seated Cable Row", sets: 4, reps: 10, suggest: withRatio(0.5) }, // base=dead
        { key: "row", name: "Chest-supported Row", sets: 4, reps: 10, suggest: withRatio(0.45) },
        { key: "pulldown", name: "Lat Pulldown", sets: 3, reps: 10, suggest: withRatio(0.45) },
      ];
    case "pulldown":
      return [
        { key: "pulldown", name: "Assisted Pull-up", sets: 4, reps: 6, suggest: withRatio(0.45), notes: "補助量は適宜調整" }, // base=dead
        { key: "row", name: "Seated Row", sets: 4, reps: 10, suggest: withRatio(0.5) },
        { key: "accessory", name: "Straight-Arm Pulldown", sets: 3, reps: 12, suggest: withRatio(0.25) },
      ];
    case "accessory":
      return [
        { key: "accessory", name: "Face Pull", sets: 3, reps: 15, suggest: withRatio(0.2) },     // base=bench(仮)
        { key: "accessory", name: "Leg Extension", sets: 3, reps: 12, suggest: withRatio(0.3) }, // base=squat(仮)
        { key: "accessory", name: "Leg Curl", sets: 3, reps: 12, suggest: withRatio(0.35) },     // base=dead(仮)
        { key: "accessory", name: "Calf Raise", sets: 3, reps: 15, suggest: withRatio(0.3) },    // base=squat(仮)
      ];
    case "stretch":
      return [
        { key: "stretch", name: "Child's Pose", sets: 2, reps: 45, suggest: () => undefined, notes: "呼吸を深く" },
        { key: "stretch", name: "Doorway Chest Stretch", sets: 2, reps: 30, suggest: () => undefined },
        { key: "stretch", name: "Cat & Cow", sets: 2, reps: 10, suggest: () => undefined },
      ];
    default:
      return [];
  }
}