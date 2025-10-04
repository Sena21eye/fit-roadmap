"use client";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Rect = { x: number; y: number; w: number; h: number };

function getRect(el: HTMLElement | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
}

function toMaskStyle(target: Rect | null) {
  // 透明な穴が空くマスク（スポットライト）
  if (!target) return { WebkitMask: "none", mask: "none" } as any;
  const pad = 12; // ほんの少し余白
  const x = target.x - pad;
  const y = target.y - pad;
  const w = target.w + pad * 2;
  const h = target.h + pad * 2;
  // 角丸の四角穴
  const mask = `radial-gradient(12px at ${x}px ${y}px, transparent 12px, black 13px),
                radial-gradient(12px at ${x + w}px ${y}px, transparent 12px, black 13px),
                radial-gradient(12px at ${x}px ${y + h}px, transparent 12px, black 13px),
                radial-gradient(12px at ${x + w}px ${y + h}px, transparent 12px, black 13px),
                linear-gradient(black, black)`;
  const maskComposite =
    "exclude, exclude, exclude, exclude, source-over"; // 4隅の丸穴＋本体
  return {
    WebkitMaskComposite: maskComposite,
    maskComposite: maskComposite as any,
    WebkitMask: mask,
    mask: mask,
  } as any;
}

export type TutorialStep =
  | 0 // 非表示
  | 1 // 今日のメニューを強調
  | 2 // 完了ボタンを強調（押させる）
  | 3; // Progressリンクを強調→終了

type Props = {
  step: TutorialStep;
  setStep: (s: TutorialStep) => void;
  targets: {
    menuArea?: HTMLElement | null;
    completeBtn?: HTMLElement | null;
    progressLink?: HTMLElement | null;
  };
};

export default function TutorialOverlay({ step, setStep, targets }: Props) {
  const targetEl =
    step === 1 ? targets.menuArea :
    step === 2 ? targets.completeBtn :
    step === 3 ? targets.progressLink : null;

  const [rect, setRect] = useState<Rect | null>(null);
  useLayoutEffect(() => {
    const update = () => setRect(getRect(targetEl ?? null));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [targetEl]);

  // ボタン操作：次へ/スキップ
  const title = useMemo(() => {
    if (step === 1) return "ここからスタート！";
    if (step === 2) return "やったらここをタップ";
    if (step === 3) return "振り返りはここ";
    return "";
  }, [step]);

  const desc = useMemo(() => {
    if (step === 1) return "今日のメニューが出ます。まずは1つやってみよう。";
    if (step === 2) return "終わったら完了を押してログに残すよ。XPも貯まる！";
    if (step === 3) return "Progressで成長をチェック。続けるほど体は変わる。";
    return "";
  }, [step]);

  const next = () => setStep((step + 1) as TutorialStep);
  const skip = () => setStep(0);

  return (
    <AnimatePresence>
      {step > 0 && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .25 }}
          className="fixed inset-0 z-[80] pointer-events-auto"
          style={{}}
        >
          {/* 暗幕（穴あきマスク） */}
          <div
            className="absolute inset-0 bg-black/55"
            style={toMaskStyle(rect)}
            // 穴以外はクリック不可
            onClick={(e) => e.preventDefault()}
          />

          {/* 吹き出しカード */}
          <motion.div
            key={`bubble-${step}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[90] w-[min(92vw,560px)]"
          >
            <div className="rounded-2xl border bg-white/95 backdrop-blur p-4 shadow-xl">
              <div className="text-[11px] text-rose-400 font-semibold tracking-wide">TUTORIAL</div>
              <div className="mt-1 text-lg font-semibold">{title}</div>
              <p className="mt-1 text-sm text-neutral-600">{desc}</p>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={skip}
                  className="text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-700"
                >
                  スキップ
                </button>
                <div className="flex items-center gap-2">
                  {/* ステップドット */}
                  <div className="flex gap-1 mr-2">
                    {[1,2,3].map(i => (
                      <span
                        key={i}
                        className={`inline-block h-1.5 w-1.5 rounded-full ${i<=step ? "bg-rose-400" : "bg-neutral-300"}`}
                      />
                    ))}
                  </div>
                  {step < 3 ? (
                    <button
                      onClick={next}
                      className="rounded-full px-4 py-2 text-sm font-medium bg-rose-400 text-white hover:opacity-90"
                    >
                      次へ
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        localStorage.setItem("tutorialSeen","true");
                        setStep(0);
                      }}
                      className="rounded-full px-4 py-2 text-sm font-medium bg-rose-400 text-white hover:opacity-90"
                    >
                      理解した！
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
