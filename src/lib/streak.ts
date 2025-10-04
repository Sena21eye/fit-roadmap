// src/lib/streak.ts
import { loadDailyLogs, todayStr } from "@/lib/storage";
import type { DailyLog } from "@/types";

/** その日のログが「やった日」かどうかの簡易判定 */
export function didTrain(log: DailyLog): boolean {
  const anyLift =
    (log.lifts?.bench?.weight ?? 0) > 0 ||
    (log.lifts?.squat?.weight ?? 0) > 0 ||
    (log.lifts?.dead?.weight ?? 0) > 0;
  const hasWeight = typeof log.weightKg === "number" && log.weightKg > 0;
  return anyLift || hasWeight;
}

/** 連続記録（日数）を計算（今日を起点に過去へ） */
export function computeStreak(): number {
  const logs = loadDailyLogs().sort((a, b) => (a.date < b.date ? 1 : -1));
  const today = todayStr();
  let streak = 0;

  // 連続して「日付が today - n」で、かつ didTrain=true を数える
  const dateSet = new Set(logs.map(l => l.date));
  const getOffsetDate = (offset: number) => {
    const base = new Date(today + "T00:00:00");
    base.setDate(base.getDate() - offset);
    return base.toISOString().split("T")[0];
  };

  for (let n = 0; n < 365; n++) {
    const d = getOffsetDate(n);
    if (!dateSet.has(d)) {
      if (n === 0) continue; // 今日はまだ未保存の可能性を許容
      break;
    }
    const log = logs.find(l => l.date === d)!;
    if (didTrain(log)) streak++;
    else break;
  }
  return streak;
}

/** 褒めメッセージ（streakを使って強化） */
export function praiseMessage(streak: number): string {
  const base = [
    "よくやった！🔥",
    "素晴らしい！💪",
    "コツコツ継続、最高！✨",
    "ナイスワーク！🙌",
    "未来の自分が拍手してる👏",
  ];
  const pick = base[Math.floor(Math.random() * base.length)];
  if (streak >= 7) return `連続 ${streak}日！神継続…${pick}`;
  if (streak >= 3) return `連続 ${streak}日、波に乗ってる！${pick}`;
  if (streak >= 1) return `連続 ${streak}日目、いい流れ！${pick}`;
  return pick;
}