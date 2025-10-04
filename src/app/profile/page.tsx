// src/app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// menu.ts の型に合わせた候補
type Experience = "初心者" | "ときどき" | "経験者";
type Goal = "slim" | "tone" | "muscle" | "healthy";
type Barrier = "running" | "heavy" | "gym" | "long";
type Area = "abs" | "legs" | "hips" | "arms" | "back" | "whole";
type Duration = "10" | "20-30" | "45+";
type Day = "月" | "火" | "水" | "木" | "金" | "土" | "日";

export default function ProfilePage() {
  const [showToast, setShowToast] = useState(false);

  const [profileData, setProfileData] = useState<{
    weight: string;
    experience: Experience | "";
    goal: Goal | "";
    barriers: Barrier[];
    targetAreas: Area[];
    duration: Duration | "";
    schedule: Day[];
  }>({
    weight: "",
    experience: "",
    goal: "",
    barriers: [],
    targetAreas: [],
    duration: "",
    schedule: [],
  });

  // 初期ロード：既存キー（onboarding_form / bodyWeight）から復元
  useEffect(() => {
    try {
      const raw = localStorage.getItem("onboarding_form");
      const form = raw ? JSON.parse(raw) : {};
      const bw =
        profileData.weight ||
        String(
          (form.bodyWeight ?? (localStorage.getItem("bodyWeight") ?? ""))
        );

      setProfileData({
        weight: bw,
        experience: (form.experience ?? "") as Experience | "",
        goal: (form.goal ?? "") as Goal | "",
        barriers: (Array.isArray(form.barriers) ? form.barriers : []) as Barrier[],
        targetAreas: (Array.isArray(form.targetAreas) ? form.targetAreas : []) as Area[],
        duration: (form.duration ?? "") as Duration | "",
        schedule: (Array.isArray(form.schedule) ? form.schedule : []) as Day[],
      });
    } catch {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field: keyof typeof profileData, value: any) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = <T extends Barrier | Area | Day>(
    field: "barriers" | "targetAreas" | "schedule",
    item: T
  ) => {
    setProfileData((prev) => {
      const arr = new Set(prev[field]);
      arr.has(item) ? arr.delete(item) : arr.add(item);
      return { ...prev, [field]: Array.from(arr) as any };
    });
  };

  const handleSave = () => {
    // validation（最低限）
    const w = Number(profileData.weight);
    if (!w || w <= 0) {
      alert("体重(kg)を入力してください");
      return;
    }
    if (!profileData.experience || !profileData.goal || !profileData.duration) {
      alert("運動経験・目標・時間を選択してください");
      return;
    }
    if (profileData.targetAreas.length === 0) {
      alert("気になる部位を1つ以上選択してください");
      return;
    }

    // today/menu.ts が読むキーに保存
    const { weight, ...rest } = profileData;
    const onboarding_form = {
      experience: rest.experience,
      goal: rest.goal,
      barriers: rest.barriers,
      targetAreas: rest.targetAreas,
      duration: rest.duration,
      schedule: (profileData.schedule ?? []) as Day[],
    };

    localStorage.setItem("onboarding_form", JSON.stringify(onboarding_form));
    const scheduleMap = Object.fromEntries(
      ((profileData.schedule ?? []) as Day[]).map(d => [d, true])
    );
    localStorage.setItem("schedule_map", JSON.stringify(scheduleMap));
    localStorage.setItem("bodyWeight", String(w));

    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-bold text-pink-800">Profile</h1>
        </div>

        {/* Toast */}
        {showToast && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
            <p className="text-emerald-800 text-sm text-center">
              プロフィールを保存しました！
            </p>
          </div>
        )}

        {/* Card */}
        <Card className="bg-white border-pink-100 shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Weight */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">体重(kg)</label>
              <Input
                type="number"
                placeholder="例: 52"
                value={profileData.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                className="border-pink-200 focus:border-pink-400"
              />
              <p className="text-pink-600 text-xs">※ 推奨重量の初期値に使います</p>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">運動経験</label>
              <div className="flex gap-2">
                {(["初心者", "ときどき", "経験者"] as Experience[]).map((exp) => (
                  <button
                    key={exp}
                    onClick={() => updateField("experience", exp)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm transition-all ${
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

            {/* Goal */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">目標</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "slim", label: "スリム" },
                  { id: "tone", label: "引き締め" },
                  { id: "muscle", label: "筋肉アップ" },
                  { id: "healthy", label: "健康維持" },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => updateField("goal", g.id)}
                    className={`py-3 px-4 rounded-xl text-sm transition-all ${
                      profileData.goal === (g.id as Goal)
                        ? "bg-pink-100 border-2 border-pink-400 text-pink-800"
                        : "bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barriers */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">避けたいこと（複数選択可）</label>
              <div className="space-y-2">
                {[
                  { id: "running", label: "走りたくない" },
                  { id: "heavy", label: "重いバーベルNG" },
                  { id: "gym", label: "ジム行かない" },
                  { id: "long", label: "長時間は無理" },
                ].map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center space-x-3 p-3 hover:bg-pink-25 rounded-lg"
                  >
                    <Checkbox
                      checked={profileData.barriers.includes(b.id as Barrier)}
                      onCheckedChange={() =>
                        toggleArrayItem("barriers", b.id as Barrier)
                      }
                      className="border-pink-300 data-[state=checked]:bg-pink-500"
                    />
                    <label className="text-pink-800 text-sm cursor-pointer flex-1">
                      {b.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Areas */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">気になる部位（複数選択可）</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "abs", label: "お腹" },
                  { id: "legs", label: "脚" },
                  { id: "hips", label: "お尻" },
                  { id: "arms", label: "二の腕" },
                  { id: "back", label: "背中" },
                  { id: "whole", label: "全身" },
                ].map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center space-x-2 p-2 hover:bg-pink-25 rounded-lg"
                  >
                    <Checkbox
                      checked={profileData.targetAreas.includes(a.id as Area)}
                      onCheckedChange={() =>
                        toggleArrayItem("targetAreas", a.id as Area)
                      }
                      className="border-pink-300 data-[state=checked]:bg-pink-500"
                    />
                    <label className="text-pink-800 text-xs cursor-pointer">
                      {a.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule (Weekdays) */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">運動する曜日（複数選択可）</label>
              <div className="grid grid-cols-4 gap-2">
                {(["月","火","水","木","金","土","日"] as Day[]).map((d) => (
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

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-pink-700 text-sm">1回あたりの時間</label>
              <div className="flex gap-2">
                {([
                  { id: "10", label: "10分" },
                  { id: "20-30", label: "20〜30分" },
                  { id: "45+", label: "45分以上" },
                ] as { id: Duration; label: string }[]).map((d) => (
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

        {/* Save */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-3 rounded-xl shadow-lg"
          >
            保存する
          </Button>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}