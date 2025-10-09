// src/app/profile/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ===== 型（6ステップ新設計に合わせる）=====
type AgeGroup = "10代" | "20代" | "30代" | "40代以上";
type Experience = "ほとんど運動していない" | "週1〜2回くらい" | "週3回以上している";
type Barrier = "running" | "heavy" | "gym" | "machine" | "long";
type Duration = "10" | "20-30" | "45+";
type Day = "月" | "火" | "水" | "木" | "金" | "土" | "日";
type GoalId = "waist" | "abs_tone" | "hip_up" | "arms" | "posture" | "whole_tone";

// 表示オプション（Onboardingと同一にする）
const AGE_OPTIONS: AgeGroup[] = ["10代", "20代", "30代", "40代以上"];

const EXPERIENCE_OPTIONS: Experience[] = [
  "ほとんど運動していない",
  "週1〜2回くらい",
  "週3回以上している",
];

const GOAL_OPTIONS: { id: GoalId; label: string }[] = [
  { id: "waist", label: "くびれを作りたい" },
  { id: "abs_tone", label: "お腹を引き締めたい" },
  { id: "hip_up", label: "ヒップアップしたい" },
  { id: "arms", label: "二の腕をすっきりさせたい" },
  { id: "posture", label: "姿勢を良くしたい" },
  { id: "whole_tone", label: "全体的に引き締めたい" },
];

const BARRIER_OPTIONS: { id: Barrier; label: string }[] = [
  { id: "running", label: "走りたくない" },
  { id: "heavy", label: "重いバーベルは使いたくない" },
  { id: "gym", label: "ジムには通っていない" },
  { id: "machine", label: "マシン中心は苦手" },
  { id: "long", label: "長時間は続かない" },
];

const DAYS: Day[] = ["月", "火", "水", "木", "金", "土", "日"];

const DURATION_OPTIONS: { id: Duration; label: string }[] = [
  { id: "10", label: "10分" },
  { id: "20-30", label: "20〜30分" },
  { id: "45+", label: "45分以上" },
];

// 入力（日本語/旧値）→トークンへ正規化
function normalizeBarrier(v: unknown): Barrier | null {
  if (typeof v !== "string") return null;
  switch (v) {
    // 既定トークン
    case "running":
    case "heavy":
    case "gym":
    case "machine":
    case "long":
      return v;

    // 日本語ラベル（Onboarding保存の旧値）
    case "走りたくない":
      return "running";
    case "重いバーベルは使いたくない":
      return "heavy";
    case "長時間は続かない":
      return "long";
    case "マシン中心は苦手":
      return "machine";
    case "ジムには通っていない":
      return "gym";

    // 旧フラグ表記
    case "no_gym":
      return "gym";

    default:
      return null;
  }
}

// 日本語/既存配列 → GoalId 正規化
function normalizeGoal(v: unknown): GoalId | null {
  if (typeof v !== "string") return null;
  switch (v) {
    // 既定トークン（すでにGoalIdのとき）
    case "waist":
    case "abs_tone":
    case "hip_up":
    case "arms":
    case "posture":
    case "whole_tone":
      return v;

    // 日本語ラベル（Onboarding保存の旧値）
    case "くびれを作りたい":
      return "waist";
    case "お腹を引き締めたい":
      return "abs_tone";
    case "ヒップアップしたい":
      return "hip_up";
    case "二の腕をすっきりさせたい":
      return "arms";
    case "姿勢を良くしたい":
      return "posture";
    case "全体的に引き締めたい":
      return "whole_tone";

    default:
      return null;
  }
}

// 旧データ → 新データへのゆるいマッピング（互換用）
function normalizeFromLegacy(data: any) {
  const goalsFromLegacy: GoalId[] = [];

  // もし配列goalsが既に存在していれば、日本語/トークン混在を正規化
  if (Array.isArray(data?.goals)) {
    const mapped = (data.goals as unknown[]).map(normalizeGoal).filter(Boolean) as GoalId[];
    goalsFromLegacy.push(...mapped);
  }

  // 単一goal（旧）をざっくり対応付け
  switch (data?.goal) {
    case "slim":
      goalsFromLegacy.push("whole_tone");
      break;
    case "tone":
      goalsFromLegacy.push("abs_tone");
      break;
    case "muscle":
      goalsFromLegacy.push("arms");
      break;
    case "healthy":
      goalsFromLegacy.push("posture");
      break;
  }

  // targetAreas（旧）→ goals（新）
  if (Array.isArray(data?.targetAreas)) {
    if (data.targetAreas.includes("abs")) goalsFromLegacy.push("abs_tone");
    if (data.targetAreas.includes("hips")) goalsFromLegacy.push("hip_up");
    if (data.targetAreas.includes("arms")) goalsFromLegacy.push("arms");
    if (data.targetAreas.includes("back")) goalsFromLegacy.push("posture");
    if (data.targetAreas.includes("whole")) goalsFromLegacy.push("whole_tone");
  }

  // 重複排除
  const goals = Array.from(new Set(goalsFromLegacy)) as GoalId[];

  return {
    ageGroup: (data?.ageGroup ?? "") as AgeGroup | "",
    experience: (data?.experience ?? "") as Experience | "",
    goals,
    barriers: Array.isArray(data?.barriers) ? (data.barriers as unknown[]).map(normalizeBarrier).filter(Boolean) as Barrier[] : [],
    schedule: Array.isArray(data?.schedule) ? (data.schedule as Day[]) : [],
    duration: (data?.duration ?? "") as Duration | "",
  };
}

export default function ProfilePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // プロフィール状態（新スキーマ）
  const [profileData, setProfileData] = useState<{
    ageGroup: AgeGroup | "";
    experience: Experience | "";
    goals: GoalId[];
    barriers: Barrier[];
    schedule: Day[];
    duration: Duration | "";
  }>({
    ageGroup: "",
    experience: "",
    goals: [],
    barriers: [],
    schedule: [],
    duration: "",
  });

  // ===== 初期ロード：匿名ログイン → Firestore から読込 =====
  useEffect(() => {
    const stop = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          const cred = await signInAnonymously(auth);
          user = cred.user;
        }
        setUid(user.uid);

        // Firestore 読み込み
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() || {};
          // 新スキーマがあればそれを、なければ旧→新へ正規化
        const next = {
          ageGroup: (data.ageGroup ?? "") as AgeGroup | "",
          experience: (data.experience ?? "") as Experience | "",
          goals: Array.isArray(data.goals)
            ? ((data.goals as unknown[]).map(normalizeGoal).filter(Boolean) as GoalId[])
            : normalizeFromLegacy(data).goals,
          barriers: Array.isArray(data.barriers) ? (data.barriers as unknown[]).map(normalizeBarrier).filter(Boolean) as Barrier[] : [],
          schedule: Array.isArray(data.schedule) ? (data.schedule as Day[]) : [],
          duration: (data.duration ?? "") as Duration | "",
        };
          setProfileData(next);
        } else {
          // Firestoreが空なら localStorage（旧キー）から暫定復元
          try {
            const raw = localStorage.getItem("onboarding_form");
            const form = raw ? JSON.parse(raw) : {};
            const next = normalizeFromLegacy(form);
            setProfileData(next);
          } catch {
            /* noop */
          }
        }
      } catch (e) {
        console.error("プロフィール読込に失敗:", e);
      } finally {
        setInitialLoading(false);
      }
    });

    return () => stop();
  }, []);

  // ===== ユーティリティ =====
  const updateField = <K extends keyof typeof profileData>(field: K, value: (typeof profileData)[K]) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = <T extends Barrier | GoalId | Day>(
    field: "barriers" | "goals" | "schedule",
    item: T
  ) => {
    setProfileData((prev) => {
      const set = new Set(prev[field]);
      set.has(item) ? set.delete(item) : set.add(item);
      return { ...prev, [field]: Array.from(set) as any };
    });
  };

  // Today互換のため、保存時に旧onboarding_formも生成（ある程度の推論）
  const legacyForLocalStorage = useMemo(() => {
    // 代表goal（旧）は最初の1つを採用
    const goalMap: Record<GoalId, string> = {
      waist: "tone",
      abs_tone: "tone",
      hip_up: "tone",
      arms: "muscle",
      posture: "healthy",
      whole_tone: "slim",
    };
    const targetAreaMap: Record<GoalId, string> = {
      waist: "abs",
      abs_tone: "abs",
      hip_up: "hips",
      arms: "arms",
      posture: "back",
      whole_tone: "whole",
    };

    const first = profileData.goals[0];
    const legacyGoal = first ? goalMap[first] : "tone";

    const ta = Array.from(new Set(profileData.goals.map((g) => targetAreaMap[g])));

    return {
      experience: profileData.experience || "ほとんど運動していない",
      goal: legacyGoal,
      barriers: profileData.barriers,
      targetAreas: ta,
      duration: profileData.duration || "20-30",
      schedule: profileData.schedule,
    };
  }, [profileData]);

  // ===== 保存（Firestore へ書き込み & 互換のため localStorage も更新）=====
  const handleSave = async () => {
    if (!uid) return;

    // かんたんバリデーション
    if (!profileData.ageGroup) {
      alert("年齢層を選択してください");
      return;
    }
    if (!profileData.experience) {
      alert("運動経験を選択してください");
      return;
    }
    if (profileData.goals.length === 0) {
      alert("理想の体（目標）を1つ以上選択してください");
      return;
    }
    if (profileData.schedule.length === 0) {
      alert("運動する曜日を1つ以上選択してください");
      return;
    }
    if (!profileData.duration) {
      alert("1回あたりの時間を選択してください");
      return;
    }

    setSubmitting(true);
    try {
      // Firestore へ保存（新スキーマ）
      const ref = doc(db, "users", uid);
      await setDoc(
        ref,
        {
          ageGroup: profileData.ageGroup,
          experience: profileData.experience,
          goals: profileData.goals,
          barriers: profileData.barriers,
          schedule: profileData.schedule,
          duration: profileData.duration,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 既存ロジック互換：localStorage にも反映（Todayが旧キーを参照する場合に備える）
      localStorage.setItem("onboarding_form", JSON.stringify(legacyForLocalStorage));
      localStorage.setItem(
        "schedule_map",
        JSON.stringify(Object.fromEntries((profileData.schedule ?? []).map((d) => [d, true])))
      );

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (e) {
      console.error("プロフィール保存に失敗:", e);
      alert("保存中にエラーが発生しました。しばらくしてから再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== 画面 =====
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-pink-700">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-bold text-pink-800">プロフィール</h1>
        </div>

        {/* トースト */}
        {showToast && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
            <p className="text-emerald-800 text-sm text-center">プロフィールを保存しました！</p>
          </div>
        )}

        {/* カード */}
        <Card className="bg-white border-pink-100 shadow-sm">
          <CardContent className="p-6 space-y-6">

            {/* 年齢層 */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">年齢層</label>
              <div className="grid grid-cols-2 gap-2">
                {AGE_OPTIONS.map((age) => (
                  <button
                    key={age}
                    onClick={() => updateField("ageGroup", age)}
                    className={`py-3 px-4 rounded-xl text-sm transition-all ${
                      profileData.ageGroup === age
                        ? "bg-pink-100 border-2 border-pink-400 text-pink-800"
                        : "bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50"
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* 運動経験 */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">運動経験</label>
              <div className="flex flex-col gap-2">
                {EXPERIENCE_OPTIONS.map((exp) => (
                  <button
                    key={exp}
                    onClick={() => updateField("experience", exp)}
                    className={`py-3 px-4 rounded-xl text-sm transition-all text-left ${
                      profileData.experience === exp
                        ? "bg-pink-100 border-2 border-pink-400 text-pink-800"
                        : "bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50"
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            {/* 理想の体（目標） */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">理想の体（複数選択可）</label>
              <div className="space-y-2">
                {GOAL_OPTIONS.map((g) => (
                  <div key={g.id} className="flex items-center space-x-3 p-3 hover:bg-pink-25 rounded-lg">
                    <Checkbox
                      checked={profileData.goals.includes(g.id)}
                      onCheckedChange={() => toggleArrayItem("goals", g.id)}
                      className="border-pink-300 data-[state=checked]:bg-pink-500"
                    />
                    <label className="text-pink-800 text-sm cursor-pointer flex-1">
                      {g.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 避けたいこと */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">避けたいこと（複数選択可）</label>
              <div className="space-y-2">
                {BARRIER_OPTIONS.map((b) => (
                  <div key={b.id} className="flex items-center space-x-3 p-3 hover:bg-pink-25 rounded-lg">
                    <Checkbox
                      checked={profileData.barriers.includes(b.id)}
                      onCheckedChange={() => toggleArrayItem("barriers", b.id)}
                      className="border-pink-300 data-[state=checked]:bg-pink-500"
                    />
                    <label className="text-pink-800 text-sm cursor-pointer flex-1">{b.label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* 運動する曜日 */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">運動する曜日（複数選択可）</label>
              <div className="grid grid-cols-4 gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleArrayItem("schedule", d)}
                    className={`py-2 px-3 rounded-xl text-sm transition-all ${
                      profileData.schedule.includes(d)
                        ? "bg-pink-100 border-2 border-pink-400 text-pink-800"
                        : "bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-pink-600 text-xs">※ 後からいつでも変更できます</p>
            </div>

            {/* 1回あたりの時間 */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">1回あたりの時間</label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => updateField("duration", d.id)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm transition-all ${
                      profileData.duration === d.id
                        ? "bg-pink-100 border-2 border-pink-400 text-pink-800"
                        : "bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-3 rounded-xl shadow-lg disabled:opacity-60"
          >
            {submitting ? "保存中..." : "保存する"}
          </Button>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}