"use client";
import React from "react";

type SetTarget = { weight: number; reps: number };
type Props = {
  label: string;
  target: SetTarget;
  doneSets?: boolean[]; // 達成済み表示
  onRecord: (setIndex: number, weight: number, reps: number, success: boolean) => void;
};

export default function LiftCard({ label, target, doneSets = [false,false,false], onRecord }: Props) {
  const [inputs, setInputs] = React.useState<{ w: number; r: number }[]>([
    { w: target.weight, r: target.reps },
    { w: target.weight, r: target.reps },
    { w: target.weight, r: target.reps },
  ]);

  React.useEffect(() => {
    setInputs([
      { w: target.weight, r: target.reps },
      { w: target.weight, r: target.reps },
      { w: target.weight, r: target.reps },
    ]);
  }, [target]);

  return (
    <div className="border rounded-xl p-4 w-full max-w-xl bg-white/70 backdrop-blur">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold">{label}</div>
        <div className="text-sm text-gray-500">目標: {target.weight}kg × {target.reps}回 × 3set</div>
      </div>

      <div className="grid gap-2">
        {[0,1,2].map((i) => (
          <div key={i} className={`flex items-center gap-2 ${doneSets[i] ? "opacity-70" : ""}`}>
            <span className="w-10 text-sm">Set {i+1}</span>
            <input
              type="number"
              className="border p-1 rounded w-24"
              value={inputs[i].w}
              onChange={(e) => {
                const v = Number(e.target.value);
                setInputs(prev => prev.map((p, idx) => idx===i ? {...p, w:v} : p));
              }}
            />
            <span>kg</span>
            <input
              type="number"
              className="border p-1 rounded w-24"
              value={inputs[i].r}
              onChange={(e) => {
                const v = Number(e.target.value);
                setInputs(prev => prev.map((p, idx) => idx===i ? {...p, r:v} : p));
              }}
            />
            <span>回</span>

            <div className="ml-auto flex gap-2">
              <button
                className="px-3 py-1 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={doneSets[i]}
                onClick={() => onRecord(i, inputs[i].w, inputs[i].r, true)}
              >
                記録
              </button>
              <button
                className="px-3 py-1 rounded border text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                disabled={doneSets[i]}
                onClick={() => onRecord(i, inputs[i].w, inputs[i].r, false)}
                title="今日は届かなかった"
              >
                未達
              </button>
            </div>

            {doneSets[i] && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">達成</span>}
          </div>
        ))}
      </div>
    </div>
  );
}