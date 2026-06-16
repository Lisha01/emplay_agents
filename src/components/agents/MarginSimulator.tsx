"use client";

import { useState } from "react";
import { AlertCircle, Check, ChevronDown } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { accountRevenue, marginPct, segmentRevenue, usdCompact } from "@/lib/autoMode";
import type { Segment } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Offer & margin control for the Discount / bundle action. One hero number —
 * blended margin + cap status — leads; revenue and deltas are a quiet secondary
 * line; the discount slider (cap-marked, drives the number) sits inside; the
 * per-account table hides behind an expander. Deterministic margin model.
 */
export function MarginSimulator({ segment }: { segment: Segment }) {
  const setSegmentDiscount = useStore((s) => s.setSegmentDiscount);
  const escalateOverCap = useStore((s) => s.escalateOverCap);
  const accounts = useStore((s) => s.accounts);
  const marginInputs = useStore((s) => s.marginInputs);
  const cap = useStore((s) => s.plan?.recommendation.discount.maxPct) ?? 15;
  const [showAccounts, setShowAccounts] = useState(false);

  const disc = segment.discount;
  if (!disc) return null;

  const applied = disc.appliedPct;
  const inputs = marginInputs.filter((m) => segment.accountIds.includes(m.accountId));
  const baseRev = segmentRevenue(inputs, 0);
  const segRev = segmentRevenue(inputs, applied);
  const segMargin = marginPct(segment.baseMarginPct, applied);
  const overCap = applied > cap;

  const range = Math.max(1, disc.maxPct - disc.minPct);
  const pct = (v: number) => ((v - disc.minPct) / range) * 100;
  const ticks: number[] = [];
  for (let t = disc.minPct; t <= disc.maxPct; t += 5) ticks.push(t);

  const revDelta = segRev - baseRev;
  const marginDelta = segMargin - segment.baseMarginPct;
  const fmtRev = (n: number) => `${n > 0 ? "+" : "−"}${usdCompact(Math.abs(n))}`;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
      {/* Hero — the one big number: blended margin + cap status */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Blended margin</p>
          <p className={cn("text-4xl font-semibold leading-none tabular-nums", overCap ? "text-danger" : "text-strong")}>
            {segMargin}
            <span className="text-2xl">%</span>
          </p>
        </div>
        <div className="text-right">
          {overCap ? (
            <span className="inline-flex items-center gap-1 text-[13px] font-medium text-danger">
              <AlertCircle className="h-4 w-4" /> {applied}% over your {cap}% cap
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[13px] font-medium text-success">
              <Check className="h-4 w-4" /> within your {cap}% cap
            </span>
          )}
          <p className="mt-0.5 text-[11px] text-muted">at {applied}% discount</p>
        </div>
      </div>

      {/* Secondary, quiet line — revenue + deltas */}
      <p className="text-xs text-muted">
        Segment revenue <span className="tabular-nums text-text">{usdCompact(segRev)}</span> · {fmtRev(revDelta)} vs list ·{" "}
        {marginDelta > 0 ? "+" : "−"}
        {Math.abs(marginDelta)} pts margin
      </p>

      {/* Discount slider — drives the number; cap marked */}
      <div>
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="uppercase tracking-wide text-muted">Discount</span>
          <span className="tabular-nums text-muted">
            limit cap <span className="font-semibold text-warning">{cap}%</span>
          </span>
        </div>
        <div className="relative h-8 select-none">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-surface-muted">
            <span className="absolute inset-y-0 left-0 bg-success-bg" style={{ width: `${pct(cap)}%` }} />
            <span className="absolute inset-y-0 right-0 bg-danger-bg" style={{ width: `${100 - pct(cap)}%` }} />
          </div>
          <div
            className={cn("absolute top-1/2 h-2 -translate-y-1/2 rounded-full", overCap ? "bg-danger" : "bg-primary")}
            style={{ width: `${pct(applied)}%` }}
          />
          <div className="absolute top-0 bottom-2 w-0.5 bg-warning" style={{ left: `${pct(cap)}%` }} aria-hidden />
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pct(applied)}%` }} aria-hidden>
            <span className={cn("block h-5 w-5 rounded-full border-2 border-surface shadow-sm", overCap ? "bg-danger" : "bg-primary")} />
          </div>
          <input
            type="range"
            min={disc.minPct}
            max={disc.maxPct}
            step={1}
            value={applied}
            onChange={(e) => setSegmentDiscount(segment.id, Number(e.target.value))}
            aria-label="Discount percent"
            className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] tabular-nums">
          {ticks.map((t) => (
            <span key={t} className={cn(t === cap ? "font-semibold text-warning" : "text-muted")}>{t}%</span>
          ))}
        </div>
      </div>

      {/* Per-account — hidden behind an expander */}
      <div className="overflow-hidden rounded-lg border border-border-subtle">
        <button onClick={() => setShowAccounts((v) => !v)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]">
          <span className="flex-1 text-text">See {inputs.length} accounts · revenue &amp; margin</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition-transform", showAccounts && "rotate-180")} />
        </button>
        {showAccounts && (
          <div className="border-t border-border-subtle px-3 py-2">
            <div className="grid grid-cols-[1fr_auto_3rem] gap-3 pb-1 text-[10px] uppercase tracking-wide text-muted">
              <span>Account</span>
              <span className="text-right">Revenue</span>
              <span className="text-right">Margin</span>
            </div>
            {inputs.map((mi) => {
              const acc = accounts.find((a) => a.id === mi.accountId);
              return (
                <div key={mi.accountId} className="grid grid-cols-[1fr_auto_3rem] items-center gap-3 py-1 text-[13px]">
                  <span className="min-w-0 truncate text-strong">{acc?.name ?? mi.accountId}</span>
                  <span className="text-right tabular-nums text-text">{usdCompact(accountRevenue(mi.dealSize, applied))}</span>
                  <span className={cn("text-right tabular-nums", overCap ? "text-danger" : "text-muted")}>{marginPct(mi.baseMarginPct, applied)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Over-cap escalation */}
      {overCap && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-danger/30 bg-danger-bg/40 p-3">
          <p className="flex min-w-0 flex-1 items-start gap-2 text-[13px] text-strong">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            {applied}% breaches your {cap}% cap — needs approval before it applies.
          </p>
          <Button size="sm" variant="secondary" onClick={() => setSegmentDiscount(segment.id, cap)}>
            Snap to cap
          </Button>
          <Button size="sm" variant="primary" onClick={() => escalateOverCap(segment.id, applied)}>
            Escalate for approval
          </Button>
        </div>
      )}
    </div>
  );
}
