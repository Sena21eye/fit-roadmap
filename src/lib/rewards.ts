// src/lib/rewards.ts
import { loadGamification, saveGamification } from "@/lib/storage";
import type { DailyLog } from "@/types";

/** ゲーミフィケーション保存形式 */
export type Gamification = {
  xp: number;
  streak: number;          // 連続日数
  lastDate?: string;       // 最終記録日 (YYYY-MM-DD)
  badges?: string[];       // 獲得バッジ一覧（重複なし）
};

/** ストレージから現在の報酬状態を取得（無ければ初期値） */
export function getRewards(): Gamification {
  const g = loadGamification<Gamification>();
  return {
    xp: g?.xp ?? 0,
    streak: g?.streak ?? 0,
    lastDate: g?.lastDate,
    badges: Array.isArray(g?.badges) ? g!.badges : [],
  };
}

/** 同日・翌日・連続切れを判定して streak を更新 */
function calcNextStreak(prevLastISO: string | undefined, newISO: string): number {
  if (!prevLastISO) return 1;
  if (prevLastISO === newISO) return 1; // 同日の場合 streak は 1 起点にしておく（好みで据え置きに変更可）

  const prev = new Date(prevLastISO + "T00:00:00");
  const cur = new Date(newISO + "T00:00:00");
  const diffDays = Math.floor((cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return undefined as never; // 呼び出し側で +1 するための印
  if (diffDays > 1) return 1;
  // 未来日や逆順はとりあえず 1 にリセット
  return 1;
}

/** バッジの判定（必要なら自由に増やしてOK） */
function evaluateBadges(g: Gamification): string[] {
  const earned: string[] = [];
  const set = new Set(g.badges ?? []);

  // しきい値バッジ
  const thresholds: Array<{ xp?: number; streak?: number; title: string }> = [
    { xp: 100, title: "XP100" },
    { xp: 300, title: "XP300" },
    { xp: 500, title: "XP500" },
    { streak: 3, title: "Streak3" },
    { streak: 7, title: "Streak7" },
    { streak: 14, title: "Streak14" },
    { streak: 30, title: "Streak30" },
  ];

  thresholds.forEach((t) => {
    const okXP = t.xp != null ? g.xp >= t.xp : false;
    const okStreak = t.streak != null ? g.streak >= t.streak : false;
    if ((t.xp != null && okXP) || (t.streak != null && okStreak)) {
      if (!set.has(t.title)) {
        set.add(t.title);
        earned.push(t.title);
      }
    }
  });

  return earned;
}

/**
 * その日の保存時に XP を加算してストレージへ反映（Today の「保存してXP獲得」など）
 * @param dateISO YYYY-MM-DD
 * @param xpGain  加算するXP（例: 10）
 * @returns 更新後の Gamification
 */
export function grantDailyRewards(dateISO: string, xpGain: number): Gamification {
  const prev = getRewards();

  // streak の計算
  let newStreak = prev.streak;
  if (!prev.lastDate) {
    newStreak = 1;
  } else if (prev.lastDate === dateISO) {
    // 同日内の複数回保存：streak は変えない
    newStreak = prev.streak;
  } else {
    const prevDate = new Date(prev.lastDate + "T00:00:00");
    const curDate = new Date(dateISO + "T00:00:00");
    const diff = Math.floor((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) newStreak = prev.streak + 1;
    else if (diff > 1) newStreak = 1; // 連続切れ
    else newStreak = 1;               // 未来/逆順はリセット
  }

  const updated: Gamification = {
    xp: Math.max(0, (prev.xp ?? 0) + (xpGain || 0)),
    streak: newStreak,
    lastDate: dateISO,
    badges: Array.isArray(prev.badges) ? [...prev.badges] : [],
  };

  // 新規バッジ
  const newlyEarned = evaluateBadges(updated);
  if (newlyEarned.length) {
    const s = new Set([...(updated.badges ?? []), ...newlyEarned]);
    updated.badges = Array.from(s);
  }

  saveGamification(updated);
  return updated;
}

/**
 * ログ内容に応じてゲーミフィケーションを更新（必要なら使用）
 * - 例: Big3 全成功なら追加XP など
 */
export function updateGamification(prev: Gamification | undefined, dateISO: string, log: DailyLog) {
  const base = prev ?? getRewards();

  // まずは日次の XP 付与（10XP など）を外でやっている前提。
  // ここでは “条件ボーナス” を加算する例を入れておく。
  let bonus = 0;
  const allSuccess =
    !!log?.lifts?.bench?.success &&
    !!log?.lifts?.squat?.success &&
    !!log?.lifts?.dead?.success;
  if (allSuccess) bonus += 5; // Big3 全成功ボーナス

  // 反映
  const updated = {
    ...base,
    xp: (base.xp ?? 0) + bonus,
    lastDate: dateISO,
    streak: base.streak ?? 1,
    badges: Array.isArray(base.badges) ? [...base.badges] : [],
  } as Gamification;

  // バッジ再評価
  const newlyEarned = evaluateBadges(updated);
  if (newlyEarned.length) {
    const s = new Set([...(updated.badges ?? []), ...newlyEarned]);
    updated.badges = Array.from(s);
  }

  return { gamification: updated, newlyEarned };
}