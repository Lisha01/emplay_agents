"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ArrowUp,
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Database,
  Filter,
  Info,
  ListChecks,
  Mail,
  Megaphone,
  MessageSquareReply,
  Reply,
  Search,
  Send,
  Sparkles,
  Square,
  Sun,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import type { AttentionItem, CampaignStatus, Lead, Mode } from "@/lib/types";
import { Badge, routingTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ModeToggle } from "@/components/auto/ModeToggle";
import { computeStats } from "@/components/campaigns/shared";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { cn } from "@/lib/utils";

// The seed/demo query (this prompt's source of truth).
const SEED_QUERY =
  "Help me find the Product Managers in New York City in Tech/SaaS and Telecom, company headcount 251–500.";

const eyebrow = "text-[0.6875rem] font-semibold uppercase tracking-[0.06em]";

const urgencyOf = (item: AttentionItem) =>
  item.priority === "now"
    ? { label: "Act now", cls: "text-danger" }
    : { label: "This week", cls: "text-warning" };

// ── Numbers banner (one consistent pill across every tab) ─────────────────────
type Metric = { icon: LucideIcon; label: string; value: number | string; tone?: "default" | "success" | "info" | "primary" | "warning" | "danger" };
const TONE: Record<NonNullable<Metric["tone"]>, string> = {
  default: "text-muted",
  success: "text-success",
  info: "text-info",
  primary: "text-primary",
  warning: "text-warning",
  danger: "text-danger",
};
const NUM: Record<NonNullable<Metric["tone"]>, string> = {
  default: "text-strong",
  success: "text-success",
  info: "text-info",
  primary: "text-primary",
  warning: "text-warning",
  danger: "text-danger",
};

/** One box, separated segments — label + icon over a big colored number, on a
 *  subtle white → purple gradient. */
function MetricBanner({ items }: { items: Metric[] }) {
  return (
    <div
      className="grid overflow-hidden rounded-2xl border border-primary-border/60 bg-gradient-to-r from-surface via-surface to-primary-subtle shadow-sm"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className={cn("px-4 py-3.5", i > 0 && "border-l border-primary-border/40")}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="eyebrow">{it.label}</span>
              <Icon className={cn("h-4 w-4", TONE[it.tone ?? "default"])} />
            </div>
            <span className={cn("text-2xl font-semibold tabular-nums", NUM[it.tone ?? "default"])}>{it.value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── shared table-header controls ──────────────────────────────────────────────
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
      <Search className="h-3.5 w-3.5 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-36 bg-transparent text-sm text-strong outline-none placeholder:text-muted"
      />
    </div>
  );
}

const CAMP_FILTERS: ("all" | CampaignStatus)[] = ["all", "running", "paused", "completed"];
function CampaignFilters({ value, onChange }: { value: "all" | CampaignStatus; onChange: (v: "all" | CampaignStatus) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
      {CAMP_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
            value === f ? "bg-primary-subtle text-primary" : "text-muted hover:text-strong",
          )}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

function ViewLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
      {label} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

function useOpenInWorkbook() {
  const openAccount = useStore((s) => s.openAccountInWorkbook);
  const setAutoRun = useStore((s) => s.setAutoRun);
  const router = useRouter();
  return (accountId: string, step: AttentionItem["step"]) => {
    setAutoRun(false);
    openAccount(accountId, step);
    router.push("/workbook");
  };
}

function AttentionCard({ item }: { item: AttentionItem }) {
  const open = useOpenInWorkbook();
  const [more, setMore] = useState(false);
  const urgency = urgencyOf(item);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-strong">{item.accountName}</h3>
            <Badge tone={routingTone(item.routingBadge)} uppercase>{item.routingBadge}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-muted">{item.triggerSummary}</p>
        </div>
        <span className={cn("shrink-0", eyebrow, urgency.cls)}>{urgency.label}</span>
      </div>

      <div className="mt-3 rounded-lg bg-primary-subtle/60 p-3">
        <p className={cn(eyebrow, "mb-1 flex items-center gap-1 text-primary")}>
          <Sparkles className="h-3 w-3" /> Recommended
        </p>
        <p className="text-[13px] font-medium text-strong">{item.nextBestAction}</p>
        {item.note && (
          <p className="mt-1 flex items-start gap-1.5 text-[13px] text-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {item.note}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => open(item.accountId, item.step)}>
          {item.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <button
          onClick={() => setMore((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 text-[13px] text-muted hover:text-primary"
        >
          More on this
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", more && "rotate-180")} />
        </button>
      </div>

      {more && (
        <p className="mt-2 border-t border-border-subtle pt-2 text-[13px] text-muted">
          Auto-prepared this morning · enriched via Prospeo · routed {item.routingBadge} ({item.score}). Opening drops you at the right step with this account&rsquo;s context loaded.
        </p>
      )}
    </div>
  );
}

// Funnel bars deepen top → bottom (light lavender → saturated violet); dark labels throughout.
const FUNNEL_BG = ["bg-primary/15", "bg-primary/30", "bg-primary/45", "bg-primary/60", "bg-primary/80"];

const TABS = [
  { id: "today", label: "Today", icon: Sun },
  { id: "leads", label: "Leads", icon: Users },
  { id: "campaign", label: "Campaign", icon: Megaphone },
  { id: "pipeline", label: "Pipeline", icon: Filter },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ── Leads table ───────────────────────────────────────────────────────────────
function LeadsTable({ leads }: { leads: Lead[] }) {
  const open = useOpenInWorkbook();
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left">
            {["Name", "Company", "Industry", "Score", "Routing"].map((h) => (
              <th key={h} className={cn("px-3 py-2.5", eyebrow, "text-muted")}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr
              key={l.id}
              onClick={() => open(l.accountId, 2)}
              className="cursor-pointer border-b border-border-subtle transition-colors last:border-0 hover:bg-surface-muted"
            >
              <td className="px-3 py-2.5">
                <p className="font-medium text-strong">{l.name}</p>
                <p className="text-xs text-muted">{l.title}</p>
              </td>
              <td className="px-3 py-2.5 text-text">{l.company}</td>
              <td className="px-3 py-2.5 text-text">{l.industry}</td>
              <td className="px-3 py-2.5 font-semibold tabular-nums text-strong">{l.score}</td>
              <td className="px-3 py-2.5">
                <Badge tone={routingTone(l.routingBadge)} uppercase>{l.routingBadge}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const [value, setValue] = useState(SEED_QUERY);
  const [mode, setMode] = useState<Mode>("autonomous");
  const [tab, setTab] = useState<TabId>("today");
  const [leadQuery, setLeadQuery] = useState("");
  const [campQuery, setCampQuery] = useState("");
  const [campFilter, setCampFilter] = useState<"all" | CampaignStatus>("all");
  const router = useRouter();
  const startAuto = useStore((s) => s.startAuto);
  const startRun = useStore((s) => s.startRun);
  const setWorkbookMode = useStore((s) => s.setMode);
  const setAutoRun = useStore((s) => s.setAutoRun);
  const attention = useStore((s) => s.attentionItems);
  const todos = useStore((s) => s.todos);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const notifications = useStore((s) => s.notifications);
  const openAccount = useStore((s) => s.openAccountInWorkbook);
  const leads = useStore((s) => s.leads);
  const campaigns = useStore((s) => s.campaigns);

  const submit = () => {
    if (mode === "autonomous") {
      startAuto(value.trim() || SEED_QUERY);
    } else {
      setWorkbookMode("assist");
      setAutoRun(false);
      startRun(value.trim() || SEED_QUERY);
    }
    router.push("/workbook");
  };

  const sorted = [...attention].sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "now" ? -1 : 1));

  // ── banner metrics ──────────────────────────────────────────────────────────
  const openTodos = todos.filter((t) => !t.done).length;
  const replies = notifications.filter((n) => n.kind === "reply").length;
  const todayItems: Metric[] = [
    { icon: CheckCircle2, label: "Tasks", value: openTodos, tone: "primary" },
    { icon: Bell, label: "Alerts", value: notifications.length, tone: "info" },
    { icon: Megaphone, label: "Campaign reviews", value: sorted.length, tone: "warning" },
    { icon: MessageSquareReply, label: "Replies", value: replies, tone: "success" },
  ];

  const isNurture = (l: Lead) => l.routingBadge.toUpperCase().startsWith("NURTURE");
  const isMql = (l: Lead) => l.routingBadge.toUpperCase().startsWith("PRIORITY");
  const leadItems: Metric[] = [
    { icon: Users, label: "Leads", value: leads.length },
    { icon: CheckCircle2, label: "MQL", value: leads.filter(isMql).length, tone: "success" },
    { icon: Zap, label: "Nurture", value: leads.filter(isNurture).length, tone: "warning" },
    { icon: AlertCircle, label: "DQ", value: leads.filter((l) => l.score < 40).length, tone: "danger" },
    { icon: Database, label: "In queue", value: leads.filter((l) => l.queued).length, tone: "info" },
  ];

  const cs = computeStats(campaigns);
  const campaignItems: Metric[] = [
    { icon: Target, label: "Total", value: cs.total },
    { icon: Send, label: "Running", value: cs.running, tone: "success" },
    { icon: Mail, label: "Sent", value: cs.sent, tone: "info" },
    { icon: Reply, label: "Replied", value: cs.replied, tone: "primary" },
    { icon: CalendarCheck, label: "Meetings", value: cs.meetings, tone: "warning" },
  ];

  const qualified = leads.filter((l) => !isNurture(l)).length;
  const funnelTop = leads.length || 1;
  const funnel = [
    { label: "Leads", value: leads.length },
    { label: "Qualified", value: qualified },
    { label: "In campaign", value: Math.max(1, Math.round(qualified * 0.7)) },
    { label: "Replied", value: Math.max(1, Math.round(qualified * 0.45)) },
    { label: "Meetings booked", value: Math.max(1, Math.round(qualified * 0.22)) },
  ];
  const pipelineRecs: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: ListChecks, title: "Lift qualification", body: `Only ${qualified} of ${leads.length} leads qualify — weight intent higher to raise ICP fit.` },
    { icon: Zap, title: "Activate nurture", body: `${leads.filter(isNurture).length} leads are nurturing — re-score this morning's pull to promote MQLs.` },
    { icon: Megaphone, title: "Launch more campaigns", body: `${campaigns.length} campaigns live — send the Renewal-ready segment to add pipeline.` },
    { icon: CalendarCheck, title: "Double down on what works", body: "Meetings are converting — replicate the top campaign's cadence across segments." },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Greeting */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-strong">Good morning, Aanya</h1>
        </div>

        {/* Command start */}
        <div className="rounded-2xl border border-border bg-surface px-4 pb-2.5 pt-3 shadow-sm focus-within:border-primary-border">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            rows={2}
            placeholder="Describe who you want to reach, or drop a list to start from qualification…"
            className="min-h-12 w-full resize-none bg-transparent text-sm text-strong outline-none placeholder:text-muted"
          />
          <div className="flex items-center gap-2">
            <ModeToggle value={mode} onChange={setMode} />
            <button
              onClick={submit}
              aria-label="Start run"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-fg transition-colors hover:bg-primary-hover"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Triage tabs */}
        <div className="mt-6 flex items-center gap-1 border-b border-border">
          {TABS.map((t) => {
            const active = tab === t.id;
            const count =
              t.id === "today" ? sorted.length : t.id === "leads" ? leads.length : t.id === "campaign" ? campaigns.length : null;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative -mb-px flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "text-primary" : "text-muted hover:text-strong",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {count != null && (
                  <span className="rounded-full bg-primary-subtle px-1.5 text-[10px] font-semibold tabular-nums text-primary">{count}</span>
                )}
                {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>

        {/* ── Today ── */}
        {tab === "today" && (
          <div className="mt-6 space-y-6">
            <MetricBanner items={todayItems} />
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-semibold text-strong">Needs your attention</h2>
                  <span className="text-[13px] text-muted">{sorted.length} accounts</span>
                  <button onClick={() => router.push("/accounts")} className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {sorted.map((item) => <AttentionCard key={item.id} item={item} />)}
                </div>
              </section>

              <aside className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted" />
                    <h2 className="text-sm font-semibold text-strong">Alerts</h2>
                    {notifications.length > 0 && <span className="text-xs text-muted">{notifications.length} new</span>}
                  </div>
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { setAutoRun(false); openAccount(n.accountId, n.kind === "reply" ? 5 : 3); router.push("/workbook"); }}
                        className="flex w-full gap-2.5 rounded-xl border border-border-subtle bg-surface p-3 text-left hover:bg-surface-muted"
                      >
                        <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", n.kind === "reply" ? "bg-success-bg text-success" : "bg-primary-subtle text-primary")}>
                          {n.kind === "reply" ? <MessageSquareReply className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] text-strong">{n.body}</span>
                          <span className="text-xs text-muted">{n.at}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4 text-muted" />
                    <h2 className="text-sm font-semibold text-strong">To-dos</h2>
                  </div>
                  <div className="space-y-1 rounded-xl border border-border-subtle bg-surface p-2">
                    {todos.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => toggleTodo(t.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-surface-muted"
                      >
                        {t.done ? <Check className="h-4 w-4 shrink-0 text-success" /> : <Square className="h-4 w-4 shrink-0 text-muted" />}
                        <span className={cn(t.done ? "text-muted line-through" : "text-text")}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* ── Leads ── */}
        {tab === "leads" && (
          <div className="mt-6 space-y-5">
            <MetricBanner items={leadItems} />
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-strong">
                  All Leads <span className="font-normal text-muted">({leads.length})</span>
                </h2>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <SearchBox value={leadQuery} onChange={setLeadQuery} placeholder="Search leads…" />
                  <ViewLink label="View Leads" onClick={() => router.push("/accounts")} />
                </div>
              </div>
              <LeadsTable
                leads={leads.filter((l) =>
                  [l.name, l.company, l.industry].some((f) => f.toLowerCase().includes(leadQuery.toLowerCase())),
                )}
              />
            </div>
          </div>
        )}

        {/* ── Campaign ── */}
        {tab === "campaign" && (
          <div className="mt-6 space-y-5">
            <MetricBanner items={campaignItems} />
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-strong">
                  All Campaigns <span className="font-normal text-muted">({campaigns.length})</span>
                </h2>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <SearchBox value={campQuery} onChange={setCampQuery} placeholder="Search campaigns…" />
                  <CampaignFilters value={campFilter} onChange={setCampFilter} />
                  <ViewLink label="View Campaigns" onClick={() => { setAutoRun(false); router.push("/campaigns"); }} />
                </div>
              </div>
              <CampaignsTable
                campaigns={campaigns}
                hideControls
                query={campQuery}
                filter={campFilter}
                onOpen={() => { setAutoRun(false); router.push("/campaigns"); }}
              />
            </div>
          </div>
        )}

        {/* ── Pipeline ── */}
        {tab === "pipeline" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* left — funnel: label · centered % bar · count */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <p className="eyebrow mb-6">Pipeline funnel</p>
              <div className="space-y-4">
                {funnel.map((s, i) => {
                  const pct = Math.round((s.value / funnelTop) * 100);
                  return (
                    <div key={s.label} className="grid grid-cols-[128px_1fr_40px] items-center gap-4">
                      <span className="text-right text-[13px] leading-tight text-muted">{s.label}</span>
                      <div className="flex justify-center">
                        <div
                          className={cn("rounded-lg py-2.5 text-center text-[13px] font-semibold text-strong", FUNNEL_BG[i])}
                          style={{ width: `${pct}%`, minWidth: "3rem" }}
                        >
                          {pct}%
                        </div>
                      </div>
                      <span className="text-left text-[13px] tabular-nums text-muted">{s.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* right — recommendations to improve the pipeline */}
            <aside>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-strong">Improve your pipeline</h2>
              </div>
              <div className="space-y-3">
                {pipelineRecs.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.title} className="rounded-xl border border-border-subtle bg-surface p-3.5">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[13px] font-semibold text-strong">{r.title}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-muted">{r.body}</p>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
