"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDot,
  FileText,
  Loader2,
  Zap,
  type LucideIcon,
} from "@/components/ui/icons";
import { useStore, actionLabel } from "@/lib/store";
import { buildRunStages, marginPct, segmentRevenue, usdCompact } from "@/lib/autoMode";
import { AGENTS } from "@/lib/agents";
import { LeadResearch } from "@/components/agents/LeadResearch";
import { Qualification } from "@/components/agents/Qualification";
import { Recommendation } from "@/components/agents/Recommendation";
import { CampaignBuild } from "@/components/agents/CampaignBuild";
import type { AgentStep, RunAttentionItem } from "@/lib/types";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { PlanView } from "./PlanView";
import { Badge, routingTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { StatTile } from "@/components/ui/StatTile";
import { cn, prefersReducedMotion } from "@/lib/utils";

type Sel = "plan" | AgentStep;
type StepStatus = "done" | "running" | "pending";

/**
 * Step 3 — the watchable autonomous run. The left Sheets rail shows the approved
 * Plan, a separator, then the five agent steps advancing (running → done). The
 * canvas shows the selected step's streamed activity + its verbatim §6 output.
 * The final step surfaces the to-dos ("Needs your attention").
 */
export function RunView() {
  const router = useRouter();
  const plan = useStore((s) => s.plan);
  const advanceRun = useStore((s) => s.advanceRun);
  const completeRun = useStore((s) => s.completeRun);
  const setAutoRun = useStore((s) => s.setAutoRun);
  const setStep = useStore((s) => s.setStep);
  const addChat = useStore((s) => s.addChat);

  // data the stages populate (verbatim §6)
  const leads = useStore((s) => s.leads);
  const segments = useStore((s) => s.segments);
  const marginInputs = useStore((s) => s.marginInputs);
  const campaigns = useStore((s) => s.campaigns);
  const todos = useStore((s) => s.todos);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const runAttention = useStore((s) => s.runAttention);
  const openAccount = useStore((s) => s.openAccountInWorkbook);

  const stages = useMemo(() => (plan ? buildRunStages(plan) : []), [plan]);
  const total = stages.length;

  const [stageIndex, setStageIndex] = useState(0);
  const [activity, setActivity] = useState<{ id: string; stage: AgentStep; text: string }[]>([]);
  const [selected, setSelected] = useState<Sel>(1);
  const [recApproved, setRecApproved] = useState(false);
  const pinned = useRef(false);
  const completed = useRef(false);

  const done = stageIndex >= total;
  // Human checkpoint: the run holds before Campaign Build (step 4) until the rep
  // approves the recommendation (step 3). The agent does NOT advance on its own.
  const paused = stageIndex < total && stages[stageIndex]?.step === 4 && !recApproved;

  const stepStatus = (step: AgentStep): StepStatus => {
    const i = step - 1;
    if (i < stageIndex) return "done";
    if (i === stageIndex) return paused ? "pending" : "running";
    return "pending";
  };

  // Stream the active stage's lines, then populate the store and advance.
  useEffect(() => {
    if (!total) return;
    if (stageIndex >= total) {
      if (!completed.current) {
        completed.current = true;
        completeRun();
      }
      return;
    }
    if (paused) return; // hold for the rep's approval of the recommendation
    const stage = stages[stageIndex];
    const reduce = prefersReducedMotion();
    const timers: ReturnType<typeof setTimeout>[] = [];
    stage.lines.forEach((text, i) => {
      timers.push(
        setTimeout(
          () => setActivity((a) => [...a, { id: `s${stage.step}-l${i}`, stage: stage.step, text }]),
          reduce ? 0 : (i + 1) * 650,
        ),
      );
    });
    timers.push(
      setTimeout(
        () => {
          advanceRun(stage.step);
          setStageIndex((s) => s + 1);
        },
        reduce ? 0 : stage.lines.length * 650 + 500,
      ),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIndex, total, paused]);

  // Auto-follow the active stage unless the user pinned a sheet. While paused for
  // approval, hold focus on the Recommendation (step 3) so the rep can review it.
  useEffect(() => {
    if (pinned.current) return;
    if (paused) {
      setSelected(3);
      return;
    }
    setSelected(stageIndex >= total ? 5 : (stages[Math.min(stageIndex, total - 1)]?.step ?? 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIndex, total, paused]);

  const select = (s: Sel) => {
    pinned.current = true;
    setSelected(s);
  };

  const approveRecommendation = () => {
    pinned.current = false; // resume auto-follow into Campaign
    setRecApproved(true);
    addChat("user", "Approved the recommendation", "Auto");
    addChat("agent", "Approved — building the campaign now.", "Auto");
  };

  if (!plan) return null;

  // ── Left rail: Plan · separator · 5 steps ──────────────────────────────────
  const rail = (
    <div className="flex flex-col gap-1 p-3">
      <p className="eyebrow px-2 pb-1 pt-1">Sheets · {total + 1}</p>

      <RailRow
        label="Plan"
        icon={FileText}
        status="plan"
        selected={selected === "plan"}
        onClick={() => select("plan")}
      />

      <div className="my-1.5 flex items-center gap-2 px-2">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">The run</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {AGENTS.map((a) => {
        const status = stepStatus(a.step);
        const reached = status !== "pending";
        return (
          <RailRow
            key={a.step}
            label={a.name}
            icon={a.icon}
            status={status}
            step={a.step}
            selected={selected === a.step}
            disabled={!reached}
            onClick={() => reached && select(a.step)}
          />
        );
      })}
    </div>
  );

  // ── Canvas: selected sheet's output ────────────────────────────────────────
  const canvas = <div className="mx-auto max-w-3xl p-5">{renderOutput()}</div>;

  function renderOutput() {
    if (selected === "plan") return null; // the Plan sheet renders via its own return below
    const step = selected;
    const status = stepStatus(step);
    const agent = AGENTS[step - 1];
    const Icon = agent.icon;
    const stageDone = status === "done";
    return (
      <div className="space-y-3">
        <header className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="eyebrow">Step {step}</p>
            <h2 className="text-base font-semibold text-strong">{agent.name}</h2>
          </div>
          <span className="ml-auto">
            {stageDone ? (
              <Badge tone="approved" dot>Done</Badge>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-medium text-primary">
                <Loader2 className="h-3 w-3 animate-spin" /> Running
              </span>
            )}
          </span>
        </header>

        <ActivityLog step={step} running={status === "running"} />

        {step === 5 && done ? <ToDos /> : stageDone ? <StepPreview step={step} /> : null}
      </div>
    );
  }

  function ActivityLog({ step, running }: { step: AgentStep; running: boolean }) {
    const lines = activity.filter((a) => a.stage === step);
    return (
      <div className="space-y-1.5 rounded-xl border border-border bg-surface p-4">
        <p className="eyebrow mb-1">Activity log</p>
        {lines.map((l) => (
          <p key={l.id} className="flex items-start gap-2 text-[13px] text-text">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {l.text}
          </p>
        ))}
        {running && (
          <p className="flex items-center gap-2 text-[13px] text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Working…
          </p>
        )}
        {lines.length === 0 && !running && <p className="text-[13px] text-muted">Queued.</p>}
      </div>
    );
  }

  // Verbatim §6 preview per stage
  function StepPreview({ step }: { step: AgentStep }) {
    if (step === 1) {
      const rows = leads.slice(0, 6);
      return (
        <Panel title={`Resolved list · ${plan!.projectedAccounts} accounts · ${plan!.projectedContacts} contacts`}>
          <div className="divide-y divide-border-subtle">
            {rows.map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-strong">{l.name}</span>
                  <span className="block truncate text-xs text-muted">{l.title} · {l.company}</span>
                </span>
                <Badge tone={routingTone(l.routingBadge)} uppercase>{l.routingBadge}</Badge>
                <span className="w-7 text-right text-[13px] font-semibold tabular-nums text-strong">{l.score}</span>
              </div>
            ))}
          </div>
          <p className="pt-2 text-xs text-muted">+ {Math.max(0, plan!.projectedAccounts - rows.length)} more accounts resolved</p>
        </Panel>
      );
    }
    if (step === 2) {
      const chris = leads.find((l) => l.id === "lead-chris");
      if (!chris) return null;
      const axes: { label: string; value: number | null }[] = [
        { label: "ICP Fit", value: chris.scorecard.icpFit },
        { label: "Firmographics", value: chris.scorecard.firmographics },
        { label: "Intent", value: chris.scorecard.intent },
        { label: "Engagement", value: chris.scorecard.engagement },
        { label: "Recency", value: chris.scorecard.recency },
      ];
      return (
        <Panel title="Scorecard · Chris Kaspar — Softheon">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="nurture" uppercase>{chris.routingBadge}</Badge>
            <span className="text-sm font-semibold tabular-nums text-strong">{chris.score}</span>
            <span className="text-xs text-muted">{chris.routingNote}</span>
          </div>
          {axes.map((a) => <ScoreBar key={a.label} label={a.label} value={a.value} />)}
        </Panel>
      );
    }
    if (step === 3) {
      return (
        <Panel title={`Segments · ${segments.length} bundled`}>
          <div className="space-y-2">
            {segments.map((seg) => {
              const isDiscount = seg.nextBest.action === "discount_bundle";
              const inputs = marginInputs.filter((m) => seg.accountIds.includes(m.accountId));
              const applied = seg.discount?.appliedPct ?? 0;
              return (
                <div key={seg.id} className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[13px] font-medium text-strong">{seg.name}</span>
                    <Badge tone="neutral" className="ml-auto">{actionLabel(seg.nextBest.action)}</Badge>
                  </div>
                  <p className="text-[13px] text-muted">
                    {seg.accountIds.length} accounts · {seg.basis}
                    {isDiscount && (
                      <> · {applied}% discount → {usdCompact(segmentRevenue(inputs, applied))} at {marginPct(seg.baseMarginPct, applied)}% margin</>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
      );
    }
    if (step === 4) {
      const camp = campaigns.find((c) => c.name.startsWith("Softheon"));
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Sent" value={camp?.sent ?? 0} accent />
            <StatTile label="Replied" value={camp?.replied ?? 0} />
            <StatTile label="Meetings" value={camp?.meetings ?? 0} />
          </div>
          {camp && (
            <Panel title="Launched campaign">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-strong">{camp.name}</span>
                  <span className="block truncate text-xs text-muted">{camp.segment}</span>
                </span>
                <Badge tone="running" dot>Running</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {camp.channels.map((ch) => (
                  <span key={ch} className="rounded-full bg-surface-muted px-2 py-0.5 text-xs capitalize text-text">{ch}</span>
                ))}
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text">{camp.accounts} accounts</span>
              </div>
            </Panel>
          )}
        </div>
      );
    }
    return null;
  }

  function ToDos() {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-strong">Needs your attention</h3>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs tabular-nums text-muted">{runAttention.length}</span>
        </div>
        {runAttention.map((item) => <AttentionRunCard key={item.id} item={item} />)}

        <p className="eyebrow pt-2">To-dos</p>
        <div className="space-y-1 rounded-xl border border-border-subtle bg-surface p-2">
          {todos.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTodo(t.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-surface-muted"
            >
              {t.done ? <Check className="h-4 w-4 shrink-0 text-success" /> : <CircleDot className="h-4 w-4 shrink-0 text-muted" />}
              <span className={cn(t.done ? "text-muted line-through" : "text-text")}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function AttentionRunCard({ item }: { item: RunAttentionItem }) {
    const now = item.priority === "now";
    const act = (label: string) => {
      addChat("user", `${item.title} → ${label}`, "Auto");
      setAutoRun(false);
      if (item.accountId) openAccount(item.accountId, item.step);
      else setStep(item.step);
      router.push("/workbook");
    };
    return (
      <div className={cn("rounded-xl border bg-surface p-4", now ? "border-l-4 border-l-primary border-y-border border-r-border" : "border-border")}>
        <div className="flex items-start gap-2">
          <Zap className={cn("mt-0.5 h-4 w-4 shrink-0", now ? "text-primary" : "text-muted")} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-strong">{item.title}</p>
            <p className="mt-0.5 text-[13px] text-muted">{item.detail}</p>
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", now ? "bg-primary-subtle text-primary" : "bg-surface-muted text-muted")}>
            {now ? "Now" : "Can wait"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.actions.map((a) => (
            <Button key={a.label} size="sm" variant={a.primary ? "primary" : "secondary"} onClick={() => act(a.label)}>
              {a.label}
              {a.primary && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const footer = (
    <div className="flex items-center gap-3 border-t border-border bg-surface px-4 py-3 text-[13px]">
      {done ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-strong">Run complete · {runAttention.length} items need your attention</span>
          <Button variant="secondary" size="sm" className="ml-auto" onClick={() => router.push("/")}>
            View on Home <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : paused ? (
        <>
          <AlertCircle className="h-4 w-4 text-warning" />
          <span className="text-strong">Paused · your approval is needed on the recommendation before Campaign</span>
          <Button variant="primary" size="sm" className="ml-auto" onClick={approveRecommendation}>
            Approve &amp; continue <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-strong">Running autonomously · {Math.min(stageIndex, total)}/{total} stages complete</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setAutoRun(false); setStep(1); }}>
            Switch to manual
          </Button>
        </>
      )}
    </div>
  );

  // The Plan sheet shows the exact plan the rep approved — the same full PlanView
  // they reviewed pre-run (funnel, Q&A, sequence, rules), now read-only.
  if (selected === "plan") {
    return <WorkbookShell sheets={rail} canvas={<PlanView readOnly />} footer={footer} />;
  }

  // Lead Research & Qualification always render their real assist-mode UI (same
  // language as Assist), whether the stage is still streaming or done — the run's
  // Plan + steps rail stays on the left and the activity log moves into the screen's
  // "Plan for this list" tab.
  if (typeof selected === "number" && (selected === 1 || selected === 2) && stepStatus(selected) !== "pending") {
    const activityPanel = (
      <div className="mb-4">
        <ActivityLog step={selected} running={stepStatus(selected) === "running"} />
      </div>
    );
    return selected === 1 ? (
      <LeadResearch sheets={rail} planExtra={activityPanel} />
    ) : (
      <Qualification sheets={rail} planExtra={activityPanel} />
    );
  }

  // Recommendation renders its full screen once done — with the human-approval
  // checkpoint banner while the run is paused waiting on sign-off.
  if (selected === 3 && stepStatus(3) === "done") {
    return <Recommendation sheets={rail} approval={paused ? { onApprove: approveRecommendation } : undefined} />;
  }

  // Campaign Build renders its full campaigns-list UI in the run, too.
  if (selected === 4 && stepStatus(4) !== "pending") {
    return <CampaignBuild sheets={rail} />;
  }

  return <WorkbookShell sheets={rail} canvas={canvas} footer={footer} />;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="eyebrow mb-2">{title}</p>
      {children}
    </div>
  );
}

function RailRow({
  label,
  icon: Icon,
  status,
  step,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  status: StepStatus | "plan";
  step?: AgentStep;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-current={selected ? "step" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
        selected ? "bg-primary-subtle" : disabled ? "opacity-45" : "hover:bg-surface-muted",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          status === "plan"
            ? "bg-primary-subtle text-primary"
            : status === "done"
              ? "bg-success-bg text-success"
              : status === "running"
                ? "bg-primary text-primary-fg"
                : "bg-surface-muted text-muted",
        )}
      >
        {status === "plan" ? (
          <FileText className="h-3.5 w-3.5" />
        ) : status === "done" ? (
          <Check className="h-4 w-4" />
        ) : status === "running" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          step
        )}
      </span>
      <span className={cn("flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium", selected ? "text-primary" : "text-strong")}>
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className="truncate">{label}</span>
      </span>
      {status === "running" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />}
    </button>
  );
}
