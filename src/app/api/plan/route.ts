// src/app/api/plan/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // no cache

// ===== Types =====
type Plan = {
  label: string;
  dayKey: string;
  exercises: { key: string; name: string; sets: number; reps: number; notes?: string }[];
};

// ===== Local fallback =====
function fallbackPlan(goalText: string): Plan {
  const g = goalText.toLowerCase();
  if (g.includes("腹") || g.includes("腹筋") || g.includes("abs") || g.includes("six pack")) {
    return {
      label: "Core & Upper (Fallback)",
      dayKey: "CORE",
      exercises: [
        { key: "accessory", name: "Plank", sets: 3, reps: 30, notes: "30秒 ×3" },
        { key: "pulldown",  name: "Lat Pulldown", sets: 3, reps: 10 },
        { key: "bench",     name: "DB Bench Press", sets: 3, reps: 10 },
      ],
    };
  }
  return {
    label: "Full Body (Fallback)",
    dayKey: "FULL",
    exercises: [
      { key: "squat", name: "Goblet Squat", sets: 3, reps: 10 },
      { key: "row",   name: "Seated Row",   sets: 3, reps: 10 },
      { key: "ohp",   name: "DB Shoulder Press", sets: 3, reps: 10 },
    ],
  };
}

function buildPrompt(goalText: string) {
  return `
あなたはパーソナルトレーナーです。ユーザーの「なりたい体」テキストに基づき、
本日のワークアウトプランを JSON で返してください。日本語で考えて、日本語で出力してください。

要件:
- JSON 以外は一切出力しない（前後の説明文は禁止）
- JSON 形式:
  {
    "label": "string",
    "dayKey": "string",
    "exercises": [
      { "key": "bench|squat|dead|ohp|row|pulldown|accessory|stretch", "name": "string", "sets": number, "reps": number, "notes": "string (optional)" }
    ]
  }
- セット数・回数はビギナーに安全な範囲（例: 3〜5 セット、5〜12 回）
- 「過負荷の原則」を意識しつつ、今日は安全に実施できるボリューム
- 器具が埋まる可能性があるので、ビッグ3に固執しない

ユーザー入力: """${goalText.trim()}"""
`;
}

function safeParsePlan(text: string): Plan | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    if (obj && obj.label && obj.dayKey && Array.isArray(obj.exercises)) return obj as Plan;
    return null;
  } catch {
    return null;
  }
}

// ===== OpenRouter (primary) =====
async function callOpenRouter(prompt: string) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return { ok: false as const, status: 500, detail: "OPENROUTER_API_KEY is not set" };
  }
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "fit-roadmap-mvp",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "system", content: "You are a precise assistant that outputs only valid JSON. No prose." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 400,
      }),
      // @ts-ignore
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      return { ok: false as const, status: res.status, detail };
    }

    const data: any = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) {
      return { ok: false as const, status: 502, detail: "Empty content from OpenRouter" };
    }
    return { ok: true as const, text };
  } catch (e: any) {
    return { ok: false as const, status: 500, detail: String(e?.message || e) };
  }
}

// ===== Handler =====
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const goalText: string | undefined = body?.goalText;
    if (!goalText || typeof goalText !== "string") {
      return NextResponse.json({ error: "goalText is required" }, { status: 400 });
    }

    const prompt = buildPrompt(goalText);

    // 1) OpenRouter（無料枠モデル）
    const r = await callOpenRouter(prompt);
    if (r.ok) {
      const plan = safeParsePlan(r.text);
      if (plan) return NextResponse.json({ source: "or", plan });
      // JSON でなかったときはフォールバック
      return NextResponse.json({ source: "fallback", plan: fallbackPlan(goalText) });
    } else {
      // 失敗詳細を含めつつ、フォールバックは必ず返す（200）
      return NextResponse.json(
        { source: "fallback", plan: fallbackPlan(goalText), error: { via: "openrouter", status: r.status, detail: r.detail } },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", detail: String(e?.message || e) }, { status: 500 });
  }
}