import type { Profile, Session } from "@/types";

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  icon: string; // 絵文字でOK
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-log",    title: "はじめの一歩",      desc: "初めてセットを記録した", icon: "👟" },
  { id: "triple-clear", title: "フルコンプリート",  desc: "1日に3種目すべて達成",   icon: "🏆" },
  { id: "streak-3",     title: "3日連続達成",       desc: "3日連続で3種目達成",     icon: "🔥" },
  { id: "bench-100",    title: "ベンチ100",         desc: "ベンチで100kg達成",       icon: "💪" },
  { id: "big3-300",     title: "合計300kg",         desc: "Big3合計が300kgに到達",  icon: "⚙️" },
];

export function evaluateAchievements(
  profile: Profile,
  sessions: Session[],
  doneMap: Record<string, { bench?: boolean; squat?: boolean; dead?: boolean }>
): string[] {
  const unlocked = new Set<string>();

  // 1) 初記録
  if (sessions.length > 0) unlocked.add("first-log");

  // 2) 1日に3種目達成
  for (const v of Object.values(doneMap)) {
    if (v.bench && v.squat && v.dead) { unlocked.add("triple-clear"); break; }
  }

  // 3) 3日連続達成
  const days = Object.keys(doneMap).sort(); // yyyy-mm-dd 昇順
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const ok = !!(doneMap[days[i]]?.bench && doneMap[days[i]]?.squat && doneMap[days[i]]?.dead);
    if (!ok) { streak = 0; continue; }
    if (i === 0) { streak = 1; continue; }
    const prev = new Date(days[i - 1]);
    const cur  = new Date(days[i]);
    const diff = (cur.getTime() - prev.getTime()) / 86_400_000;
    streak = diff === 1 ? streak + 1 : 1;
    if (streak >= 3) { unlocked.add("streak-3"); break; }
  }

  // 4) ベンチ100
  const benchMax = Math.max(
    ...sessions.flatMap(s => s.lift === "bench" ? s.sets.map(t => t.weight) : [0])
  );
  if (benchMax >= 100) unlocked.add("bench-100");

  // 5) Big3合計300（現在または目標の合計が300以上なら解放）
  const curTotal  = profile.lifts.bench.current.weight + profile.lifts.squat.current.weight + profile.lifts.dead.current.weight;
  const goalTotal = profile.lifts.bench.goal.weight    + profile.lifts.squat.goal.weight    + profile.lifts.dead.goal.weight;
  if (curTotal >= 300 || goalTotal >= 300) unlocked.add("big3-300");

  return Array.from(unlocked);
}