"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUp,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Gauge,
  Plus,
  Sparkles,
  Trash2,
} from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { ALL_SOURCES, CLARIFY_QUESTIONS } from "@/lib/autoMode";
import { AGENTS } from "@/lib/agents";
import type { Channel, Plan } from "@/lib/types";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PlanSheetRail } from "./PlanSheetRail";
import { cn } from "@/lib/utils";

const CHANNEL_LABEL: Record<Channel, string> = {
  linkedin: "LinkedIn",
  email: "Email",
  whatsapp: "WhatsApp",
};
const CHANNEL_ORDER: Channel[] = ["linkedin", "email", "whatsapp"];

const inputCls =
  "rounded-md border border-border bg-surface px-2 py-1 text-[13px] text-strong outline-none focus:border-primary";

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 mt-6 flex items-center gap-2">
        <p className="eyebrow">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function ToggleChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
        on
          ? "border-primary bg-primary-subtle text-primary"
          : "border-border bg-surface text-text hover:border-primary-border hover:text-primary",
      )}
    >
      {on && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

/** Questions & answers — the clarify exchange, editable inline via chips. */
function QnA() {
  const answers = useStore((s) => s.clarifyAnswers);
  const update = useStore((s) => s.updatePlanAssumption);
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      {CLARIFY_QUESTIONS.map((q) => (
        <div key={q.id} className="border-b border-border-subtle pb-3 last:border-0 last:pb-0">
          <p className="text-[13px] font-medium text-strong">{q.question}</p>
          {q.segments.map((seg) => {
            const selected = answers[seg.id] ?? [];
            return (
              <div key={seg.id} className="mt-2">
                {seg.label && <p className="eyebrow mb-1">{seg.label}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {seg.options.map((o) => {
                    const on = selected.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => update(seg.id, o.id)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          on
                            ? "border-primary bg-primary-subtle text-primary"
                            : "border-border bg-surface text-text hover:border-primary-border hover:text-primary",
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Step 2 — Plan (the contract). Fully editable before Approve & run: the funnel
 * overview, the clarify Q&A, the outreach sequence/steps, cadence & volume, sources,
 * and escalation rules are all tweakable inline.
 */
export function PlanCard() {
  const plan = useStore((s) => s.plan);
  const patchPlan = useStore((s) => s.patchPlan);
  const approveAndRun = useStore((s) => s.approveAndRun);
  const command = useStore((s) => s.command);
  const [edit, setEdit] = useState("");
  if (!plan) return null;

  const totalTouches = plan.sequence.reduce((n, s) => n + s.touches, 0);
  const sequenceLine = plan.sequence.map((s) => `${s.label} ${s.touches}× · ${s.window}`).join("  ·  ");

  const stages = [
    { desc: "Pull current customers & detect expansion signals", detail: plan.resolvedTargeting, badge: `≈ ${plan.projectedAccounts} accts · ${plan.projectedContacts} contacts` },
    { desc: "Score expansion-readiness on the 5-axis model", detail: `${plan.qualAxes.join(" · ")} — ${plan.qualThreshold}`, badge: "5 axes" },
    {
      desc: "Bundle into segments & pick the next best action",
      detail: `${plan.recommendation.segmentationBasis} · discount cap ${plan.recommendation.discount.minPct}–${plan.recommendation.discount.maxPct}% · ${plan.recommendation.abVariants} A/B variants`,
      badge: "3 segments",
    },
    { desc: "Draft sequences, assemble channels & launch", detail: `${plan.hook} · ${sequenceLine} · ${plan.dailyVolume} · log to ${plan.crmTarget}`, badge: `${totalTouches} touches` },
    { desc: "Track replies & meetings, route next best action", detail: plan.timeline, badge: "live" },
  ];

  // ── editors ────────────────────────────────────────────────────────────────
  const setSeq = (i: number, patch: Partial<Plan["sequence"][number]>) => {
    const sequence = plan.sequence.map((r, j) => (j === i ? { ...r, ...patch } : r));
    patchPlan({ sequence, channels: sequence.map((s) => s.channel) });
  };
  const removeSeq = (i: number) => {
    const sequence = plan.sequence.filter((_, j) => j !== i);
    patchPlan({ sequence, channels: sequence.map((s) => s.channel) });
  };
  const addChannel = () => {
    const missing = CHANNEL_ORDER.find((c) => !plan.sequence.some((s) => s.channel === c));
    if (!missing) return;
    const sequence = [...plan.sequence, { channel: missing, label: CHANNEL_LABEL[missing], touches: 4, window: "Day 0 → Day 10" }];
    patchPlan({ sequence, channels: sequence.map((s) => s.channel) });
  };

  const toggleSource = (src: string) =>
    patchPlan({ sources: plan.sources.includes(src) ? plan.sources.filter((s) => s !== src) : [...plan.sources, src] });

  const setRec = (patch: Partial<Plan["recommendation"]>) =>
    patchPlan({ recommendation: { ...plan.recommendation, ...patch } });
  const setCap = (k: "minPct" | "maxPct" | "appliedPct", v: number) =>
    setRec({ discount: { ...plan.recommendation.discount, [k]: Math.max(0, Math.min(100, v || 0)) } });

  const setRule = (i: number, value: string) =>
    patchPlan({ escalationRules: plan.escalationRules.map((r, j) => (j === i ? value : r)) });
  const removeRule = (i: number) => patchPlan({ escalationRules: plan.escalationRules.filter((_, j) => j !== i) });
  const addRule = () => patchPlan({ escalationRules: [...plan.escalationRules, ""] });

  // Natural-language edits dropped in the footer box. A few intents are applied
  // deterministically; anything else is captured as an escalation rule.
  const applyEdit = () => {
    const text = edit.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const capMatch = lower.match(/(\d{1,3})\s*%?/);
    const variantMatch = lower.match(/(\d{1,2})\s*(?:a\/b|ab|variant)/);
    let ack = "Applied to the plan.";

    if (/(cap|discount)/.test(lower) && capMatch) {
      const v = Math.max(0, Math.min(100, Number(capMatch[1])));
      patchPlan({
        recommendation: {
          ...plan.recommendation,
          discount: { ...plan.recommendation.discount, maxPct: v, appliedPct: Math.min(plan.recommendation.discount.appliedPct, v) },
        },
      });
      ack = `Capped discount at ${v}%.`;
    } else if (variantMatch) {
      const v = Math.max(1, Math.min(6, Number(variantMatch[1])));
      patchPlan({ recommendation: { ...plan.recommendation, abVariants: v } });
      ack = `Set A/B variants to ${v}.`;
    } else if (/whatsapp/.test(lower) && !plan.sequence.some((s) => s.channel === "whatsapp")) {
      const sequence = [...plan.sequence, { channel: "whatsapp" as Channel, label: "WhatsApp", touches: 3, window: "Day 0 → Day 8" }];
      patchPlan({ sequence, channels: sequence.map((s) => s.channel) });
      ack = "Added a WhatsApp channel.";
    } else {
      patchPlan({ escalationRules: [...plan.escalationRules, text] });
      ack = "Added it as an escalation rule.";
    }
    command(text, ack, "Plan");
    setEdit("");
  };

  const canMore = CHANNEL_ORDER.some((c) => !plan.sequence.some((s) => s.channel === c));

  const canvas = (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header + projected size */}
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-semibold text-strong">Here&rsquo;s the plan</h2>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-[13px] font-semibold text-primary">
          <Gauge className="h-3.5 w-3.5" />
          ≈ {plan.projectedAccounts} accounts · {plan.projectedContacts} contacts
        </span>
      </div>
      <p className="mb-3 text-sm text-muted">
        Review and tweak anything below, then approve — I&rsquo;ll run the whole funnel and only come back when I need a decision.
      </p>
      <div className="mb-2 flex items-start gap-2 rounded-lg bg-primary-subtle/50 px-3 py-2">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="text-[13px] text-strong">
          <span className="font-medium">Expanding in:</span> {plan.hook}
        </span>
      </div>

      {/* The funnel as stepped cards (overview, reflects your edits) */}
      <Section title={`The run · ${AGENTS.length} stages`}>
        <div className="space-y-2.5">
          {AGENTS.map((agent, i) => {
            const Icon = agent.icon;
            const s = stages[i];
            return (
              <div key={agent.step} className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-muted text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow">Step {agent.step}</p>
                    <p className="text-sm font-semibold text-strong">{agent.name}</p>
                    <p className="text-[13px] text-text">{s.desc}</p>
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-muted">
                      <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" /> {s.detail}
                    </p>
                  </div>
                  <Badge tone="neutral" className="shrink-0">{s.badge}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Questions & answers — editable */}
      <Section title="Your answers · tap to change">
        <QnA />
      </Section>

      {/* Recommendation assumptions — editable */}
      <Section title="Recommendation · segments, next best & discount cap">
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <label className="block">
            <span className="eyebrow mb-1 block">Segmentation basis</span>
            <input
              value={plan.recommendation.segmentationBasis}
              onChange={(e) => setRec({ segmentationBasis: e.target.value })}
              className={cn(inputCls, "w-full")}
            />
          </label>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="eyebrow">Discount cap</span>
            <input
              type="number"
              min={0}
              max={100}
              value={plan.recommendation.discount.minPct}
              onChange={(e) => setCap("minPct", Number(e.target.value))}
              className={cn(inputCls, "w-14 text-center")}
              aria-label="Discount cap minimum"
            />
            <span className="text-[13px] text-muted">–</span>
            <input
              type="number"
              min={0}
              max={100}
              value={plan.recommendation.discount.maxPct}
              onChange={(e) => setCap("maxPct", Number(e.target.value))}
              className={cn(inputCls, "w-14 text-center")}
              aria-label="Discount cap maximum"
            />
            <span className="text-[13px] text-muted">% · default applied</span>
            <input
              type="number"
              min={0}
              max={100}
              value={plan.recommendation.discount.appliedPct}
              onChange={(e) => setCap("appliedPct", Number(e.target.value))}
              className={cn(inputCls, "w-14 text-center")}
              aria-label="Default applied discount"
            />
            <span className="text-[13px] text-muted">%</span>
          </div>
          <label className="flex items-center gap-2">
            <span className="eyebrow">A/B variants</span>
            <input
              type="number"
              min={1}
              max={6}
              value={plan.recommendation.abVariants}
              onChange={(e) => setRec({ abVariants: Math.max(1, Math.min(6, Number(e.target.value) || 1)) })}
              className={cn(inputCls, "w-14 text-center")}
              aria-label="A/B variants"
            />
            <span className="text-[13px] text-muted">micro-segments × A/B</span>
          </label>
        </div>
      </Section>

      {/* Outreach sequence (steps) — editable */}
      <Section
        title="Outreach sequence · steps & cadence"
        action={
          canMore ? (
            <button onClick={addChannel} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add channel
            </button>
          ) : undefined
        }
      >
        <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
          {plan.sequence.map((row, i) => (
            <div key={row.channel} className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 text-[13px] font-medium text-strong">{CHANNEL_LABEL[row.channel]}</span>
              <input
                type="number"
                min={1}
                max={8}
                value={row.touches}
                onChange={(e) => setSeq(i, { touches: Math.max(1, Math.min(8, Number(e.target.value) || 1)) })}
                className={cn(inputCls, "w-14 text-center")}
                aria-label={`${CHANNEL_LABEL[row.channel]} touches`}
              />
              <span className="text-[13px] text-muted">touches ·</span>
              <input
                value={row.window}
                onChange={(e) => setSeq(i, { window: e.target.value })}
                className={cn(inputCls, "min-w-0 flex-1")}
                aria-label={`${CHANNEL_LABEL[row.channel]} window`}
              />
              <button onClick={() => removeSeq(i)} aria-label={`Remove ${CHANNEL_LABEL[row.channel]}`} className="rounded-md p-1.5 text-muted hover:bg-danger-bg hover:text-danger">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {plan.sequence.length === 0 && <p className="text-[13px] text-muted">No channels — add one to reach contacts.</p>}
        </div>
      </Section>

      {/* Cadence & volume + Sources — editable */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Section title="Cadence & volume">
          <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
            <label className="block">
              <span className="eyebrow mb-1 flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-primary" /> Daily volume</span>
              <input value={plan.dailyVolume} onChange={(e) => patchPlan({ dailyVolume: e.target.value })} className={cn(inputCls, "w-full")} />
            </label>
            <label className="block">
              <span className="eyebrow mb-1 block">Timeline</span>
              <input value={plan.timeline} onChange={(e) => patchPlan({ timeline: e.target.value })} className={cn(inputCls, "w-full")} />
            </label>
          </div>
        </Section>

        <Section title="Sources">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap gap-2">
              {ALL_SOURCES.map((src) => (
                <ToggleChip key={src} label={src} on={plan.sources.includes(src)} onClick={() => toggleSource(src)} />
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
              <Building2 className="h-3.5 w-3.5" /> Activities &amp; campaign synced to {plan.crmTarget}
            </p>
          </div>
        </Section>
      </div>

      {/* Escalation rules — editable */}
      <Section
        title="Escalation rules · when I'll come back to you"
        action={
          <button onClick={addRule} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add rule
          </button>
        }
      >
        <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
          {plan.escalationRules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
              <input value={rule} onChange={(e) => setRule(i, e.target.value)} className={cn(inputCls, "min-w-0 flex-1")} aria-label={`Escalation rule ${i + 1}`} />
              <button onClick={() => removeRule(i)} aria-label="Remove rule" className="rounded-md p-1.5 text-muted hover:bg-danger-bg hover:text-danger">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {plan.escalationRules.length === 0 && <p className="text-[13px] text-muted">No rules — the agent will run to completion without pausing.</p>}
        </div>
      </Section>
    </div>
  );

  const footer = (
    <div className="flex items-center gap-3 border-t border-border bg-surface px-3 py-3">
      {/* Far left — drop natural-language edits to the plan */}
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 focus-within:border-primary-border focus-within:bg-surface">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <input
          value={edit}
          onChange={(e) => setEdit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyEdit()}
          placeholder="Drop edits to the plan — e.g. 'cap discount at 15%', 'add WhatsApp', 'review first batch'"
          className="min-w-0 flex-1 bg-transparent text-sm text-strong outline-none placeholder:text-muted"
        />
        <button
          onClick={applyEdit}
          disabled={!edit.trim()}
          aria-label="Apply edit"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      {/* Right — apply the dropped edits, then approve & run */}
      <Button variant="outline" className="shrink-0" onClick={applyEdit} disabled={!edit.trim()}>
        Apply changes
      </Button>
      <Button variant="primary" className="shrink-0" onClick={approveAndRun} disabled={plan.sequence.length === 0}>
        Approve &amp; run
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return <WorkbookShell sheets={<PlanSheetRail />} canvas={canvas} footer={footer} />;
}
