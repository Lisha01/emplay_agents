"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Crosshair,
  FileText,
  ListChecks,
  Megaphone,
  PhoneCall,
  Plus,
  Sparkles,
  Tag,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from "@/components/ui/icons";
import { useStore, actionLabel } from "@/lib/store";
import { accountRevenue, marginPct, usdCompact } from "@/lib/autoMode";
import type { Account, ActionType, Rule, Segment } from "@/lib/types";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { MarginSimulator } from "@/components/agents/MarginSimulator";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

// ── action metadata ───────────────────────────────────────────────────────────
const ACTION_ICON: Record<ActionType, LucideIcon> = {
  call: PhoneCall,
  campaign_ab: Megaphone,
  discount_bundle: CircleDollarSign,
  assign_partner: Users,
  new_opportunity: Target,
};
const ACTION_ORDER: ActionType[] = ["call", "campaign_ab", "discount_bundle", "assign_partner", "new_opportunity"];
const PLAY_SUB: Record<ActionType, string> = {
  call: "1:1 call task",
  campaign_ab: "Micro-segment A/B",
  discount_bundle: "Discount + bundle",
  assign_partner: "Partner co-sell",
  new_opportunity: "Cross-sell opp",
};
const PLAY_BLOCK_LABEL: Record<ActionType, string> = {
  call: "Call plan — schedule the tasks",
  campaign_ab: "A/B test — suggest variants",
  discount_bundle: "Discount, blend & margin",
  assign_partner: "Partner handoff",
  new_opportunity: "New opportunity",
};

/** The action currently in effect for a segment (rep override, else the next-best). */
export function resolvedAction(seg: Segment, overrides: Record<string, ActionType>): ActionType {
  return overrides[seg.id] ?? seg.nextBest.action;
}

// ── Recommendation stage ──────────────────────────────────────────────────────
export function Recommendation({
  sheets,
  approval,
}: {
  sheets?: React.ReactNode;
  /** In the autonomous run, the recommendation is a human checkpoint — when set, the
   *  footer's primary action calls onApprove and the run holds until then. */
  approval?: { onApprove: () => void };
}) {
  const segments = useStore((s) => s.segments);
  const activeSegmentId = useStore((s) => s.activeSegmentId);
  const setActiveSegment = useStore((s) => s.setActiveSegment);
  const overrides = useStore((s) => s.segmentActionOverride);
  const command = useStore((s) => s.command);
  const setSegmentAction = useStore((s) => s.setSegmentAction);
  const setSegmentDiscount = useStore((s) => s.setSegmentDiscount);
  const setStep = useStore((s) => s.setStep);
  const addToast = useStore((s) => s.addToast);
  const [edit, setEdit] = useState("");
  const [tab, setTab] = useState<"list" | "plan">("list");

  const active = segments.find((s) => s.id === activeSegmentId) ?? null;

  // ── footer: drop-edits box + Apply changes + Approve → Campaign ──────────────
  const applyEdit = () => {
    const text = edit.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const num = lower.match(/(\d{1,3})/);
    let ack = "Applied to the recommendation.";
    if (active && /(discount|cap)/.test(lower) && num) {
      setSegmentDiscount(active.id, Number(num[1]));
      ack = `Set discount to ${num[1]}% for ${active.name}.`;
    } else if (active && /\bcall\b/.test(lower)) {
      setSegmentAction(active.id, "call");
      ack = `Switched ${active.name} to a 1:1 call.`;
    } else if (active && /(a\/b|ab test|campaign)/.test(lower)) {
      setSegmentAction(active.id, "campaign_ab");
      ack = `Switched ${active.name} to an A/B campaign.`;
    } else if (active && /(partner|assign)/.test(lower)) {
      setSegmentAction(active.id, "assign_partner");
      ack = `Assigned ${active.name} to the partner.`;
    } else if (active && /opportunit/.test(lower)) {
      setSegmentAction(active.id, "new_opportunity");
      ack = `Created a cross-sell opportunity for ${active.name}.`;
    } else {
      command(text, "On it — refining the recommendation.", active?.name ?? "Recommendation");
      setEdit("");
      return;
    }
    command(text, ack, active?.name ?? "Recommendation");
    setEdit("");
  };

  const approve = () => {
    if (approval) {
      approval.onApprove();
    } else {
      setStep(4);
      addToast("Recommendation approved — building the campaign", "success");
    }
  };

  const footer = (
    <div className="flex items-center gap-3 border-t border-border bg-surface px-3 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 transition-colors hover:border-primary-border hover:bg-surface focus-within:border-primary focus-within:bg-surface">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <input
          value={edit}
          onChange={(e) => setEdit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyEdit()}
          placeholder="Drop edits — e.g. 'cap discount at 15%', 'switch to A/B campaign'"
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
      <Button variant="outline" className="shrink-0" onClick={applyEdit} disabled={!edit.trim()}>
        Apply changes
      </Button>
      <Button variant="primary" className="shrink-0" onClick={approve}>
        {approval ? "Approve & continue to Campaign" : "Approve → Campaign"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const canvas = (
    <div>
      {/* Tab bar — same structure as Lead Research / Qualification */}
      <div className="sticky top-0 z-10 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="flex items-center gap-1 px-4">
          <TabBtn active={tab === "list"} onClick={() => setTab("list")} icon={ListChecks}>
            List of segments
            <span className="ml-1.5 rounded-full bg-surface-muted px-1.5 text-[10px] tabular-nums text-muted">{segments.length}</span>
          </TabBtn>
          <TabBtn active={tab === "plan"} onClick={() => setTab("plan")} icon={FileText}>
            Plan &amp; rules
          </TabBtn>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {tab === "list" ? (
          <>
            <SegmentToggle segments={segments} activeId={activeSegmentId} onPick={setActiveSegment} />
            {active ? (
              <SegmentDetail segment={active} />
            ) : (
              <SegmentList segments={segments} onPick={setActiveSegment} overrides={overrides} />
            )}
          </>
        ) : (
          <PlanTab />
        )}
      </div>
    </div>
  );

  return <WorkbookShell sheets={sheets} canvas={canvas} footer={footer} />;
}

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn("relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors", active ? "text-primary" : "text-muted hover:text-strong")}
    >
      <Icon className="h-4 w-4" />
      {children}
      {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
    </button>
  );
}

/** Small muted section label so each zone announces its job. */
function ZoneLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-2">{children}</p>;
}

// ── Segment toggle (segmented control; "All" first, then each segment) ────────
function SegmentToggle({
  segments,
  activeId,
  onPick,
}: {
  segments: Segment[];
  activeId: string | null;
  onPick: (id: string) => void;
}) {
  const items = [{ id: "", label: "All" }, ...segments.map((s) => ({ id: s.id, label: s.name }))];
  return (
    <div className="flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
      {items.map((it) => {
        const active = (it.id === "" && !activeId) || activeId === it.id;
        return (
          <button
            key={it.id || "all"}
            onClick={() => onPick(it.id)}
            aria-pressed={active}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              active ? "bg-primary-subtle text-primary" : "text-muted hover:text-strong",
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// ── List · segment picker (full-width rows) ───────────────────────────────────
function SegmentList({
  segments,
  onPick,
  overrides,
}: {
  segments: Segment[];
  onPick: (id: string) => void;
  overrides: Record<string, ActionType>;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-[13px] text-muted">
        {segments.length} segments bundled from the qualified accounts — by industry + buyer title + prior campaign response.
      </p>
      {segments.map((seg) => {
        const action = resolvedAction(seg, overrides);
        const Icon = ACTION_ICON[action];
        return (
          <button
            key={seg.id}
            onClick={() => onPick(seg.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3.5 text-left transition-colors hover:border-primary-border hover:bg-primary-subtle/30"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-strong">{seg.name}</span>
              <span className="block truncate text-xs text-muted">{seg.basis}</span>
            </span>
            <span className="hidden shrink-0 text-right sm:block">
              <span className="block text-xs text-muted">Next best</span>
              <span className="block text-[13px] font-medium text-strong">{actionLabel(action)}</span>
            </span>
            <Badge tone="neutral" className="shrink-0">{seg.accountIds.length} accts</Badge>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </button>
        );
      })}
    </div>
  );
}

// ── List · segment detail (play selector → play block → accounts table) ───────
function SegmentDetail({ segment }: { segment: Segment }) {
  const overrides = useStore((s) => s.segmentActionOverride);
  const action = resolvedAction(segment, overrides);
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* Recommended play — selected + every other option on the same line */}
      <section>
        <ZoneLabel>Recommended play</ZoneLabel>
        <ActionTypeChips segment={segment} action={action} />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ContextChip icon={Tag} label="Offer" value={segment.nextBest.product} />
          <ContextChip
            icon={Users}
            label={segment.nextBest.partner ? "Partner" : "Channel"}
            value={segment.nextBest.partner ?? "Direct, in-house"}
          />
          <button onClick={() => setWhyOpen((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            Why
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", whyOpen && "rotate-180")} />
          </button>
        </div>
        {whyOpen && (
          <ul className="mt-2 space-y-1.5 rounded-lg border border-border-subtle bg-surface p-3">
            {segment.signals.map((sig, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-text">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {sig}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Play block — discount → blend & margin; A/B → variants; etc. */}
      <section>
        <ZoneLabel>{PLAY_BLOCK_LABEL[action]}</ZoneLabel>
        <ActionSetup segment={segment} action={action} />
      </section>

      {/* Accounts table (full width) */}
      <section>
        <ZoneLabel>Accounts · {segment.accountIds.length}</ZoneLabel>
        <AccountsTable segment={segment} action={action} />
      </section>

      <SaveRulePrompt segment={segment} action={action} />
    </div>
  );
}

function ContextChip({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted" />
      <span className="text-muted">{label} ·</span>
      <span className="font-medium text-strong">{value}</span>
    </span>
  );
}

// ── Accounts table — the per-account rows (reference layout) ───────────────────
const COLS = "grid-cols-[1.6fr_2fr_1.5fr_1.2fr_1.1fr]";

function dotClass(routingBadge: string): string {
  const b = routingBadge.toUpperCase();
  if (b.startsWith("PRIORITY")) return "bg-success";
  if (b.startsWith("ENGAGE")) return "bg-info";
  return "bg-warning";
}

function AccountsTable({ segment, action }: { segment: Segment; action: ActionType }) {
  const accounts = useStore((s) => s.accounts);
  const marginInputs = useStore((s) => s.marginInputs);
  const [openId, setOpenId] = useState<string | null>(null);

  const applied = action === "discount_bundle" ? segment.discount?.appliedPct ?? 0 : 0;
  const rows = segment.accountIds.map((id) => accounts.find((a) => a.id === id)).filter(Boolean) as Account[];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className={cn("grid gap-4 border-b border-border bg-surface-muted/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted", COLS)}>
        <span>Account</span>
        <span>What&rsquo;s happening</span>
        <span>Recommended play</span>
        <span>Segmentation</span>
        <span className="text-right">Impact</span>
      </div>

      {rows.map((a) => {
        const mi = marginInputs.find((m) => m.accountId === a.id);
        const rev = mi ? accountRevenue(mi.dealSize, applied) : null;
        const baseRev = mi ? accountRevenue(mi.dealSize, 0) : null;
        const margin = mi ? marginPct(mi.baseMarginPct, applied) : segment.baseMarginPct;
        const wh = a.research[0];
        const isOpen = openId === a.id;
        return (
          <div key={a.id} className="border-b border-border-subtle last:border-0">
            <button onClick={() => setOpenId(isOpen ? null : a.id)} className={cn("grid w-full items-start gap-4 px-4 py-3 text-left hover:bg-surface-muted/40", COLS)}>
              {/* Account */}
              <span className="flex min-w-0 items-start gap-2">
                <ChevronRight className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 text-muted transition-transform", isOpen && "rotate-90")} />
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotClass(a.routingBadge))} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-strong">{a.name}</span>
                  <span className="block truncate text-xs text-muted">{a.firmographics.industry}</span>
                </span>
              </span>
              {/* What's happening */}
              <span className="min-w-0">
                <span className="block text-[13px] text-strong">{wh?.title ?? "—"}</span>
                {wh?.body && <span className="line-clamp-2 block text-xs text-muted">{wh.body}</span>}
              </span>
              {/* Recommended play */}
              <span className="min-w-0">
                <Badge tone="recommended">{actionLabel(action)}</Badge>
                <span className="mt-1 block text-xs text-muted">{PLAY_SUB[action]}</span>
              </span>
              {/* Segmentation */}
              <span className="min-w-0">
                <span className="block text-[13px] text-strong">{segment.name}</span>
                <span className="line-clamp-2 block text-xs text-muted">{segment.basis}</span>
              </span>
              {/* Impact */}
              <span className="text-right">
                <span className="block text-[13px] font-semibold text-success">{rev != null ? `${usdCompact(rev)}/yr` : "—"}</span>
                <span className="block text-xs text-muted">{margin}% margin</span>
                {action === "discount_bundle" && rev != null && baseRev != null && baseRev !== rev && (
                  <span className="block text-[11px] text-primary">{usdCompact(baseRev)} → {usdCompact(rev)}</span>
                )}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-border-subtle bg-surface-muted/30 px-4 py-3 pl-10">
                <p className="eyebrow mb-1.5">Signals</p>
                <ul className="space-y-1 text-[13px] text-text">
                  {segment.signals.map((sig, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {sig}
                    </li>
                  ))}
                </ul>
                {action === "discount_bundle" && mi && rev != null && baseRev != null && (
                  <p className="mt-2 text-[13px] text-text">
                    At {applied}% discount: <span className="font-medium text-strong">{usdCompact(rev)}/yr</span> · {margin}% margin
                    {" "}(list {usdCompact(baseRev)} · {mi.baseMarginPct}%).
                  </p>
                )}
                {action === "campaign_ab" && (
                  <p className="mt-2 text-[13px] text-text">Suggested A/B for {a.name}: Variant A value-led · Variant B proof-led.</p>
                )}
                {action === "call" && <p className="mt-2 text-[13px] text-text">Suggested: book a 1:1 call with the buyer on {segment.nextBest.product}.</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── ActionSetup (switches by type; discount = the margin block) ───────────────
function ActionSetup({ segment, action }: { segment: Segment; action: ActionType }) {
  const addToast = useStore((s) => s.addToast);
  const accounts = useStore((s) => s.accounts);
  const segAccounts = accounts.filter((a) => segment.accountIds.includes(a.id));

  if (action === "call") {
    return (
      <SetupShell>
        <p className="text-[13px] text-text">
          Schedule a 1:1 call task for each account in <strong className="text-strong">{segment.name}</strong> — the channel this
          segment converts on best.
        </p>
        <Button size="sm" variant="primary" className="mt-3" onClick={() => addToast(`${segAccounts.length} call tasks created`, "success")}>
          <Check className="h-3.5 w-3.5" /> Create {segAccounts.length} call tasks
        </Button>
      </SetupShell>
    );
  }

  if (action === "campaign_ab") {
    const variants = segment.abVariants ?? 3;
    return (
      <SetupShell>
        <p className="text-[13px] text-text">
          Suggest A/B testing across <strong className="text-strong">{segAccounts.length}</strong> accounts — micro-segment into{" "}
          <strong className="text-strong">{variants}</strong> groups and run a variant of{" "}
          <strong className="text-strong">{segment.nextBest.product}</strong>.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(["A", "B"] as const).map((v) => (
            <div key={v} className="rounded-lg border border-border-subtle bg-surface-muted/40 p-2.5">
              <p className="eyebrow mb-1">Variant {v}</p>
              <p className="text-[13px] text-text">
                {v === "A" ? "Value-led — lead with the tier upgrade ROI." : "Proof-led — lead with a peer renewal win."}
              </p>
            </div>
          ))}
        </div>
        <Button size="sm" variant="primary" className="mt-3" onClick={() => addToast(`A/B campaign queued · ${variants} micro-segments`, "success")}>
          <Megaphone className="h-3.5 w-3.5" /> Build A/B campaign
        </Button>
      </SetupShell>
    );
  }

  if (action === "discount_bundle") {
    return <MarginSimulator segment={segment} />;
  }

  if (action === "assign_partner") {
    const partner = segment.nextBest.partner ?? "Regional VAR";
    return (
      <SetupShell>
        <p className="text-[13px] text-text">
          Hand <strong className="text-strong">{segment.name}</strong> to <strong className="text-strong">{partner}</strong> to co-sell{" "}
          <strong className="text-strong">{segment.nextBest.product}</strong>.
        </p>
        <Button size="sm" variant="primary" className="mt-3" onClick={() => addToast(`Handed off to ${partner}`, "success")}>
          <Users className="h-3.5 w-3.5" /> Confirm handoff to {partner}
        </Button>
      </SetupShell>
    );
  }

  // new_opportunity
  return (
    <SetupShell>
      <p className="text-[13px] text-text">
        Create a cross-sell opportunity for <strong className="text-strong">{segment.nextBest.product}</strong> across {segAccounts.length} accounts.
      </p>
      <Button size="sm" variant="primary" className="mt-3" onClick={() => addToast(`${segAccounts.length} opportunities created`, "success")}>
        <Plus className="h-3.5 w-3.5" /> Create {segAccounts.length} opportunities
      </Button>
    </SetupShell>
  );
}

function SetupShell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border-subtle bg-surface p-3.5">{children}</div>;
}

// ── ActionTypeChips — recommended selected + every other option inline ────────
function ActionTypeChips({ segment, action }: { segment: Segment; action: ActionType }) {
  const setSegmentAction = useStore((s) => s.setSegmentAction);
  return (
    <div className="flex flex-wrap gap-1.5">
      {ACTION_ORDER.map((t) => {
        const on = t === action;
        const Icon = ACTION_ICON[t];
        return (
          <button
            key={t}
            onClick={() => setSegmentAction(segment.id, t)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              on
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border bg-surface text-text hover:border-primary-border hover:text-primary",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {actionLabel(t)}
            {on && <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[9px] font-semibold uppercase text-primary-fg">Best</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── SaveRulePrompt ────────────────────────────────────────────────────────────
function SaveRulePrompt({ segment, action }: { segment: Segment; action: ActionType }) {
  const saveRule = useStore((s) => s.saveRule);
  const rules = useStore((s) => s.recommendationRules);
  const ruleText = `Default action for ${segment.name} (and similar accounts): ${actionLabel(action)}.`;
  const saved = rules.some((r) => r.rule === ruleText);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-primary-border bg-primary-subtle/30 p-3">
      <Sparkles className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-[13px] text-text">Apply this as a rule for similar accounts?</span>
      <Button
        size="sm"
        variant={saved ? "subtle" : "outline"}
        className="ml-auto"
        disabled={saved}
        onClick={() => saveRule({ scope: segment.name, rule: ruleText, source: "human" })}
      >
        {saved ? (
          <>
            <Check className="h-3.5 w-3.5" /> Saved as rule
          </>
        ) : (
          "Save as rule"
        )}
      </Button>
    </div>
  );
}

// ── Plan tab — glass-box rules, conversion analytics, suggested rule changes ───
function PlanTab() {
  const rules = useStore((s) => s.recommendationRules);
  const segments = useStore((s) => s.segments);
  const activeId = useStore((s) => s.activeSegmentId);
  return (
    <div className="space-y-6">
      <section>
        <ZoneLabel>Rules applied</ZoneLabel>
        <RulesList rules={rules} />
      </section>
      <section>
        <ZoneLabel>How segments convert</ZoneLabel>
        <Analytics segments={segments} activeId={activeId} />
      </section>
      <section>
        <ZoneLabel>Suggested rule changes</ZoneLabel>
        <Suggestions />
      </section>
    </div>
  );
}

/** Reusable list of glass-box rules (scope · rule · source). */
export function RulesList({ rules }: { rules: Rule[] }) {
  if (!rules.length) return <EmptyState icon={Crosshair} title="No rules yet" body="Save a recommendation as a rule to reuse it." />;
  return (
    <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface">
      {rules.map((r) => (
        <div key={r.id} className="flex items-start gap-3 p-3">
          <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-strong">{r.rule}</p>
            <p className="text-xs text-muted">{r.scope}</p>
          </div>
          <Badge tone={r.source === "analytics" ? "ai" : "neutral"} className="shrink-0">
            {r.source === "analytics" ? "Analytics" : "Human"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function Analytics({ segments, activeId }: { segments: Segment[]; activeId: string | null }) {
  return (
    <div className="space-y-2">
      {segments.map((seg) => {
        const on = seg.id === activeId;
        return (
          <div key={seg.id} className={cn("rounded-xl border bg-surface p-3", on ? "border-primary-border" : "border-border-subtle")}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[13px] font-semibold text-strong">{seg.name}</span>
              <Badge tone="neutral" className="ml-auto">{actionLabel(seg.nextBest.action)}</Badge>
            </div>
            <Bar label="Reply rate" pct={seg.analytics.replyPct} />
            <Bar label="Meeting rate" pct={seg.analytics.meetingPct} />
          </div>
        );
      })}
    </div>
  );
}

function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-24 shrink-0 text-xs text-muted">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, pct * 2)}%` }} />
      </span>
      <span className="w-9 shrink-0 text-right text-[13px] font-semibold tabular-nums text-strong">{pct}%</span>
    </div>
  );
}

function Suggestions() {
  const suggestions = useStore((s) => s.ruleSuggestions);
  const apply = useStore((s) => s.applyRuleSuggestion);
  if (!suggestions.length)
    return <EmptyState icon={Sparkles} title="No suggestions right now" body="The agent will propose rule changes as it learns from results." />;
  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <div key={s.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5">
          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-strong">{s.rule}</p>
            <p className="text-xs text-muted">{s.scope}</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => apply(s.id)}>
            Apply <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
