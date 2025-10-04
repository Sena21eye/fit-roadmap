// src/components/progress.tsx
"use client";

import React from "react";
import {
  Flame,
  Trophy,
  Target,
  Zap,
  Crown,
  Star,
  Heart,
  Award,
} from "lucide-react";

/* ----------------- fallback UI primitives ----------------- */
type DivProps = React.HTMLAttributes<HTMLDivElement> & { className?: string };
const cn = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(" ");

export function Card({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-pink-100 bg-white shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
export function CardHeader({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <div className={cn("p-4 border-b border-pink-100", className)} {...props}>
      {children}
    </div>
  );
}
export function CardContent({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}
export function CardTitle({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <h3 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h3>
  );
}
export function Badge({ className, children, ...props }: React.PropsWithChildren<DivProps>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
// 横スクロールだけ必要なので簡易版
export function ScrollArea({
  className,
  children,
  ...props
}: React.PropsWithChildren<DivProps>) {
  return (
    <div className={cn("overflow-x-auto", className)} {...props}>
      {children}
    </div>
  );
}
/* ---------------------------------------------------------- */

export interface ProgressProps {
  streak: number;
  workoutHistory: any[]; // [{date, items:[{name, sets, reps, weight}], ...}] など想定
  totalWorkouts: number;
  totalSets: number;
  totalWeight: number;
}

const Progress: React.FC<ProgressProps> = ({
  streak,
  workoutHistory,
  totalWorkouts,
  totalSets,
  totalWeight,
}) => {
  // Hydration mismatch回避のため、乱数は使わず日付から決定的に強度を算出
  const hashString = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  };

  // 直近90日ヒートマップ（デモ用）
  const generateCalendarData = () => {
    const today = new Date();
    const daysToShow = 90;
    const calendarData: Array<{ date: string; intensity: number }> = [];

    // 履歴がある日付をセット化（無ければ空）
    const doneSet = new Set(
      (workoutHistory || []).map((h) =>
        (h.date || new Date(h.timestamp || Date.now()).toISOString().slice(0, 10))
      )
    );

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);

      let intensity = 0;
      if (doneSet.has(iso)) {
        // 乱数は使わず、日付文字列のハッシュで 1..3 を決定（決定的）
        intensity = (hashString(iso) % 3) + 1;
      } else {
        // 無データ日は 0（決定的）
        intensity = 0;
      }
      calendarData.push({ date: iso, intensity });
    }
    return calendarData;
  };

  const calendarData = generateCalendarData();
  const weeksData: typeof calendarData[] = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weeksData.push(calendarData.slice(i, i + 7));
  }

  const badges = [
    {
      id: "first-workout",
      name: "初回ワークアウト",
      icon: Trophy,
      earned: totalWorkouts > 0,
      color: "bg-yellow-200 text-yellow-800",
    },
    {
      id: "streak-7",
      name: "7日連続",
      icon: Flame,
      earned: streak >= 7,
      color: "bg-orange-200 text-orange-800",
    },
    {
      id: "workout-10",
      name: "10回達成",
      icon: Target,
      earned: totalWorkouts >= 10,
      color: "bg-blue-200 text-blue-800",
    },
    {
      id: "streak-30",
      name: "30日連続",
      icon: Crown,
      earned: streak >= 30,
      color: "bg-purple-200 text-purple-800",
    },
    {
      id: "workout-50",
      name: "50回達成",
      icon: Star,
      earned: totalWorkouts >= 50,
      color: "bg-green-200 text-green-800",
    },
    {
      id: "weight-1000",
      name: "総重量1t",
      icon: Heart,
      earned: totalWeight >= 1000,
      color: "bg-red-200 text-red-800",
    },
    {
      id: "streak-100",
      name: "100日連続",
      icon: Award,
      earned: streak >= 100,
      color: "bg-pink-200 text-pink-800",
    },
  ];

  const getIntensityColor = (i: number) =>
    i === 0 ? "bg-gray-100"
    : i === 1 ? "bg-pink-200"
    : i === 2 ? "bg-pink-400"
    : "bg-pink-600";

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl text-pink-800">Progress</h1>
          <Badge className="bg-pink-200 text-pink-800">
            <Flame className="w-4 h-4 mr-1" />
            {streak}日連続
          </Badge>
        </div>

        {/* Current Streak */}
        <Card className="bg-gradient-to-r from-pink-100 to-orange-100 border-pink-200">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <h2 className="text-2xl text-pink-800 mb-1">{streak}日連続</h2>
            <p className="text-pink-600">素晴らしい継続力です！</p>
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-pink-800">ワークアウトカレンダー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {weeksData.map((week, wi) => (
                <div key={wi} className="flex gap-1">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={cn("w-4 h-4 rounded-sm", getIntensityColor(day.intensity))}
                      title={day.date}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-pink-600">
              <span>少ない</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-100" />
                <div className="w-3 h-3 rounded-sm bg-pink-200" />
                <div className="w-3 h-3 rounded-sm bg-pink-400" />
                <div className="w-3 h-3 rounded-sm bg-pink-600" />
              </div>
              <span>多い</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 text-pink-500 mx-auto mb-2" />
              <div className="text-2xl text-pink-800">{totalWorkouts}</div>
              <div className="text-xs text-pink-600">累計回数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl text-pink-800">{totalSets}</div>
              <div className="text-xs text-pink-600">総セット数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl text-pink-800">{totalWeight}kg</div>
              <div className="text-xs text-pink-600">総重量</div>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-pink-800">バッジコレクション</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {badges.map((badge) => {
                  const Icon = badge.icon;
                  const earned = badge.earned;
                  return (
                    <div key={badge.id} className="flex-shrink-0 text-center">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center mb-2",
                          earned ? badge.color : "bg-gray-100"
                        )}
                      >
                        <Icon className={cn("w-8 h-8", earned ? "text-current" : "text-gray-400")} />
                      </div>
                      <div
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          earned ? "bg-pink-100 text-pink-800" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {badge.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;