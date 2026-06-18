"use client";

import { useState } from "react";
import { ChevronDown, Info, Sparkles } from "@/components/ui/icons";
import { POSTURE_META } from "@/lib/renewalData";
import type { ExplainableScore, RenewalPosture } from "@/lib/renewalTypes";
import { cn } from "@/lib/utils";

/** Triage posture pill — token colour only. */
export function PostureChip({ posture, className }: { posture: RenewalPosture; className?: string }) {
  const m = POSTURE_META[posture];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", m.chip, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

/** Days-to-expiry countdown chip — tightens tone as expiry nears. */
export function ExpiryChip({ days }: { days: number }) {
  const tone = days <= 14 ? "bg-danger-bg text-danger" : days <= 30 ? "bg-warning-bg text-warning" : "bg-surface-muted text-muted";
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums", tone)}>{days}d to expiry</span>;
}

/** Progress ring — "X of Y handled". Static (no motion); token colours. */
export function ProgressRing({ done, total, size = 64 }: { done: number; total: number; size?: number }) {
  const pct = total > 0 ? done / total : 0;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6} className="stroke-surface-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-strong">
        {done}/{total}
      </span>
    </div>
  );
}

/**
 * The renewal glass-box "why" — a plain-language reason behind an expander, plus the
 * rule the agent used. Mirrors the demand-gen explainability principle.
 */
export function WhyExpander({ whyText, ruleId, ruleText, defaultOpen = false }: { whyText: string; ruleId?: string; ruleText?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
      >
        <Info className="h-3.5 w-3.5" /> Why this?
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-border-subtle bg-surface-muted/50 p-3 text-[13px] text-text">
          <p>{whyText}</p>
          {ruleId && ruleText && (
            <p className="flex items-start gap-1.5 text-muted">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span><span className="font-semibold text-strong">Rule {ruleId}</span> — {ruleText}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** An explainable score row — number + inline "why" toggle (glass-box, no black box). */
export function ExplainableScoreRow({ score }: { score: ExplainableScore }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-3">
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-strong">{score.label}</span>
        <span className="ml-auto text-sm font-semibold tabular-nums text-strong">
          {score.score}
          <span className="text-xs text-muted">{score.suffix}</span>
        </span>
        <button onClick={() => setOpen((v) => !v)} aria-label="Why this score" aria-expanded={open} className="text-muted hover:text-primary">
          <Info className="h-4 w-4" />
        </button>
      </div>
      {open && <p className="mt-2 border-t border-border-subtle pt-2 text-[13px] text-muted">{score.why}</p>}
    </div>
  );
}

/** Small labelled stat used across the workspace header + economics. */
export function Vital({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "danger" | "warning" | "default" }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums", tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-strong")}>{value}</p>
    </div>
  );
}
