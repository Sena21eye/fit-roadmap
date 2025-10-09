"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  ChevronRight,
  Heart,
  Target,
  Sparkles,
  Star,
  Calendar,
  User,
  Crown,
  Zap,
  Scale,
  Dumbbell,
  Shield,
  Clock,
  MapPin,
  Timer,
  Trophy,
  Gift,
  PartyPopper,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { anonymousLogin } from "@/lib/auth";
import { saveProfile } from "@/lib/firestore";

interface OnboardingProps {
  onComplete: (data: any) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  // 0: welcome, 1: age, 2: experience, 3: goals, 4: barriers, 5: schedule, 6: duration, default: done
  const MAX_STEP = 6;
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    ageGroup: "",
    experience: "",
    goals: [] as string[],
    barriers: [] as string[],
    schedule: [] as string[],
    duration: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof typeof formData, item: string) => {
    setFormData((prev) => {
      const arr = (prev[field] as unknown as string[]) ?? [];
      const next = arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
      return { ...prev, [field]: next };
    });
  };

const handleNext = async () => {
  if (step < MAX_STEP) return setStep(step + 1);
  if (submitting) return;

  setSubmitting(true);
  try {
    const user = await anonymousLogin();

    // === 1) goals（日本語→GoalId） ===
    const goalIdMap: Record<string,
      "waist" | "abs_tone" | "hip_up" | "arms" | "posture" | "whole_tone"
    > = {
      "くびれを作りたい": "waist",
      "お腹を引き締めたい": "abs_tone",
      "ヒップアップしたい": "hip_up",
      "二の腕をすっきりさせたい": "arms",
      "姿勢を良くしたい": "posture",
      "全体的に引き締めたい": "whole_tone",
    };
    const goalsForFirestore =
      (formData.goals ?? [])
        .map((g) => goalIdMap[g])
        .filter(Boolean);

    // === 2) barriers 正規化（UI→内部）===
    // UIのID: "走りたくない" / "重いバーベルは使いたくない" / "no_gym" / "マシン中心は苦手" / "長時間は続かない"
    const barrierMap: Record<string, "running" | "heavy" | "gym" | "machine" | "long"> = {
      "走りたくない": "running",
      "重いバーベルは使いたくない": "heavy",
      "no_gym": "gym",
      "マシン中心は苦手": "machine",
      "長時間は続かない": "long",
    };
    const barriersNormalized =
      (formData.barriers ?? [])
        .map((b) => barrierMap[b])
        .filter(Boolean);

    // === Firestore に保存するペイロード（新スキーマ） ===
    const forFirestore = {
      ageGroup: formData.ageGroup ?? "",
      experience: formData.experience ?? "",
      goals: goalsForFirestore,          // ← GoalId[]
      barriers: barriersNormalized,      // ← 内部キー
      schedule: formData.schedule ?? [],
      duration: formData.duration ?? "",
    };

    await saveProfile(user.uid, forFirestore);

    // === 互換: Today/menu.ts 用の localStorage ===
    // - goals は日本語のまま（menu.ts の GOAL_TO_AREA_WEIGHT が日本語キー）
    // - barriers は内部キー（特に "no_gym" → "gym" にしておく）
    const forLocalStorage = {
      ageGroup: formData.ageGroup ?? "",
      experience: formData.experience ?? "",
      goals: formData.goals ?? [],                 // 日本語
      barriers: barriersNormalized.filter((b) =>
        ["gym", "heavy", "running", "long"].includes(b)
      ),                                           // menu.ts が見るのはここ
      schedule: formData.schedule ?? [],
      duration: formData.duration ?? "",
    };

    try {
      localStorage.setItem("onboarding_form", JSON.stringify(forLocalStorage));
      localStorage.setItem("onboarding_done", "true");
      // schedule_map も作っておく（Today の判定互換）
      localStorage.setItem(
        "schedule_map",
        JSON.stringify(Object.fromEntries((forLocalStorage.schedule ?? []).map((d: string) => [d, true])))
      );
    } catch {}

    try {
      document.cookie = "onboarding_done=1; Max-Age=31536000; Path=/; SameSite=Lax";
      onComplete?.(forLocalStorage);
    } catch {}

    router.replace("/today");
  } catch (e) {
    console.error(e);
    alert("データ保存中にエラーが発生しました。");
  } finally {
    setSubmitting(false);
  }
};

  const canProceed = () => {
    switch (step) {
      case 0:
        return true; // welcome
      case 1:
        return !!formData.ageGroup; // 年齢層
      case 2:
        return !!formData.experience; // 運動経験
      case 3:
        return formData.goals.length > 0; // 目標（複数可）
      case 4:
        return true; // 避けたいことは任意
      case 5:
        return formData.schedule.length > 0; // 曜日
      case 6:
        return !!formData.duration; // 時間
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-pink-400 via-rose-400 to-orange-400 rounded-full flex items-center justify-center shadow-2xl">
                <Heart className="w-16 h-16 text-white" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl text-pink-800 leading-relaxed">
                あなたに合った
                <br />
                プランを作ります！
              </h1>
              <p className="text-pink-600 text-lg">
                簡単な質問に答えて、
                <br />
                理想の体づくりを始めましょう
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <User className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">まず、あなたについて教えてください</h2>
              <p className="text-pink-600">年齢層を選んでね</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-pink-800 text-lg">年齢層</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: "10代", icon: Star, gradient: "from-rose-400 to-pink-400" },
                  { id: "20代", icon: Star, gradient: "from-pink-400 to-rose-400" },
                  { id: "30代", icon: Crown, gradient: "from-purple-400 to-pink-400" },
                  { id: "40代以上", icon: Trophy, gradient: "from-orange-400 to-pink-400" },
                ].map((age) => {
                  const Icon = age.icon as any;
                  return (
                    <Card
                      key={age.id}
                      className={`cursor-pointer transition-all ${
                        formData.ageGroup === age.id
                          ? "bg-pink-100 border-pink-300 scale-105 shadow-lg"
                          : "bg-white border-pink-100 hover:bg-pink-50"
                      }`}
                      onClick={() => updateFormData("ageGroup", age.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div
                          className={`w-12 h-12 mx-auto bg-gradient-to-br ${age.gradient} rounded-full flex items-center justify-center mb-2`}
                        >
                          <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </div>
                        <span className="text-pink-800 text-sm">{age.id}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Dumbbell className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">普段どのくらいトレーニングしていますか？</h2>
              <p className="text-pink-600">合うものを1つ選んでね</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "ほとんど運動していない", icon: Sparkles, gradient: "from-green-400 to-blue-400", label: "ほとんど運動していない" },
                { id: "週1〜2回くらい", icon: Zap, gradient: "from-yellow-400 to-orange-400", label: "週1〜2回くらい" },
                { id: "週3回以上している", icon: Dumbbell, gradient: "from-red-400 to-pink-400", label: "週3回以上している" },
              ].map((exp) => {
                const Icon = exp.icon as any;
                return (
                  <Card
                    key={exp.id}
                    className={`cursor-pointer transition-all ${
                      formData.experience === exp.id
                        ? "bg-pink-100 border-pink-300 shadow-lg"
                        : "bg-white border-pink-100 hover:bg-pink-50"
                    }`}
                    onClick={() => updateFormData("experience", exp.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${exp.gradient} rounded-full flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-pink-800 text-lg">{exp.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Target className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">理想の体を教えてください（複数選択OK）</h2>
              <p className="text-pink-600">当てはまるものを選んでね</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "くびれを作りたい", icon: Scale, gradient: "from-pink-400 to-rose-400", label: "くびれを作りたい" },
                { id: "お腹を引き締めたい", icon: Shield, gradient: "from-blue-400 to-purple-400", label: "お腹を引き締めたい" },
                { id: "ヒップアップしたい", icon: Heart, gradient: "from-orange-400 to-red-400", label: "ヒップアップしたい" },
                { id: "二の腕をすっきりさせたい", icon: Dumbbell, gradient: "from-green-400 to-emerald-400", label: "二の腕をすっきりさせたい" },
                { id: "姿勢を良くしたい", icon: Crown, gradient: "from-indigo-400 to-blue-400", label: "姿勢を良くしたい" },
                { id: "全体的に引き締めたい", icon: Sparkles, gradient: "from-purple-400 to-pink-400", label: "全体的に引き締めたい" },
              ].map((goal) => {
                const Icon = goal.icon as any;
                const active = formData.goals.includes(goal.id);
                return (
                  <Card
                    key={goal.id}
                    className={`cursor-pointer transition-all ${
                      active ? "bg-pink-100 border-pink-300 scale-102 shadow-lg" : "bg-white border-pink-100 hover:bg-pink-50"
                    }`}
                    onClick={() => toggleArrayItem("goals", goal.id)}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${goal.gradient} rounded-full flex items-center justify-center shadow-md`}>
                        <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-pink-800 text-lg">{goal.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Shield className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">避けたいことはありますか？（複数選択OK）</h2>
              <p className="text-pink-600">なしでもOK（ジムに行かない場合は「ジムには通っていない」を選んでね）</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "走りたくない", icon: Zap, gradient: "from-red-400 to-orange-400", label: "走りたくない" },
                { id: "重いバーベルは使いたくない", icon: Dumbbell, gradient: "from-gray-400 to-slate-400", label: "重いバーベルは使いたくない" },
                { id: "no_gym", icon: MapPin, gradient: "from-teal-400 to-cyan-400", label: "ジムには通っていない" },
                { id: "マシン中心は苦手", icon: MapPin, gradient: "from-blue-400 to-indigo-400", label: "マシン中心は苦手" },
                { id: "長時間は続かない", icon: Clock, gradient: "from-yellow-400 to-orange-400", label: "長時間は続かない" },
              ].map((barrier) => {
                const Icon = barrier.icon as any;
                const active = formData.barriers.includes(barrier.id);
                return (
                  <Card
                    key={barrier.id}
                    className={`cursor-pointer transition-all ${
                      active ? "bg-pink-100 border-pink-300 shadow-lg" : "bg-white border-pink-100 hover:bg-pink-50"
                    }`}
                    onClick={() => toggleArrayItem("barriers", barrier.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${barrier.gradient} rounded-full flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-pink-800">{barrier.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Calendar className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">トレーニングできる曜日を教えてください</h2>
              <p className="text-pink-600">複数選択OK</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "月", icon: Star, gradient: "from-blue-400 to-indigo-400", label: "月曜日" },
                { id: "火", icon: Zap, gradient: "from-red-400 to-orange-400", label: "火曜日" },
                { id: "水", icon: Heart, gradient: "from-cyan-400 to-blue-400", label: "水曜日" },
                { id: "木", icon: Target, gradient: "from-green-400 to-emerald-400", label: "木曜日" },
                { id: "金", icon: Crown, gradient: "from-yellow-400 to-orange-400", label: "金曜日" },
                { id: "土", icon: Trophy, gradient: "from-purple-400 to-pink-400", label: "土曜日" },
                { id: "日", icon: Sparkles, gradient: "from-orange-400 to-red-400", label: "日曜日" },
              ].map((day) => {
                const Icon = day.icon as any;
                const active = formData.schedule.includes(day.id);
                return (
                  <Card
                    key={day.id}
                    className={`cursor-pointer transition-all ${
                      active ? "bg-pink-100 border-pink-300 scale-105 shadow-lg" : "bg-white border-pink-100 hover:bg-pink-50"
                    }`}
                    onClick={() => toggleArrayItem("schedule", day.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-10 h-10 mx-auto bg-gradient-to-br ${day.gradient} rounded-full flex items-center justify-center mb-2 shadow-md`}>
                        <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-pink-800 text-sm">{day.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-green-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Timer className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">1回あたり、どのくらいの時間でトレーニングできますか？</h2>
              <p className="text-pink-600">続けやすい時間でOK</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "10", icon: Zap, gradient: "from-yellow-400 to-orange-400", label: "10分", desc: "サクッと短時間" },
                { id: "20-30", icon: Target, gradient: "from-blue-400 to-purple-400", label: "20〜30分", desc: "しっかり集中" },
                { id: "45+", icon: Trophy, gradient: "from-red-400 to-pink-400", label: "45分以上", desc: "がっつりトレーニング" },
              ].map((d) => {
                const Icon = d.icon as any;
                return (
                  <Card
                    key={d.id}
                    className={`cursor-pointer transition-all ${
                      formData.duration === d.id
                        ? "bg-pink-100 border-pink-300 scale-102 shadow-lg"
                        : "bg-white border-pink-100 hover:bg-pink-50"
                    }`}
                    onClick={() => updateFormData("duration", d.id)}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${d.gradient} rounded-full flex items-center justify-center shadow-md`}>
                        <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-pink-800 text-lg">{d.label}</div>
                        <div className="text-pink-600 text-sm">{d.desc}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 rounded-full flex items-center justify-center shadow-2xl mb-6">
                <Gift className="w-16 h-16 text-white" strokeWidth={1.5} />
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                <PartyPopper className="w-8 h-8 text-yellow-400 animate-bounce" />
              </div>
              <div className="absolute top-4 right-1/4">
                <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
              </div>
              <div className="absolute top-4 left-1/4">
                <Star className="w-6 h-6 text-orange-400 animate-pulse delay-200" />
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl text-pink-800 leading-relaxed">
                あなた専用のプランが
                <br />
                完成しました！
              </h2>
              <div className="bg-gradient-to-r from-pink-100 to-orange-100 p-6 rounded-2xl border border-pink-200 shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-pink-500" />
                    <span className="text-pink-700 text-lg">理想の体づくりを始めましょう！</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-500" />
                    <span className="text-pink-700 text-lg">あなたなら絶対できます！</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <span className="text-pink-700 text-lg">一緒に頑張りましょう！</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-100" />
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-25 to-orange-50 p-4 flex flex-col">
      {/* Progress indicator */}
      {step > 0 && step <= MAX_STEP && (
        <div className="max-w-md mx-auto w-full mb-6">
          <div className="flex justify-between text-sm text-pink-600 mb-2">
            <span>
              {step}/{MAX_STEP}
            </span>
            <span>{Math.round((step / MAX_STEP) * 100)}%</span>
          </div>
          <div className="w-full bg-pink-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-pink-400 to-rose-400 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${(step / MAX_STEP) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">{renderStep()}</div>

      <div className="mt-8 max-w-md mx-auto w-full">
        <Button
          onClick={handleNext}
          disabled={!canProceed() || submitting}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white h-14 rounded-2xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:opacity-50"
        >
          {submitting ? "保存中..." : step === MAX_STEP ? "トレーニングを始める" : step === 0 ? "はじめる" : "次へ"}
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
