// src/app/roadmap/page.tsx
"use client";

import * as React from "react";
import type { Profile } from "@/types";
import { loadProfile, loadDailyLogs, todayStr } from "@/lib/storage";
import { generateRoadmap, estimateBig3Targets, estimateGoalWeightKg } from "@/lib/roadmap";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const today = todayStr();

// 2.5kg刻みラウンド（ページ内ローカル）
const roundToPlate = (x: number, step = 2.5) =>
  Math.round((Number.isFinite(x) ? x : 0) / step) * step;

const TodayDot: React.FC<any> = (props) => {
  const { cx, cy, payload, stroke } = props;
  if (!payload) return null;
  if (payload.date !== today) return null;
  return <circle cx={cx} cy={cy} r={5} fill={stroke || "#000"} />;
};

export default function RoadmapPage() {
  const [ready, setReady] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [dailyLogs, setDailyLogs] = React.useState<
    Array<{ date: string; weightKg?: number; lifts: any }>
  >([]);

  React.useEffect(() => {
    setProfile(loadProfile());
    setDailyLogs(loadDailyLogs());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-6">Roadmap</h1>
        <div className="space-y-4">
          <div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-72 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-6">Roadmap</h1>
        <p>
          まだ目標が設定されていません。
          <a className="underline" href="/onboarding">Onboarding</a> から設定してください。
        </p>
      </main>
    );
  }

  // ライブラリで週次日付・体重は生成（weightはこれを使う）
  const roadmap = generateRoadmap(profile);

  // “比率×体重”の再計算目標（保存値に依存しない）
  const baseWeightForTarget =
    (profile.goalWeightKg && profile.goalWeightKg > 0)
      ? profile.goalWeightKg
      : estimateGoalWeightKg(profile.currentWeightKg, profile.goalType, {
          bodyFatPct: profile.bodyFatPct,
          heightCm: profile.heightCm,
        });
  const recomputedTargets = estimateBig3Targets(profile.goalType, baseWeightForTarget);

  // 実測（日次）
  const actuals = dailyLogs.map((l) => ({
    date: l.date,
    actualWeight: l.weightKg ?? undefined,
    actualBench:  l.lifts?.bench?.weight ?? undefined,
    actualSquat:  l.lifts?.squat?.weight ?? undefined,
    actualDead:   l.lifts?.dead?.weight  ?? undefined,
  }));

  // 週次の date 軸に実測をマージ
  const xTicks = roadmap.map((r) => r.date);
  const rMap = new Map(roadmap.map((r) => [r.date, r]));
  const aMap = new Map(actuals.map((a) => [a.date, a]));

  // --- ここがポイント ---
  // bench/squat/dead は「保存済み目標」ではなく、
  // current -> (recomputedTargets) への線形補間シリーズを使って“上書き”する
  const weeks = Math.max(1, roadmap.length - 1);
  const sBench = Number(profile.lifts.bench.current.weight) || 0;
  const sSquat = Number(profile.lifts.squat.current.weight) || 0;
  const sDead  = Number(profile.lifts.dead .current.weight) || 0;
  const gBench = recomputedTargets.bench;
  const gSquat = recomputedTargets.squat;
  const gDead  = recomputedTargets.dead;

  const merged = xTicks.map((date, idx) => {
    const t = weeks === 0 ? 1 : idx / weeks; // 0→1
    const bench = roundToPlate(sBench + (gBench - sBench) * t);
    const squat = roundToPlate(sSquat + (gSquat - sSquat) * t);
    const dead  = roundToPlate(sDead  + (gDead  - sDead ) * t);

    const base = rMap.get(date)!; // weight は既存を使用
    const a    = aMap.get(date);

    return {
      date,
      // 目標（週次）
      weight: base?.weight,
      bench,
      squat,
      dead,
      // 実測（日次）
      actualWeight: a?.actualWeight,
      actualBench:  a?.actualBench,
      actualSquat:  a?.actualSquat,
      actualDead:   a?.actualDead,
    };
  });

  const goalDate = new Date(
    new Date(profile.startedAt).getTime() + (profile.weeksToGoal || 12) * 7 * 24 * 60 * 60 * 1000
  ).toISOString().split("T")[0];

  return (
    <main className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Roadmap</h1>

      {/* サマリー */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm px-2 py-1 rounded-full border">GoalType: <b>{profile.goalType}</b></span>
          <span className="text-sm px-2 py-1 rounded-full border">期限: <b>{goalDate}</b></span>
          <span className="text-sm px-2 py-1 rounded-full border">Bench目標(比率×体重): <b>{gBench}</b>kg</span>
          <span className="text-sm px-2 py-1 rounded-full border">Squat目標(比率×体重): <b>{gSquat}</b>kg</span>
          <span className="text-sm px-2 py-1 rounded-full border">Dead目標(比率×体重): <b>{gDead}</b>kg</span>
        </CardContent>
      </Card>

      {/* 体重の推移 */}
      <Card className="mb-6">
        <CardHeader><CardTitle>体重の推移</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={merged} syncId="roadmap-sync">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" ticks={xTicks} interval="preserveEnd" tickFormatter={(v) => String(v).slice(5)} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" name="目標体重" stroke="#fbbf24" dot={false} strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="actualWeight"
                name="実測体重"
                stroke="#b45309"
                strokeDasharray="4 2"
                dot={<TodayDot />}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Big3 の推移（保存値ではなく“再計算した目標”のラインを描画） */}
      <Card>
        <CardHeader><CardTitle>Big3の推移</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={merged} syncId="roadmap-sync">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" ticks={xTicks} interval="preserveEnd" tickFormatter={(v) => String(v).slice(5)} />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* 目標（週次：recomputed） */}
              <Line type="monotone" dataKey="bench" name="ベンチ目標(比率×体重)" stroke="#ef4444" dot={false} />
              <Line type="monotone" dataKey="squat" name="スクワット目標(比率×体重)" stroke="#10b981" dot={false} />
              <Line type="monotone" dataKey="dead"  name="デッド目標(比率×体重)"  stroke="#f59e0b" dot={false} />
              {/* 実測 */}
              <Line type="monotone" dataKey="actualBench" name="ベンチ実測" stroke="#ef4444" strokeDasharray="4 2" dot={<TodayDot />} />
              <Line type="monotone" dataKey="actualSquat" name="スクワット実測" stroke="#10b981" strokeDasharray="4 2" dot={<TodayDot />} />
              <Line type="monotone" dataKey="actualDead"  name="デッド実測"  stroke="#f59e0b" strokeDasharray="4 2" dot={<TodayDot />} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </main>
  );
}