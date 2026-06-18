"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, CalendarClock, Check, CheckCircle2, ChevronDown, Clock, ListChecks, ShieldCheck, Sparkles, TrendingUp, type LucideIcon } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { useRenewalStore } from "@/lib/renewalStore";
import { gbp, gbpCompact, eur, eurCompact, accountsAsTaskRows } from "@/lib/renewalData";

const money = (cur: "GBP" | "EUR" | undefined, n: number) => (cur === "EUR" ? eur(n) : gbp(n));
const moneyCompact = (cur: "GBP" | "EUR" | undefined, n: number) => (cur === "EUR" ? eurCompact(n) : gbpCompact(n));
import type { RenewalStrategy, RenewalTaskRow } from "@/lib/renewalTypes";
import { cn } from "@/lib/utils";
import { RenewalHomeCommandBox } from "./RenewalHomeCommandBox";

type TabId = "tasks" | "approvals" | "recommendations";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "tasks", label: "My Renewal Tasks", icon: ListChecks },
  { id: "approvals", label: "Approvals", icon: CheckCircle2 },
  { id: "recommendations", label: "Recommendations", icon: Sparkles },
];

// ── Risk read-out (drives list dot, avatar tint, detail badge) ────────────────
type RiskTone = "danger" | "info" | "warning";
const RISK: Record<RenewalStrategy, { label: string; tone: RiskTone }> = {
  "Aggressive Defend": { label: "High risk", tone: "danger" },
  "High Risk Save": { label: "High risk", tone: "danger" },
  "Fix Billing Leakage": { label: "Billing fix", tone: "info" },
  "Margin Protect": { label: "Medium", tone: "warning" },
};
const TONE_DOT: Record<RiskTone, string> = { danger: "bg-danger", info: "bg-info", warning: "bg-warning" };
const TONE_TEXT: Record<RiskTone, string> = { danger: "text-danger", info: "text-info", warning: "text-warning" };
const TONE_SOFT: Record<RiskTone, string> = { danger: "bg-danger-bg text-danger", info: "bg-info-bg text-info", warning: "bg-warning-bg text-warning" };

const WHY_TITLE: Record<string, string> = {
  "Competitor risk": "Competitor risk identified",
  "Billing discrepancy": "Billing issue to resolve",
  "Margin decline": "Margin under pressure",
  "Usage decline": "Usage trending down",
  "Contract expiry": "Renewal window open",
  "High support cost": "Support cost running high",
};

const calInitials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
const daysSoft = (d: number) => (d <= 30 ? "bg-danger-bg text-danger" : d <= 90 ? "bg-warning-bg text-warning" : "bg-surface-muted text-muted");
const daysText = (d: number) => (d <= 30 ? "text-danger" : d <= 90 ? "text-warning" : "text-muted");

// Dashboard numbers — same UI as the demand-gen Home banner (one box, divided
// segments, tone-coloured numbers).
type DashTone = "primary" | "warning" | "danger" | "info" | "success";
const DASH_NUM: Record<DashTone, string> = {
  primary: "text-primary", warning: "text-warning", danger: "text-danger", info: "text-info", success: "text-success",
};
const DASHBOARD: { label: string; value: string; icon: LucideIcon; tone: DashTone }[] = [
  { label: "Open tasks", value: "16", icon: ListChecks, tone: "primary" },
  { label: "Due ≤30 days", value: "3", icon: CalendarClock, tone: "warning" },
  { label: "High risk", value: "5", icon: AlertTriangle, tone: "danger" },
  { label: "Need approval", value: "16", icon: ShieldCheck, tone: "info" },
  { label: "Saving offered", value: "€529,853", icon: TrendingUp, tone: "success" },
];

function RenewalDashboard() {
  return (
    <div
      className="mt-6 grid overflow-hidden rounded-2xl border border-primary-border/60 bg-gradient-to-r from-surface via-surface to-primary-subtle shadow-sm"
      style={{ gridTemplateColumns: `repeat(${DASHBOARD.length}, minmax(0, 1fr))` }}
    >
      {DASHBOARD.map((it, i) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className={cn("px-4 py-3.5", i > 0 && "border-l border-primary-border/40")}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="eyebrow">{it.label}</span>
              <Icon className={cn("h-4 w-4", DASH_NUM[it.tone])} />
            </div>
            <span className={cn("text-2xl font-semibold tabular-nums", DASH_NUM[it.tone])}>{it.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function RenewalTasksHome() {
  const approvals = useRenewalStore((s) => s.approvals);
  const addToast = useStore((s) => s.addToast);
  const [tab, setTab] = useState<TabId>("tasks");

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Greeting */}
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-strong">Good morning, Aanya</h1>
          </div>

          {/* Command box */}
          <div className="mb-6">
            <RenewalHomeCommandBox />
          </div>

          {/* Seller's-path tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border">
            {TABS.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              const count = t.id === "approvals" ? approvals.length : null;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative -mb-px flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-primary" : "text-muted hover:text-strong",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {count != null && count > 0 && (
                    <span className="rounded-full bg-primary-subtle px-1.5 text-[10px] font-semibold tabular-nums text-primary">{count}</span>
                  )}
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>

          {tab === "tasks" ? (
            <>
              <RenewalDashboard />
              <RenewalTaskBoard onAction={addToast} />
            </>
          ) : (
            <ComingSoon tab={tab} approvalCount={approvals.length} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Master–detail board ───────────────────────────────────────────────────────
type SortId = "due" | "attention" | "value";
const SORTS: { id: SortId; label: string }[] = [
  { id: "due", label: "Due date" },
  { id: "attention", label: "Accounts needing attention" },
  { id: "value", label: "Highest value" },
];
const ATTN_RANK: Record<RiskTone, number> = { danger: 0, info: 1, warning: 2 };
const SORT_FN: Record<SortId, (a: RenewalTaskRow, b: RenewalTaskRow) => number> = {
  due: (a, b) => a.daysToExpiry - b.daysToExpiry,
  attention: (a, b) => ATTN_RANK[RISK[a.strategy].tone] - ATTN_RANK[RISK[b.strategy].tone] || a.daysToExpiry - b.daysToExpiry,
  value: (a, b) => b.value - a.value,
};

function RenewalTaskBoard({ onAction }: { onAction: (message: string) => void }) {
  const openAccount = useRenewalStore((s) => s.openAccount);
  const [sort, setSort] = useState<SortId>("due");
  const [sortOpen, setSortOpen] = useState(false);
  const rows = accountsAsTaskRows().sort(SORT_FN[sort]);
  const worth = rows.filter((r) => r.daysToExpiry <= 60).reduce((sum, r) => sum + r.value, 0);
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

  return (
    <div className="mt-6 flex max-h-[calc(100vh-22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-strong">Renewal tasks</h2>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted">{rows.length}</span>
          <span className="hidden items-center gap-2 text-[13px] text-muted sm:flex">
            <span className="text-border" aria-hidden>|</span>
            Next 60 days · <span className="font-semibold text-strong">{gbpCompact(worth)}</span> to save
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setSortOpen((v) => !v)}
            aria-expanded={sortOpen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-text transition-colors hover:border-primary-border hover:text-primary"
          >
            Sorted by {SORTS.find((s) => s.id === sort)?.label.toLowerCase()}
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition-transform", sortOpen && "rotate-180")} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} aria-hidden />
              <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                <p className="eyebrow border-b border-border-subtle px-3 py-2">Sort by</p>
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSort(s.id); setSortOpen(false); }}
                    className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-surface-muted", s.id === sort ? "font-medium text-primary" : "text-text")}
                  >
                    <span className="flex-1">{s.label}</span>
                    {s.id === sort && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* List + detail */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[360px_1fr]">
        <ul role="listbox" aria-label="Renewal tasks" className="min-h-0 divide-y divide-border-subtle overflow-y-auto border-b border-border lg:border-b-0 lg:border-r">
          {rows.map((r) => (
            <TaskListItem key={r.id} row={r} selected={r.id === selected?.id} onSelect={() => setSelectedId(r.id)} />
          ))}
        </ul>
        {selected && <TaskDetail row={selected} onAction={onAction} onView={() => openAccount(selected.id)} />}
      </div>
    </div>
  );
}

function TaskListItem({ row: r, selected, onSelect }: { row: RenewalTaskRow; selected: boolean; onSelect: () => void }) {
  const risk = RISK[r.strategy];
  const [day, mon] = r.renewalDate.split(" ");
  return (
    <li role="option" aria-selected={selected}>
      <button
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50",
          selected ? "border-primary bg-primary-subtle/60" : "border-transparent hover:bg-surface-muted/60",
        )}
      >
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold", TONE_SOFT[risk.tone])} aria-hidden="true">
          {calInitials(r.customer)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-strong">{r.customer}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px]">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[risk.tone])} />
            <span className={cn("font-medium", TONE_TEXT[risk.tone])}>{risk.label}</span>
            <span className="text-muted">{moneyCompact(r.currency, r.value)}</span>
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[13px] font-medium tabular-nums text-strong">{day} {mon}</span>
          <span className={cn("block text-[13px] font-medium tabular-nums", daysText(r.daysToExpiry))}>{r.daysToExpiry}d</span>
        </span>
      </button>
    </li>
  );
}

function TaskDetail({ row: r, onAction, onView }: { row: RenewalTaskRow; onAction: (message: string) => void; onView: () => void }) {
  const risk = RISK[r.strategy];
  return (
    <div className="flex min-h-0 flex-col bg-surface-muted/30">
      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-3">
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold", TONE_SOFT[risk.tone])} aria-hidden="true">
            {calInitials(r.customer)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-strong">{r.customer}</h3>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium", TONE_SOFT[risk.tone])}>
                <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[risk.tone])} />
                {r.strategy}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted">{money(r.currency, r.value)} / yr · renews {r.renewalDate}</p>
          </div>
          <span className={cn("shrink-0 rounded-full px-3 py-1 text-[13px] font-medium", daysSoft(r.daysToExpiry))}>{r.daysToExpiry} days left</span>
        </div>

        {/* WHO + WHY NOW */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="eyebrow text-info">Who</p>
            <p className="mt-1.5 text-sm font-semibold text-strong">{r.contactName}</p>
            <p className="text-[13px] text-muted">{r.contactRole}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="eyebrow text-warning">Why now</p>
            <p className="mt-1.5 text-sm font-semibold text-strong">{WHY_TITLE[r.trigger] ?? r.trigger}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{r.reason}</p>
          </div>
        </div>

        {/* RECOMMENDED PLAY */}
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <p className="eyebrow text-primary">Recommended play — what</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-strong">{r.product}</h4>
            <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">Offer −{r.offerPct}%</span>
          </div>
          <ul className="mt-3 space-y-2.5">
            <ChecklistItem done>Call script ready</ChecklistItem>
            <ChecklistItem done>Campaign · {r.campaign || "Renewal play"} ({r.play})</ChecklistItem>
            <ChecklistItem>Email — <span className="font-semibold text-strong">draft, needs review</span></ChecklistItem>
          </ul>
        </div>
      </div>

      {/* Sticky footer actions */}
      <div className="shrink-0 border-t border-border bg-surface-muted/30 p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onAction(`Recommended play for ${r.customer}…`)} className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-strong transition-colors hover:bg-surface-muted">
            Recommended play
          </button>
          <button onClick={onView} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover">
            View in detail
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ done, children }: { done?: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-[13px] text-text">
      {done ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-bg text-success" aria-hidden="true">
          <Check className="h-3.5 w-3.5" />
        </span>
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" />
        </span>
      )}
      <span>{children}</span>
    </li>
  );
}

function ComingSoon({ tab, approvalCount }: { tab: TabId; approvalCount: number }) {
  const copy: Record<Exclude<TabId, "tasks">, { title: string; body: string }> = {
    approvals: { title: "Approvals", body: approvalCount > 0 ? `${approvalCount} over-cap offer${approvalCount === 1 ? "" : "s"} awaiting sign-off. The full approvals queue is coming soon.` : "Over-cap offers you send for sign-off will appear here — coming soon." },
    recommendations: { title: "Recommendations", body: "The full book of next-best renewal moves across every account — coming soon." },
  };
  const c = copy[tab as Exclude<TabId, "tasks">];
  return (
    <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-muted">
        <Clock className="h-5 w-5" />
      </span>
      <h2 className="text-base font-semibold text-strong">{c.title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted">{c.body}</p>
    </div>
  );
}
