"use client";
import React from "react";

type Pt = { x: number; y: number };
type Series = { label: string; color: string; points: Pt[] };

function polyline(points: Pt[]) {
  return points.map(p => `${p.x},${p.y}`).join(" ");
}

export default function ChartRoadmap({
  weeks,
  bench,
  squat,
  dead,
  body,
}: {
  weeks: { weekIndex: number; label: string }[];
  bench: number[];
  squat: number[];
  dead: number[];
  body: number[];
}) {
  const W = 800, H = 260, PAD = 40;
  const n = weeks.length;

  // X 座標を等間隔に
  const xs = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, n - 1);

  // Y スケール（リフト用と体重用で別軸）
  const lifts = [...bench, ...squat, ...dead];
  const lyMin = Math.min(...lifts) * 0.95;
  const lyMax = Math.max(...lifts) * 1.05;
  const ly = (v: number) => PAD + (H - PAD * 2) * (1 - (v - lyMin) / (lyMax - lyMin || 1));

  const byMin = Math.min(...body) * 0.98;
  const byMax = Math.max(...body) * 1.02;
  const by = (v: number) => PAD + (H - PAD * 2) * (1 - (v - byMin) / (byMax - byMin || 1));

  const series: Series[] = [
    { label: "Bench", color: "#3b82f6", points: bench.map((v, i) => ({ x: xs(i), y: ly(v) })) },
    { label: "Squat", color: "#22c55e", points: squat.map((v, i) => ({ x: xs(i), y: ly(v) })) },
    { label: "Dead",  color: "#f59e0b", points: dead.map((v, i) => ({ x: xs(i), y: ly(v) })) },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[700px] w-full h-[260px] bg-white rounded-xl border">
        {/* グリッド */}
        <g stroke="#eee">
          {Array.from({ length: 5 }).map((_, i) => {
            const y = PAD + (i * (H - PAD * 2)) / 4;
            return <line key={i} x1={PAD} x2={W - PAD} y1={y} y2={y} />;
          })}
        </g>

        {/* X 目盛ラベル */}
        <g fontSize="10" fill="#6b7280">
          {weeks.map((w, i) => (
            <text key={i} x={xs(i)} y={H - 8} textAnchor="middle">{w.label}</text>
          ))}
        </g>

        {/* 体重（右軸）*/}
        <polyline
          fill="none"
          stroke="#94a3b8"
          strokeDasharray="4 4"
          strokeWidth={2}
          points={polyline(body.map((v, i) => ({ x: xs(i), y: by(v) })))}
        />
        {/* 体重軸ラベル */}
        <text x={W - PAD + 4} y={by(body[0])} fontSize="10" fill="#64748b">Body</text>

        {/* リフト線 */}
        {series.map(s => (
          <polyline key={s.label} fill="none" stroke={s.color} strokeWidth={3} points={polyline(s.points)} />
        ))}

        {/* 凡例 */}
        <g fontSize="11">
          {series.map((s, i) => (
            <g key={s.label} transform={`translate(${PAD + i * 120}, ${PAD - 14})`}>
              <rect width="20" height="3" y="6" fill={s.color} rx="2" />
              <text x="26" y="10" fill="#374151">{s.label}</text>
            </g>
          ))}
          <g transform={`translate(${PAD + series.length * 120}, ${PAD - 14})`}>
            <rect width="20" height="3" y="6" fill="#94a3b8" rx="2" />
            <text x="26" y="10" fill="#374151">Body</text>
          </g>
        </g>
      </svg>
    </div>
  );
}