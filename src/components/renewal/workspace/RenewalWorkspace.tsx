"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronDown, Clock, FileText, Gauge, Link2, Mail, MessageCircle, PhoneCall, RotateCcw, Send, SlidersHorizontal, Sparkles, Target, UserPlus, Users, Wand2, Zap, type LucideIcon } from "@/components/ui/icons";
import { useRenewalStore } from "@/lib/renewalStore";
import { accountFacts, type AccountFacts } from "@/lib/renewalFacts";
import { RENEWAL_STAGES, stageMeta } from "@/lib/renewalAgents";
import { gbp, eur } from "@/lib/renewalData";
import type { ContactStance, RenewalAccount, RenewalCampaign, RenewalPlayState, RenewalRecommendationDetail, RenewalTouch } from "@/lib/renewalTypes";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { LeftPanel } from "@/components/workbook/LeftPanel";
import { StagePipeline } from "@/components/workbook/StagePipeline";
import { StepFrame } from "@/components/workbook/StepFrame";
import { ChatPane } from "@/components/workbook/ChatPane";
import { PostureChip, WhyExpander, ExplainableScoreRow, Vital } from "../RenewalUI";

const moneyFor = (a: RenewalAccount) => (n: number) => (a.currency === "EUR" ? eur(n) : gbp(n));
const STANCE: Record<ContactStance, { label: string; cls: string }> = {
  detractor: { label: "Detractor", cls: "border-danger/40 text-danger" },
  supporter: { label: "Supporter", cls: "border-info/40 text-info" },
  neutral: { label: "Neutral", cls: "border-border text-muted" },
};
const strategyOf = (a: RenewalAccount) =>
  a.posture === "opportunity" ? "Grow the account"
    : a.posture === "steady" ? "Maximise retention"
    : a.competitiveThreat ? "Win price-sensitive"
    : "Protect margin";

const STATE_LABEL: Record<RenewalPlayState, string> = {
  draft: "Draft", in_review: "In review", approved: "Approved", sent_back: "Sent back", rejected: "Rejected", sent: "Sent",
};
const STATE_TONE: Record<RenewalPlayState, string> = {
  draft: "bg-surface-muted text-muted", in_review: "bg-warning-bg text-warning", approved: "bg-success-bg text-success",
  sent_back: "bg-warning-bg text-warning", rejected: "bg-danger-bg text-danger", sent: "bg-success-bg text-success",
};

// ── Shell ─────────────────────────────────────────────────────────────────────
export function RenewalWorkspace() {
  const account = useRenewalStore((s) => s.accounts.find((a) => a.id === s.activeAccountId));
  const stage = useRenewalStore((s) => s.currentStage);
  const maxStage = useRenewalStore((s) => s.maxStageReached);
  const setStage = useRenewalStore((s) => s.setStage);
  const chat = useRenewalStore((s) => s.chat);
  const command = useRenewalStore((s) => s.command);
  const close = useRenewalStore((s) => s.closeAccount);

  if (!account) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm text-muted">This account isn&rsquo;t in the renewal book yet.</p>
        <Button variant="outline" size="sm" onClick={close}>Back to tasks</Button>
      </div>
    );
  }

  const left = (
    <LeftPanel
      sheetsLabel="Stages"
      sheets={<StagePipeline steps={RENEWAL_STAGES} current={stage} maxReached={maxStage} onStep={setStage} label={`Stages · ${maxStage}/4`} />}
      chat={
        <ChatPane
          messages={chat}
          onSend={(t) => command(t, "Here's the read — see the open stage for detail.", "Co-pilot")}
          placeholder="Ask about this account…"
          emptyTitle="Co-pilot"
          suggestions={["Why is this account at risk?", "What changed since last renewal?", "What should I do this week?"]}
        />
      }
      chatCount={chat.length}
    />
  );

  const canvas = (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {stage === 1 && <BriefStage account={account} />}
      {stage === 2 && <RecommendationStage account={account} />}
      {stage === 3 && <CampaignStage account={account} />}
      {stage === 4 && <ApprovalStage account={account} />}
    </div>
  );

  return <WorkbookShell header={<AccountHeader account={account} onClose={close} />} left={left} canvas={canvas} footer={<CoPilotBar account={account} />} />;
}

function AccountHeader({ account: a, onClose }: { account: RenewalAccount; onClose: () => void }) {
  const accounts = useRenewalStore((s) => s.accounts);
  const openAccount = useRenewalStore((s) => s.openAccount);
  const [open, setOpen] = useState(false);
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
      <button onClick={onClose} aria-label="Back to tasks" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-strong">
        <ArrowRight className="h-4 w-4 rotate-180" />
      </button>
      <div className="relative">
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-surface-muted">
          <h1 className="text-sm font-semibold text-strong">{a.customer}</h1>
          <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
            <div role="menu" className="absolute left-0 top-full z-40 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
              <p className="eyebrow border-b border-border-subtle px-3 py-2">Switch account</p>
              <ul className="max-h-80 overflow-y-auto py-1">
                {accounts.map((acc) => (
                  <li key={acc.id}>
                    <button
                      onClick={() => { setOpen(false); if (acc.id !== a.id) openAccount(acc.id); }}
                      className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface-muted", acc.id === a.id && "bg-primary-subtle/40")}
                    >
                      <PostureChip posture={acc.posture} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-strong">{acc.customer}</span>
                        <span className="block truncate text-xs text-muted">{acc.segment} · renews {acc.contractEnd}</span>
                      </span>
                      {acc.id === a.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
      <span className="hidden text-[13px] text-muted sm:inline">{a.segment} · renews {a.contractEnd}</span>
      <PostureChip posture={a.posture} className="ml-1" />
    </header>
  );
}

function CoPilotBar({ account: a }: { account: RenewalAccount }) {
  const stage = useRenewalStore((s) => s.currentStage);
  const setStage = useRenewalStore((s) => s.setStage);
  const command = useRenewalStore((s) => s.command);
  const submitPlay = useRenewalStore((s) => s.submitPlay);
  const play = useRenewalStore((s) => s.play);
  const [v, setV] = useState("");
  const meta = stageMeta(stage);
  const facts = accountFacts(a);
  const billingBlocked = stage === 3 && !!a.billingDiscrepancy && !play?.billingResolved;
  const cta = stage === 4 ? (facts.guardrail.withinPolicy ? "Send to customer" : "Submit for approval") : meta.cta;

  const ask = () => { const t = v.trim(); if (!t) return; command(t, "Noted — I've factored that into this stage.", meta.name); setV(""); };
  const advance = () => (stage < 4 ? setStage(stage + 1) : submitPlay());

  return (
    <div className="border-t border-border bg-surface px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 transition-colors hover:border-primary-border hover:bg-surface focus-within:border-primary focus-within:bg-surface">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder={meta.prompt} className="min-w-0 flex-1 bg-transparent text-sm text-strong outline-none placeholder:text-muted" />
        </div>
        <Button variant="primary" onClick={advance} disabled={billingBlocked} title={billingBlocked ? "Resolve the billing discrepancy first" : undefined}>
          {cta} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────
function Card({ label, labelTone, children }: { label?: string; labelTone?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      {label ? <p className={cn("eyebrow", labelTone)}>{label}</p> : null}
      <div className={cn(label && "mt-2")}>{children}</div>
    </section>
  );
}

function Evidence({ label, tone, children }: { label: string; tone?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-border bg-surface">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <span className={cn("eyebrow", tone)}>{label}</span>
        <ChevronDown className={cn("ml-auto h-4 w-4 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-border-subtle p-4">{children}</div>}
    </section>
  );
}


// ── Stage 1 · Brief ───────────────────────────────────────────────────────────
function DetailCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3">
      <p className="eyebrow">{label}</p>
      <div className="mt-1 text-sm text-strong">{children}</div>
    </div>
  );
}

function SummaryTab({ account: a }: { account: RenewalAccount }) {
  const f = accountFacts(a);
  const money = moneyFor(a);
  const approvalRisk = a.approvalRisk ?? a.churnRisk.score;
  const triggerLabel = a.competitiveThreat ? "Competitor risk identified" : a.billingDiscrepancy ? "Billing issue to resolve" : "Renewal due";

  return (
    <div className="space-y-4">
      {/* Hero — account read */}
      <section className={cn("rounded-xl border p-4", a.posture === "urgent" ? "border-danger/30 bg-danger-bg/40" : "border-border bg-surface")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-strong"><Target className="h-5 w-5 text-muted" aria-hidden="true" /> {a.customer}</h2>
            <p className="mt-0.5 text-sm text-muted">{a.segment}</p>
          </div>
          <PostureChip posture={a.posture} />
        </div>
        <p className="mt-3 text-sm text-text">
          {a.customer}{a.readKeyword ? <> reads as <b className="font-semibold text-strong">{a.readKeyword}</b></> : null} — approval risk {approvalRisk}
          {a.savingOpportunity != null && <>, saving opportunity {a.savingOpportunity}</>}, {f.daysToExpiry} days to renewal on {money(a.value)} annual spend.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-surface px-2.5 py-1 text-danger"><Target className="h-3.5 w-3.5" />{strategyOf(a)}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-strong"><Zap className="h-3.5 w-3.5 text-warning" />{triggerLabel}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-surface px-2.5 py-1 text-danger"><Clock className="h-3.5 w-3.5" />{f.daysToExpiry} days</span>
        </div>
      </section>

      {/* Key contacts + changes over time */}
      <Card label="" labelTone="">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-strong">Key contacts</h3>
          <span className="ml-auto text-[13px] text-muted">{a.contacts.length} stakeholders</span>
        </div>
        <ul className="mt-3 divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle">
          {a.contacts.map((c) => (
            <li key={c.name} className="flex items-start gap-3 bg-surface px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-strong">{c.name}</p>
                <p className="text-[13px] text-muted">{c.role}</p>
                {c.changeNote && (
                  <p className="mt-0.5 flex items-start gap-1 text-[12px] text-muted">
                    <RotateCcw className="mt-0.5 h-3 w-3 shrink-0 text-warning" aria-hidden="true" /> {c.changeNote}
                  </p>
                )}
              </div>
              {c.stance && (
                <span className={cn("ml-auto shrink-0 rounded-md border px-2 py-0.5 text-[12px] font-medium", STANCE[c.stance].cls)}>{STANCE[c.stance].label}</span>
              )}
            </li>
          ))}
        </ul>
        {a.changesOverTime && a.changesOverTime.length > 0 && (
          <>
            <p className="eyebrow mt-4 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Changes over time</p>
            <ul className="mt-2 space-y-1.5">
              {a.changesOverTime.map((ch, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]">
                  {ch.kind === "added" ? <UserPlus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> : <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />}
                  <span className="text-text"><span className="text-muted">{ch.date}</span> <b className="font-medium text-strong">{ch.who}</b> — {ch.event}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* Contract history */}
      <Card label="" labelTone="">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-strong">Contract history</h3>
        </div>
        <div className="mt-3 space-y-3">
          {a.contractHistory.map((h) => (
            <div key={h.period} className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-strong">{h.period}</p>
                  <p className="text-[13px] text-muted">{h.products}{h.discountPct != null ? ` · ${h.discountPct}% discount` : ""}</p>
                  <p className="mt-0.5 text-[13px] italic text-muted">Outcome: {h.outcome}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-strong">{money(h.value)}/yr</span>
              </div>
            </div>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailCell label="Customer since">{a.tenureYears > 0 ? `${a.contractStart.slice(-4)} · ${a.tenureYears} yr` : a.contractStart}</DetailCell>
            <DetailCell label="Next renewal">{a.contractEnd}</DetailCell>
          </div>
        </div>
      </Card>

      {/* NPS & satisfaction */}
      <Card label="" labelTone="">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-strong">NPS &amp; satisfaction</h3>
          <span className={cn("rounded-md border px-2 py-0.5 text-[12px] font-medium", a.npsScore < 30 ? "border-danger/40 text-danger" : a.npsScore < 50 ? "border-warning/40 text-warning" : "border-success/40 text-success")}>{a.satisfactionLabel}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums text-strong">{a.npsScore}</span>
          {a.npsTrend != null && (
            <span className={cn("text-[13px] font-medium", a.npsTrend < 0 ? "text-danger" : "text-success")}>{a.npsTrend < 0 ? "↘" : "↗"} {a.npsTrend > 0 ? "+" : ""}{a.npsTrend} pts</span>
          )}
          <span className="eyebrow ml-1">Current NPS</span>
        </div>
        {a.npsTags && a.npsTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {a.npsTags.map((t) => <span key={t} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] text-text">{t}</span>)}
          </div>
        )}
        {a.npsPositive && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-success/30 bg-success-bg/40 px-3 py-2 text-[13px] text-strong"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{a.npsPositive}</p>
        )}
        {a.npsNegative && (
          <p className="mt-2 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-bg/40 px-3 py-2 text-[13px] text-strong"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />{a.npsNegative}</p>
        )}
      </Card>

      {/* Additional details */}
      <Card label="" labelTone="">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-strong">Additional details</h3>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {a.accountOwner && <DetailCell label="Account owner">{a.accountOwner}</DetailCell>}
          <DetailCell label="Renewal stage">{a.renewalStage}</DetailCell>
          <DetailCell label="Current contract value">{money(a.value)}/yr</DetailCell>
          {a.forecastRenewalValue != null && <DetailCell label="Forecast renewal value">{money(a.forecastRenewalValue)}/yr</DetailCell>}
          <DetailCell label="Expansion potential">{a.expansionPotential.why}</DetailCell>
          <DetailCell label="Churn risk"><span className="font-semibold text-danger">High · {a.churnRisk.score}/100</span></DetailCell>
          {a.lastEngagement && <DetailCell label="Last engagement">{a.lastEngagement}</DetailCell>}
          {a.nextEngagement && <DetailCell label="Next engagement">{a.nextEngagement}</DetailCell>}
        </div>
        {a.openIssues.length > 0 && (
          <>
            <p className="eyebrow mt-4">Open issues</p>
            <ul className="mt-1 space-y-1">
              {a.openIssues.map((o) => <li key={o} className="flex items-start gap-2 text-[13px] text-text"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />{o}</li>)}
            </ul>
          </>
        )}
        {a.pendingActions && a.pendingActions.length > 0 && (
          <>
            <p className="eyebrow mt-3">Pending actions</p>
            <ul className="mt-1 space-y-1">
              {a.pendingActions.map((p) => <li key={p} className="flex items-start gap-2 text-[13px] text-text"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{p}</li>)}
            </ul>
          </>
        )}
      </Card>

    </div>
  );
}

function Bar({ label, pct }: { label: string; pct: number }) {
  const band = pct >= 70 ? { label: "Critical", cls: "border-danger/40 text-danger" } : pct >= 40 ? { label: "Elevated", cls: "border-warning/40 text-warning" } : { label: "Low", cls: "border-border text-muted" };
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <span className={cn("rounded-md border px-1.5 text-[11px] font-medium", band.cls)}>{band.label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-strong">{pct}%</p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

const SEV_TEXT = { High: "text-danger", Medium: "text-warning", Low: "text-muted" } as const;

function RiskInsightsTab({ account: a }: { account: RenewalAccount }) {
  const f = accountFacts(a);
  const money = moneyFor(a);
  const ins = a.insights;
  return (
    <div className="space-y-5">
      {/* Risk & approval drivers */}
      <div>
        <p className="eyebrow text-primary">Why this account</p>
        <div className="mt-1.5 rounded-lg border border-primary-border bg-primary-subtle/30 p-3">
          <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-0.5 text-[12px] font-medium text-strong"><Zap className="h-3.5 w-3.5 text-warning" /> {a.competitiveThreat ? "Competitor risk identified" : a.billingDiscrepancy ? "Billing issue to resolve" : "Renewal risk"}</span>
          <p className="text-[13px] text-text">{a.recommendedMove.whyText}</p>
        </div>
        {a.competitiveThreat && (
          <div className="mt-2 flex items-start justify-between gap-3 rounded-lg border border-warning/40 bg-warning-bg/40 p-3">
            <div className="min-w-0">
              <p className="eyebrow text-warning">Competitor in play — evidence</p>
              <p className="mt-0.5 text-sm font-medium text-strong">{a.competitiveThreat.summary}</p>
              <a href={a.competitiveThreat.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[12px] font-medium text-primary hover:underline">{a.competitiveThreat.sourceLabel} ↗</a>
            </div>
            {ins?.competitor && <span className="shrink-0 text-sm font-semibold text-warning">{money(ins.competitor.theirPrice)}/conn</span>}
          </div>
        )}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <DetailCell label="Risk score"><span className="text-warning">{f.riskScore}/100</span></DetailCell>
          <DetailCell label="Discount"><span className="text-warning">{f.discountPct}%</span></DetailCell>
          <DetailCell label="Margin"><span className="text-warning">{f.marginAtDiscount}%</span></DetailCell>
        </div>
      </div>

      {/* Risk drivers (glass-box) */}
      <div>
        <p className="eyebrow">Risk drivers</p>
        <div className="mt-1.5 space-y-1">
          <ExplainableScoreRow score={a.churnRisk} />
          {a.riskScores.map((s) => <ExplainableScoreRow key={s.label} score={s} />)}
        </div>
      </div>

      {/* Billing discrepancies */}
      {ins?.billing && (
        <Evidence label="Billing discrepancies" tone="text-primary">
          <p className="text-[13px] text-muted">Checked before simulation — these billing-vs-contract issues fold into the risk score and the recommended offer, so fixing them changes the numbers downstream.</p>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <DetailCell label="Exposure / yr"><span className="text-danger">{money(ins.billing.exposureYr)}</span></DetailCell>
            <DetailCell label="High severity"><span className="text-danger">{ins.billing.highSeverity}</span></DetailCell>
            <DetailCell label="Renewal effect"><span className="text-danger">{ins.billing.renewalEffectPts} pts</span></DetailCell>
          </div>
          <ul className="mt-2 divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle">
            {ins.billing.issues.map((b) => (
              <li key={b.title} className="flex items-center justify-between gap-3 bg-surface px-3 py-2.5">
                <div className="min-w-0"><p className="text-sm font-medium text-strong">{b.title}</p><p className="text-[12px] text-muted">{b.scope}</p></div>
                <div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums text-danger">{money(b.monthly)}/mo</p><p className={cn("text-[12px]", SEV_TEXT[b.severity])}>{b.severity}</p></div>
              </li>
            ))}
          </ul>
        </Evidence>
      )}

      {/* Competitive analysis */}
      {ins?.competitor && (
        <Evidence label="Competitive analysis" tone="text-primary">
          <p className="text-[13px] text-text">{ins.competitor.name} launched {ins.competitor.product} ({ins.competitor.source}) at {money(ins.competitor.theirPrice)}/connection.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Bar label="Risk of switching" pct={ins.competitor.switchingRiskPct} />
            <Bar label="Account vulnerability" pct={ins.competitor.vulnerabilityPct} />
          </div>
          <p className="eyebrow mt-3">Pricing comparison</p>
          <div className="mt-1 overflow-hidden rounded-lg border border-border-subtle">
            <div className="grid grid-cols-3 gap-2 bg-surface-muted/60 px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted"><span>Metric</span><span className="text-right">Us</span><span className="text-right">Them</span></div>
            <div className="grid grid-cols-3 items-center gap-2 px-3 py-2 text-[13px]">
              <span className="text-muted">Price / connection / mo<br /><span className="text-[12px] text-danger">{money(ins.competitor.ourPrice - ins.competitor.theirPrice)} pricier — a live switch lever</span></span>
              <span className="text-right font-medium text-strong">{money(ins.competitor.ourPrice)}</span>
              <span className="text-right font-medium text-danger">{money(ins.competitor.theirPrice)}</span>
            </div>
          </div>
        </Evidence>
      )}

      {/* Usage analytics */}
      {ins?.usage && (
        <Evidence label="Usage analytics" tone="text-primary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailCell label="Behaviour health">{ins.usage.healthScore}/100</DetailCell>
            <DetailCell label="Overage / mo">{money(ins.usage.overageMonthly)}</DetailCell>
            <DetailCell label="Plan fit">{ins.usage.planFit}/100</DetailCell>
            <DetailCell label="YoY volume"><span className={ins.usage.yoyVolumePct < 0 ? "text-danger" : "text-success"}>{ins.usage.yoyVolumePct}%</span></DetailCell>
          </div>
          <p className="eyebrow mt-3">Product mix</p>
          <ul className="mt-1 space-y-1">{a.usage.mix.map((m) => <li key={m.label} className="flex justify-between text-[13px]"><span className="text-muted">{m.label}</span><span className="tabular-nums text-strong">{m.pct}%</span></li>)}</ul>
          {a.usage.adoptionGaps.length > 0 && (
            <>
              <p className="eyebrow mt-2">Adoption gaps</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[13px] text-muted">{a.usage.adoptionGaps.map((g) => <li key={g}>{g}</li>)}</ul>
            </>
          )}
        </Evidence>
      )}

      {/* Customer sentiment */}
      {ins?.sentiment && (
        <Evidence label="Customer sentiment" tone="text-danger">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-danger/40 px-2 py-0.5 text-[12px] font-medium text-danger">{a.satisfactionLabel}</span>
            <span className="text-[13px] text-muted">NPS {a.npsScore}{a.npsTrend != null ? ` (▼ ${Math.abs(a.npsTrend)})` : ""} · CSAT {ins.sentiment.csatPct}%</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailCell label="Tickets">{ins.sentiment.tickets}</DetailCell>
            <DetailCell label="Complaints"><span className="text-danger">{ins.sentiment.complaints}</span></DetailCell>
            <DetailCell label="Service issues"><span className="text-warning">{ins.sentiment.serviceIssues}</span></DetailCell>
            <DetailCell label="Escalations"><span className="text-danger">{ins.sentiment.escalations}</span></DetailCell>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3"><p className="text-sm font-medium text-strong">Calls</p><p className="mt-0.5 text-[13px] text-muted">{ins.sentiment.callsNote}</p></div>
            <div className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3"><p className="text-sm font-medium text-strong">Email</p><p className="mt-0.5 text-[13px] text-muted">{ins.sentiment.emailNote}</p></div>
          </div>
          {a.openIssues.length > 0 && (
            <>
              <p className="eyebrow mt-3">Escalation history</p>
              <ul className="mt-1 space-y-1.5">{a.openIssues.map((o) => <li key={o} className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-[13px]"><span className="rounded-md border border-danger/40 px-1.5 py-0.5 text-[11px] font-medium text-danger">Open</span><span className="text-strong">{o}</span></li>)}</ul>
            </>
          )}
        </Evidence>
      )}
    </div>
  );
}

function PlanRulesTab({ account: a }: { account: RenewalAccount }) {
  const f = accountFacts(a);
  const money = moneyFor(a);
  const savedRules = useRenewalStore((s) => s.savedRules);
  const sources = a.insights?.dataSources ?? [
    { label: "Identity & contract", source: "CRM · contract system" },
    { label: "Risk & churn score", source: "Renewal model (glass-box)" },
    { label: "Usage & overage", source: "Usage telemetry" },
    { label: "NPS & sentiment", source: "Survey + support tickets" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow text-primary">Where this data comes from</p>
        <ul className="mt-1.5 divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle">
          {sources.map((d) => <li key={d.label} className="flex items-center justify-between gap-3 bg-surface px-3 py-2 text-[13px]"><span className="text-strong">{d.label}</span><span className="text-muted">{d.source}</span></li>)}
        </ul>
      </div>

      <div>
        <p className="eyebrow text-primary">Strategy &amp; rule the agent applied</p>
        <div className="mt-1.5 rounded-lg border border-border-subtle bg-surface-muted/40 p-3">
          <p className="text-sm font-semibold text-strong">{strategyOf(a)}</p>
          <p className="mt-1 text-[13px] text-muted">{a.recommendedMove.whyText}</p>
        </div>
        <div className="mt-2 rounded-lg border border-primary-border bg-primary-subtle/40 p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-strong"><Sparkles className="h-3.5 w-3.5 text-primary" /> Rule {a.recommendedMove.ruleId}</p>
          <p className="mt-1 text-[13px] text-muted">{a.recommendedMove.ruleText}</p>
        </div>
        {savedRules.length > 0 && (
          <>
            <p className="eyebrow mt-3 text-success">Your scoped rules</p>
            <ul className="mt-1.5 space-y-1.5">{savedRules.map((r) => <li key={r.id} className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-[13px] text-text">{r.text}</li>)}</ul>
          </>
        )}
      </div>

      <div>
        <p className="eyebrow text-warning">Guardrails it follows</p>
        <ul className="mt-1.5 space-y-1.5 text-[13px]">
          <li className="flex justify-between rounded-lg border border-border-subtle bg-surface px-3 py-2"><span className="text-strong">Self-approval</span><span className="text-muted">≤ {a.offer.capPct}% discount</span></li>
          <li className="flex justify-between rounded-lg border border-border-subtle bg-surface px-3 py-2"><span className="text-strong">Deal Desk</span><span className="text-muted">{a.offer.capPct + 1}–{a.offer.capPct + 6}%</span></li>
          <li className="flex justify-between rounded-lg border border-border-subtle bg-surface px-3 py-2"><span className="text-strong">VP Sales</span><span className="text-muted">&gt; {a.offer.capPct + 6}%</span></li>
        </ul>
        <p className="mt-2 text-[13px] text-muted">Current offer {f.discountPct}% → routes to <b className="text-strong">{f.guardrail.routesTo}</b>.</p>
      </div>

      <div>
        <p className="eyebrow text-info">Filters applied</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {[`Account · ${a.customer}`, `Segment · ${a.segment}`, `Posture · ${a.posture}`, `Window · renews in ${f.daysToExpiry} days`, `Value · ${money(a.value)}/yr`].map((x) => (
            <span key={x} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] text-text">{x}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Brief → Economics tab ─────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-strong">{value}</p>
      {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
    </div>
  );
}

const BAND = {
  Strong: { pill: "bg-success-bg text-success", bar: "bg-success" },
  Moderate: { pill: "bg-warning-bg text-warning", bar: "bg-warning" },
  Weak: { pill: "bg-danger-bg text-danger", bar: "bg-danger" },
} as const;

function EconomicsTab({ account: a }: { account: RenewalAccount }) {
  const money = moneyFor(a);
  const e = a.economics;

  if (!e) {
    const grossProfit = Math.round((a.blendedMargin / 100) * a.value);
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Annual revenue" value={money(a.value)} />
          <StatCard label="Blended margin" value={`${a.blendedMargin}%`} />
          <StatCard label="Gross profit" value={money(grossProfit)} />
        </div>
        <Card label="Cost stack (monthly)" labelTone="text-primary">
          <ul className="space-y-1">{a.costStack.map((c) => <li key={c.label} className="flex justify-between text-[13px]"><span className="text-muted">{c.label}</span><span className="tabular-nums text-strong">{money(c.monthly)}</span></li>)}</ul>
        </Card>
      </div>
    );
  }

  const maxRev = Math.max(...e.products.map((p) => p.rev));
  const maxSaving = Math.max(...e.saving.cycles.map((c) => c.amount));

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Connections" value={e.connections} sub={e.connectionMix} />
        <StatCard label="ARPU / month" value={money(e.arpu)} sub="avg revenue / connection" />
        <StatCard label="AMPU / month" value={money(e.ampu)} sub="avg margin / connection" />
      </div>

      <div className="rounded-xl border border-primary-border bg-primary-subtle/30 p-4">
        <p className="text-sm text-strong">{e.approvalNote}</p>
      </div>

      {/* 7.1 P&L history */}
      <div>
        <p className="eyebrow mb-2 text-primary">7.1 · P&amp;L history</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Annual revenue" value={money(e.annualRevenue)} sub={<span className={e.revenueYoYPct < 0 ? "text-danger" : "text-success"}>{e.revenueYoYPct}% YoY</span>} />
          <StatCard label="Annual cost" value={money(e.annualCost)} />
          <StatCard label="Gross profit" value={money(e.grossProfit)} sub={`${e.grossMarginPct}% margin`} />
        </div>
      </div>

      {/* 7.2 Cost vs net profitability */}
      <div>
        <p className="eyebrow mb-2 text-primary">7.2 · Cost vs net profitability</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Gross margin" value={`${e.grossMarginPct}%`} />
          <StatCard label="Subsidy drag" value={money(e.subsidyDrag)} sub={`${e.subsidyDragPts} pts`} />
          <StatCard label="Net margin" value={`${e.netMarginPct}%`} sub={money(e.netProfit)} />
        </div>
        <div className="mt-3 space-y-2.5">
          {e.products.map((p) => (
            <div key={p.name} className="rounded-xl border border-border-subtle bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium text-strong"><span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", p.color)} /> {p.name}</span>
                <span className="shrink-0 text-sm font-semibold text-strong">{p.marginPct}% margin</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 text-[13px] text-muted">
                <span>Rev {money(p.rev)}</span>
                <span>Cost {money(p.cost)}</span>
                <span className="ml-auto font-medium text-success">Profit {money(p.profit)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"><span className={cn("block h-full rounded-full", p.color)} style={{ width: `${(p.rev / maxRev) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* 7.3 Scoring justification */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow text-primary">7.3 · Scoring justification</p>
          <span className="text-[13px] text-muted">{e.scores.length} scores</span>
        </div>
        <div className="space-y-2.5">
          {e.scores.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-strong">{s.label}</span>
                <span className={cn("rounded-md px-2 py-0.5 text-[12px] font-medium", BAND[s.band].pill)}>{s.band} · {s.score}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"><span className={cn("block h-full rounded-full", BAND[s.band].bar)} style={{ width: `${s.score}%` }} /></div>
              <p className="mt-2 text-[13px] text-muted">{s.score}/100 — {s.summary}</p>
              <div className="mt-2 rounded-lg border-l-2 border-primary bg-primary-subtle/30 p-2.5">
                <p className="eyebrow text-primary">Why this score — {s.score}/100</p>
                <p className="mt-0.5 text-[13px] text-text">{s.why}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7.4 Saving history */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow text-primary">7.4 · Saving history</p>
          <span className="text-[13px] font-semibold text-success">{money(e.saving.total)} total</span>
        </div>
        <div className="space-y-2.5">
          {e.saving.cycles.map((c, i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm"><b className="text-strong">{c.year}</b> <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted">{c.type}</span></span>
                <span className="shrink-0 text-sm font-semibold text-success">{money(c.amount)}</span>
              </div>
              <p className="mt-1 text-[13px] text-muted">{c.note}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"><span className="block h-full rounded-full bg-success" style={{ width: `${(c.amount / maxSaving) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <ul className="mt-3 space-y-1">
          {e.saving.notes.map((n) => <li key={n} className="flex items-start gap-2 text-[13px] text-muted"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{n}</li>)}
        </ul>
      </div>
    </div>
  );
}

function BriefStage({ account: a }: { account: RenewalAccount }) {
  return (
    <StepFrame
      tabs={[
        { id: "summary", label: "Summary", content: <SummaryTab account={a} /> },
        { id: "risk", label: "Risk & insights", content: <RiskInsightsTab account={a} /> },
        { id: "economics", label: "Economics", content: <EconomicsTab account={a} /> },
        { id: "plan", label: "Plan & rules", content: <PlanRulesTab account={a} /> },
      ]}
    />
  );
}

// ── The Plan tab inside Recommendation — the renewal "contract" (demand-gen plan UX) ─
const STAGE_DESC: Record<number, string> = {
  1: "Land on the account — who, why now, contract, risk & sentiment.",
  2: "The recommended play, with economics & risk as evidence.",
  3: "Resolve billing, model the offer, assemble the chosen actions.",
  4: "Route for sign-off, track status, send when cleared.",
};

function PlanSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <p className="eyebrow">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function RenewalPlanTab({ account: a }: { account: RenewalAccount }) {
  const f = accountFacts(a);
  const money = moneyFor(a);
  const saveRule = useRenewalStore((s) => s.saveRule);
  const command = useRenewalStore((s) => s.command);
  const savedRules = useRenewalStore((s) => s.savedRules);
  const [rule, setRule] = useState("");
  const save = () => {
    const t = rule.trim();
    if (!t) return;
    saveRule(t);
    command(`Rule: ${t}`, "Saved — re-running the recommendation for this account.", "Plan");
    setRule("");
  };

  return (
    <div className="space-y-6">
      {/* Header + summary */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary"><Sparkles className="h-4 w-4" /></span>
          <h3 className="text-base font-semibold text-strong">Here&rsquo;s the plan</h3>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-[13px] font-semibold text-primary"><Gauge className="h-3.5 w-3.5" /> {f.discountPct}% · routes to {f.guardrail.routesTo}</span>
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-primary-subtle/50 px-3 py-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-[13px] text-strong"><span className="font-medium">Defending:</span> {strategyOf(a)} — {a.recommendedMove.label}</span>
        </div>
      </div>

      {/* Pipeline overview */}
      <PlanSection title={`The play · ${RENEWAL_STAGES.length} stages`}>
        <div className="space-y-2.5">
          {RENEWAL_STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-muted text-primary"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow">Stage {s.step}</p>
                    <p className="text-sm font-semibold text-strong">{s.name}</p>
                    <p className="text-[13px] text-text">{STAGE_DESC[s.step]}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PlanSection>

      {/* Strategy & guardrail */}
      <PlanSection title="Strategy & guardrail">
        <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-strong">{strategyOf(a)}</p>
          <p className="text-[13px] text-muted">{a.recommendedMove.whyText}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[13px]">
            <span className="rounded-full border border-border px-2.5 py-1 text-muted">Self-approval ≤ {a.offer.capPct}%</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted">Deal Desk ≤ {a.offer.capPct + 6}%</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted">VP &gt; {a.offer.capPct + 6}%</span>
          </div>
        </div>
      </PlanSection>

      {/* Recommendation assumptions */}
      <PlanSection title="Recommendation · segments & discount cap">
        <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-[13px]">
          <div className="flex justify-between"><span className="text-muted">Segmentation basis</span><span className="font-medium text-strong">{a.segment}</span></div>
          <div className="flex justify-between"><span className="text-muted">Discount cap</span><span className="font-medium text-strong">{a.offer.minPct}–{a.offer.maxPct}% · cap {a.offer.capPct}%</span></div>
          <div className="flex justify-between"><span className="text-muted">Default applied</span><span className="font-medium text-strong">{f.discountPct}%</span></div>
          <div className="flex justify-between"><span className="text-muted">Forecast renewal</span><span className="font-medium text-strong">{money(f.proposedSpendAnnual)}/yr</span></div>
        </div>
      </PlanSection>

      {/* Rules + scoped rule authoring */}
      <PlanSection title="Rules · scoped to your book" action={<WhyExpander whyText={a.recommendedMove.whyText} ruleId={a.recommendedMove.ruleId} ruleText={a.recommendedMove.ruleText} />}>
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className="rounded-lg border border-primary-border bg-primary-subtle/40 p-3">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-strong"><Sparkles className="h-3.5 w-3.5 text-primary" /> Rule {a.recommendedMove.ruleId}</p>
            <p className="mt-1 text-[13px] text-muted">{a.recommendedMove.ruleText}</p>
          </div>
          {savedRules.length > 0 && <ul className="space-y-1.5">{savedRules.map((r) => <li key={r.id} className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-[13px] text-text">{r.text}</li>)}</ul>}
          <div className="flex items-center gap-2">
            <input value={rule} onChange={(e) => setRule(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="Add a rule — e.g. if days to renewal > 60 and usage < 30MB, recommend flat" className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-strong outline-none transition-colors hover:border-primary-border focus:border-primary placeholder:text-muted" />
            <Button variant="outline" size="sm" onClick={save} disabled={!rule.trim()}>Save rule</Button>
          </div>
          <p className="text-[13px] text-muted">Saving re-runs the recommendation for this account.</p>
        </div>
      </PlanSection>
    </div>
  );
}

// ── Stage 2 · Recommendation (multi-step strategy) ────────────────────────────
function recDetail(a: RenewalAccount, f: AccountFacts, money: (n: number) => string): RenewalRecommendationDetail {
  if (a.recommendationDetail) return a.recommendationDetail;
  return {
    reason: a.recommendedMove.whyText,
    signals: [],
    context: `Renews in ${f.daysToExpiry} days · ${a.satisfactionLabel}.`,
    headline: a.recommendedMove.label,
    steps: [
      "Lead on value — anchor on service quality and the cost of switching, not price.",
      `Put a ${f.discountPct}% offer on the table — it holds a ${f.marginAtDiscount}% margin.`,
      f.guardrail.withinPolicy
        ? "This sits within your cap — you can send it directly."
        : `That ${f.discountPct}% needs ${f.guardrail.routesTo} sign-off — run the numbers below and submit for approval.`,
      "Follow up with an email that leads on value and names the renewal deadline.",
    ],
    signoffNote: `${f.discountPct}% lands a ${f.marginAtDiscount}% margin — about ${money(f.profitMonthly)}/mo profit; you're giving away ${money(f.customerSavingAnnual)}/yr.`,
    evidence: [
      { label: "Risk & margin", value: `${f.riskScore}/100 · ${f.marginAtDiscount}%`, note: `Routes to ${f.guardrail.routesTo}.` },
      { label: "Tenure & relationship", value: `${a.tenureYears} year${a.tenureYears === 1 ? "" : "s"}`, note: a.satisfactionLabel },
      { label: "Satisfaction", value: `NPS ${a.npsScore}`, note: a.npsNegative ?? a.satisfactionLabel },
      { label: "Renewal clock", value: `${f.daysToExpiry} days`, note: `Renews ${a.contractEnd}.` },
    ],
  };
}

function RecommendationStrategy({ account: a }: { account: RenewalAccount }) {
  const f = accountFacts(a);
  const money = moneyFor(a);
  const setStage = useRenewalStore((s) => s.setStage);
  const submitPlay = useRenewalStore((s) => s.submitPlay);
  const ins = a.insights;
  const rd = recDetail(a, f, money);
  const stratLabel = a.competitiveThreat ? "Aggressive Defend" : a.billingDiscrepancy ? "Fix Billing Leakage" : a.posture === "urgent" ? "High Risk Save" : "Margin Protect";
  const triggerLabel = a.competitiveThreat ? "Competitor risk identified" : a.billingDiscrepancy ? "Billing issue to resolve" : "Renewal due";
  const careful = !f.guardrail.withinPolicy;
  const send = () => { submitPlay(); setStage(4); };

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-strong"><Sparkles className="h-4 w-4 text-primary" /> Recommended strategy</h2>

      <div className="rounded-xl border border-primary-border bg-primary-subtle/30 p-4">
        <p className="eyebrow mb-1 flex items-center gap-1.5 text-primary"><Target className="h-3.5 w-3.5" /> Reason for action</p>
        <p className="text-sm font-medium text-strong">{rd.reason}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap gap-2 text-[13px] font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger-bg px-2.5 py-1 text-danger"><Target className="h-3.5 w-3.5" /> {stratLabel}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-strong"><Zap className="h-3.5 w-3.5 text-warning" /> {triggerLabel}</span>
          {rd.signals.map((s, i) => <span key={s} className={cn("rounded-full border px-2.5 py-1", i % 2 === 0 ? "border-info/40 bg-info-bg text-info" : "border-primary-border bg-primary-subtle text-primary")}>{s}</span>)}
        </div>
        <p className="mt-3 text-sm font-medium text-strong">{a.competitiveThreat ? "Competitor in play — defend the account on value, not just price." : a.recommendedMove.label}</p>
        <p className="mt-1 text-[13px] text-muted">{rd.context}</p>
      </div>

      {a.competitiveThreat && (
        <div className="rounded-xl border border-warning/40 bg-warning-bg/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-warning">Competitor in play — evidence</p>
              <p className="mt-0.5 text-sm font-medium text-strong">{a.competitiveThreat.summary}</p>
              <a href={a.competitiveThreat.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[12px] font-medium text-primary hover:underline">{a.competitiveThreat.sourceLabel} ↗</a>
            </div>
            {ins?.competitor && <span className="shrink-0 text-sm font-semibold text-warning">{money(ins.competitor.theirPrice)}/conn</span>}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-strong"><Sparkles className="h-4 w-4 text-primary" /> What to do</h3>
        <p className="mt-1 text-sm text-strong">{rd.headline}</p>
        <ol className="mt-3 space-y-2.5">
          {rd.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px] text-text">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-fg">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-warning/40 bg-warning-bg/40 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow flex items-center gap-1.5 text-warning"><Gauge className="h-3.5 w-3.5" /> Sign-off simulation</p>
          <span className={cn("rounded-md border px-2 py-0.5 text-[12px] font-medium", careful ? "border-warning/40 text-warning" : "border-success/40 text-success")}>{careful ? "Proceed with care" : "Within cap"}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DetailCell label="Discount">{f.discountPct}%</DetailCell>
          <DetailCell label="Margin">{f.marginAtDiscount}%</DetailCell>
          <DetailCell label="Saving">{money(f.customerSavingMonthly)}/mo</DetailCell>
          <DetailCell label="Routes to">{f.guardrail.routesTo}</DetailCell>
        </div>
        <p className="mt-3 text-[13px] text-text">{rd.signoffNote}</p>
        <button onClick={send} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover">
          <Send className="h-4 w-4" /> {f.guardrail.withinPolicy ? `Send ${f.discountPct}% to customer` : `Send ${f.discountPct}% for approval`}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setStage(3)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-strong transition-colors hover:bg-surface-muted"><SlidersHorizontal className="h-4 w-4" /> Open in simulator</button>
        <button onClick={() => setStage(3)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-strong transition-colors hover:bg-surface-muted"><Mail className="h-4 w-4" /> Draft email</button>
      </div>

      <div>
        <p className="eyebrow flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> What the evidence shows</p>
        <ul className="mt-2 divide-y divide-border-subtle overflow-hidden rounded-xl border border-border">
          {rd.evidence.map((e) => (
            <li key={e.label} className="flex items-start justify-between gap-4 bg-surface px-4 py-3">
              <div className="min-w-0"><p className="eyebrow">{e.label}</p><p className="mt-0.5 text-[13px] text-muted">{e.note}</p></div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-strong">{e.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RecommendationStage({ account: a }: { account: RenewalAccount }) {
  return (
    <StepFrame
      tabs={[
        { id: "rec", label: "Recommendation", content: <RecommendationStrategy account={a} /> },
        { id: "plan", label: "Plan", content: <RenewalPlanTab account={a} /> },
      ]}
    />
  );
}

// ── Stage 3 · Campaign ────────────────────────────────────────────────────────
const CHANNEL_ICON: Record<RenewalTouch["channel"], LucideIcon> = {
  Call: PhoneCall, Email: Mail, LinkedIn: Link2, WhatsApp: MessageCircle,
};

function defaultCampaign(a: RenewalAccount): RenewalCampaign {
  return {
    rule: a.recommendedMove.label,
    ruleDesc: a.recommendedMove.whyText,
    lead: "Sequence leads with Email.",
    touches: [
      { day: 0, channel: "Email", title: "Renewal outreach", detail: `Open the renewal conversation before the ${a.daysToExpiry}-day deadline.` },
      { day: 3, channel: "Call", title: "Value call", detail: "Walk the contact through the recommendation and the offer." },
      { day: 7, channel: "LinkedIn", title: "Quick nudge", detail: "Share a one-pager and keep the renewal top of mind." },
    ],
  };
}

function CampaignStage({ account: a }: { account: RenewalAccount }) {
  const play = useRenewalStore((s) => s.play);
  const setBilling = useRenewalStore((s) => s.setBillingResolved);
  const setOfferPct = useRenewalStore((s) => s.setOfferPct);
  const snapToCap = useRenewalStore((s) => s.snapToCap);
  const money = moneyFor(a);
  const f = accountFacts(a);
  const c = a.campaign ?? defaultCampaign(a);

  return (
    <div className="space-y-4">
      {/* Billing gate */}
      {a.billingDiscrepancy && (
        <section className={cn("rounded-xl border p-4", play?.billingResolved ? "border-success/30 bg-success-bg/40" : "border-danger/40 bg-danger-bg/40")}>
          <p className="eyebrow text-danger">Billing gate</p>
          <p className="mt-1 text-sm text-strong">{a.billingDiscrepancy.summary}</p>
          <p className="mt-0.5 text-[13px] text-muted">{money(a.billingDiscrepancy.amount)} disputed · −{a.billingDiscrepancy.marginImpactPts} margin pts while open.</p>
          <div className="mt-2">
            {play?.billingResolved ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success"><CheckCircle2 className="h-4 w-4" /> Resolved — you can launch</span>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setBilling(true)}>Resolve discrepancy</Button>
            )}
          </div>
        </section>
      )}

      <p className="text-base font-medium text-muted">{c.touches.length}-touch sequence tuned to a {a.posture} renewal.</p>

      {/* Campaign rule */}
      <div className="rounded-xl border border-primary-border bg-primary-subtle/30 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Wand2 className="h-4 w-4" /> Campaign rule: {c.rule}</p>
        <p className="mt-1 text-[13px] text-muted">{c.ruleDesc}</p>
        <p className="mt-1 text-[13px] font-medium text-primary">{c.lead}</p>
      </div>

      {/* Touch sequence */}
      <div className="space-y-3">
        {c.touches.map((t, i) => {
          const Icon = CHANNEL_ICON[t.channel];
          return (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary"><Icon className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1 border-l border-border-subtle pl-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[12px] font-semibold text-strong">Day {t.day}</span>
                  <span className="text-[13px] text-muted">{t.channel}</span>
                </div>
                <p className="mt-1.5 text-base font-semibold text-strong">{t.title}</p>
                <p className="mt-0.5 text-[13px] text-muted">{t.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Offer & margin simulator (reached from "Open in simulator") */}
      <Evidence label="Offer & margin simulator" tone="text-primary">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums text-strong">{f.discountPct}%</span>
          <span className="text-[13px] text-muted">discount · margin {f.marginAtDiscount}%</span>
          <button onClick={() => snapToCap(a.id)} className="ml-auto text-[13px] font-medium text-primary hover:underline">Snap to cap ({f.capPct}%)</button>
        </div>
        <input type="range" min={a.offer.minPct} max={a.offer.maxPct} value={f.discountPct} onChange={(e) => setOfferPct(a.id, Number(e.target.value))} aria-label="Discount" className="mt-3 w-full accent-[var(--primary)]" />
        <div className="mt-1 flex justify-between text-[11px] text-muted"><span>{a.offer.minPct}%</span><span>cap {f.capPct}%</span><span>{a.offer.maxPct}%</span></div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Vital label="Current" value={`${money(f.currentSpendMonthly)}/mo`} />
          <Vital label="Proposed" value={`${money(f.proposedSpendMonthly)}/mo`} />
          <Vital label="Saving" value={`${money(f.customerSavingMonthly)}/mo`} />
          <Vital label="Routes to" value={f.guardrail.routesTo} tone={f.guardrail.withinPolicy ? "default" : "warning"} />
        </div>
      </Evidence>
    </div>
  );
}

// ── Stage 5 · Approval ────────────────────────────────────────────────────────
function ApprovalStage({ account: a }: { account: RenewalAccount }) {
  const f = accountFacts(a);
  const money = moneyFor(a);
  const play = useRenewalStore((s) => s.play);
  if (!play) return null;
  const within = f.guardrail.withinPolicy;
  return (
    <div className="space-y-4">
      <Card label="Approval routing" labelTone="text-primary">
        <p className="text-sm text-strong">{within ? "Within guardrail — sends directly, no approval needed." : `Above guardrail — routes to ${f.guardrail.routesTo}.`}</p>
        <p className="mt-1 text-[13px] text-muted">Discount {f.discountPct}% vs {f.capPct}% cap · margin {f.marginAtDiscount}%.</p>
      </Card>
      <Card label="Play packet" labelTone="text-info">
        <ul className="space-y-1.5 text-[13px] text-text">
          <li><b className="text-strong">Actions:</b> {play.chosenActions.join(" · ")}</li>
          <li><b className="text-strong">Offer:</b> {f.discountPct}% → {money(f.proposedSpendAnnual)}/yr ({money(f.customerSavingAnnual)} saving)</li>
          <li><b className="text-strong">Rationale:</b> {a.recommendedMove.whyText}</li>
          {a.competitiveThreat && <li><b className="text-strong">Evidence:</b> {a.competitiveThreat.sourceLabel}</li>}
        </ul>
      </Card>
      <Card label="Status" labelTone="text-success">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium", STATE_TONE[play.state])}>{STATE_LABEL[play.state]}</span>
        <p className="mt-1.5 text-[13px] text-muted">Use the button below to {within ? "send to the customer" : "route the packet for sign-off"}.</p>
      </Card>
    </div>
  );
}
