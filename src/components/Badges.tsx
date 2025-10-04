"use client";
import React from "react";
import { ACHIEVEMENTS, type Achievement } from "@/lib/achievements";

export default function Badges({ unlocked }: { unlocked: string[] }) {
  const has = new Set(unlocked);
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {ACHIEVEMENTS.map(a => (
        <div key={a.id} className={`rounded-xl p-3 border ${has.has(a.id) ? "bg-white" : "bg-gray-50 opacity-70"}`}>
          <div className="text-2xl">{a.icon}</div>
          <div className="font-semibold">{a.title}</div>
          <div className="text-sm text-gray-600">{a.desc}</div>
          {!has.has(a.id) && <div className="text-xs text-gray-400 mt-1">未解除</div>}
        </div>
      ))}
    </div>
  );
}