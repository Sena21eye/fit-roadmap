// src/lib/storage.ts
import type { Profile, DailyLog } from "@/types";

/* ===============================
   Keys
================================ */
const PROFILE_KEY = "fit_profile_v1";
const LEGACY_SESSIONS_KEY = "fit_sessions_v1";            // 旧互換
const LEGACY_DONE_KEY = "fit_done_v1";                    // 旧互換
const DAILY_LOGS_KEY = "fit_daily_logs_v1";               // v1 に統一
const WEEK_PLAN_PREFIX = "fit_week_plan_v1:";             // 週プラン（月曜開始ごと）
const GAMIFICATION_KEY = "gamification";

/* ===============================
   Profile
================================ */
export function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem(PROFILE_KEY);
  return s ? (JSON.parse(s) as Profile) : null;
}

/* ===============================
   （旧）セッション保存 - 互換のため残置
================================ */
export function saveSession(session: any) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LEGACY_SESSIONS_KEY);
  const arr = raw ? JSON.parse(raw) : [];
  arr.push(session);
  localStorage.setItem(LEGACY_SESSIONS_KEY, JSON.stringify(arr));
}
export function loadSessions(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LEGACY_SESSIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

/* ===============================
   （旧）Done フラグ - 互換のため残置
================================ */
type DoneMap = Record<string, { bench?: boolean; squat?: boolean; dead?: boolean }>;
function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function setDone(lift: "bench" | "squat" | "dead", value: boolean, date = new Date()) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LEGACY_DONE_KEY);
  const map: DoneMap = raw ? JSON.parse(raw) : {};
  const k = dayKey(date);
  map[k] = { ...(map[k] || {}), [lift]: value };
  localStorage.setItem(LEGACY_DONE_KEY, JSON.stringify(map));
}
export function getDoneFor(date = new Date()) {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(LEGACY_DONE_KEY);
  const map: DoneMap = raw ? JSON.parse(raw) : {};
  return map[dayKey(date)] || {};
}
export function getAllDone(): DoneMap {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(LEGACY_DONE_KEY);
  return raw ? JSON.parse(raw) : {};
}

/* ===============================
   日付ユーティリティ
================================ */
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
export function formatISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/**
 * 指定日が属する「月曜はじまり週」の月曜ISO（YYYY-MM-DD）を返す
 * 例：日曜なら前週の月曜
 */
export function weekStartMonday(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay(); // 0:Sun..6:Sat
  const diffToMon = day === 0 ? -6 : 1 - day; // 日曜は前週
  d.setDate(d.getDate() + diffToMon);
  return formatISO(d);
}

/* ===============================
   Gamification（XP, streak などの入れ物）
================================ */
export function loadGamification<T = any>(): T | undefined {
  if (typeof window === "undefined") return undefined;
  try { return JSON.parse(localStorage.getItem(GAMIFICATION_KEY) || "null") || undefined; }
  catch { return undefined; }
}
export function saveGamification(v: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(v));
}

/* ===============================
   週プラン（ /schedule 用 ）
================================ */
export type WeekPlan = {
  weekStartISO: string;        // 週の月曜（YYYY-MM-DD）
  sessionsPerWeek: 2 | 3 | 4;  // 週2/3/4
  days: boolean[];             // 長さ7, Mon..Sun の ON/OFF
};

export function loadWeekPlan(weekStartISO: string): WeekPlan | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(WEEK_PLAN_PREFIX + weekStartISO);
  return raw ? (JSON.parse(raw) as WeekPlan) : null;
}
export function saveWeekPlan(plan: WeekPlan) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WEEK_PLAN_PREFIX + plan.weekStartISO, JSON.stringify(plan));
}
export function prevWeekStart(weekStartISO: string): string {
  const d = new Date(weekStartISO + "T00:00:00");
  d.setDate(d.getDate() - 7);
  return formatISO(d);
}
/** 先週があればコピーして今週として保存して返す。無ければ null */
export function copyLastWeekIfAny(weekStartISO: string): WeekPlan | null {
  const prev = loadWeekPlan(prevWeekStart(weekStartISO));
  if (!prev) return null;
  const cloned: WeekPlan = { ...prev, weekStartISO };
  saveWeekPlan(cloned);
  return cloned;
}
/** 今日が予定日か？（plan.weekStartISO と日付の週が一致し、該当曜日が ON） */
export function isPlannedDay(dateISO: string, plan: WeekPlan): boolean {
  const ws = weekStartMonday(dateISO);
  if (ws !== plan.weekStartISO) return false;
  const d = new Date(dateISO + "T00:00:00");
  const day = d.getDay(); // 0:Sun..6:Sat
  const monIdx = day === 0 ? 6 : day - 1; // 配列は Mon..Sun
  return !!plan.days[monIdx];
}

/* ===============================
   DailyLog（v1に統一）
================================ */
export function loadDailyLogs(): DailyLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DAILY_LOGS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as DailyLog[]) : [];
  } catch {
    return [];
  }
}
export function loadDailyLog(dateISO: string): DailyLog | null {
  const all = loadDailyLogs();
  return all.find((l) => l.date === dateISO) ?? null;
}
export function saveDailyLog(newLog: DailyLog): void {
  if (typeof window === "undefined") return;
  const all = loadDailyLogs();
  const idx = all.findIndex((l) => l.date === newLog.date);
  if (idx >= 0) all[idx] = newLog; else all.push(newLog);
  localStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(all));
}

/* ===============================
   旧フォーマットからの救出（任意・一度だけ）
================================ */
function migrateLegacyDailyLogsOnce() {
  if (typeof window === "undefined") return;
  const doneFlag = localStorage.getItem("__dailylogs_migrated_v1");
  if (doneFlag) return;

  try {
    const keys = Object.keys(localStorage);
    const legacyKeys = keys.filter((k) => /^session_results_\d{4}-\d{2}-\d{2}$/.test(k));
    if (legacyKeys.length === 0) {
      localStorage.setItem("__dailylogs_migrated_v1", "1");
      return;
    }

    const aggregated = loadDailyLogs();
    for (const k of legacyKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        const date = k.slice("session_results_".length);
        const log: DailyLog = {
          date,
          lifts: obj?.lifts ?? { bench: { success: true }, squat: { success: true }, dead: { success: true } },
        };
        const i = aggregated.findIndex((l) => l.date === date);
        if (i >= 0) aggregated[i] = log; else aggregated.push(log);
      } catch { /* no-op */ }
    }

    localStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(aggregated));
    localStorage.setItem("__dailylogs_migrated_v1", "1");
  } catch { /* no-op */ }
}
// 起動時に一度だけ実行（不要なら削除OK）
migrateLegacyDailyLogsOnce();

/* ===============================
   （任意）デバッグ補助：キー一覧
================================ */
export function __debugListStorageKeys() {
  if (typeof window === "undefined") return [];
  return Object.keys(localStorage).sort();
}