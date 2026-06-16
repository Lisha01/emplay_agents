"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Cpu,
  Crosshair,
  ExternalLink,
  Gauge,
  Globe,
  Link2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import type { Lead } from "@/lib/types";
import type { ListCtx } from "@/components/workbench/types";
import { Workbench } from "@/components/workbench/Workbench";
import { Badge, routingTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { cn } from "@/lib/utils";

const AXES = [
  { key: "icpFit", label: "ICP Fit", icon: Crosshair },
  { key: "firmographics", label: "Firmographics", icon: Users },
  { key: "intent", label: "Intent", icon: Target },
  { key: "engagement", label: "Engagement", icon: Sparkles },
  { key: "recency", label: "Recency", icon: Gauge },
] as const;

const PLAN_LABELS = { brief: "Objective", filters: "Scoring weights", steps: "How the agent scores" };

const PLAN_STEPS = [
  "Pull firmographics, tech stack & hiring intel via Prospeo",
  "Score the five axes and compute a weighted total",
  "Route by score — PRIORITY ≥ 75 · ENGAGE 50–74 · NURTURE < 50",
  "Flag owned accounts for expansion",
];

const SCORING_WEIGHTS = [
  { label: "ICP Fit", value: "Weight 40%" },
  { label: "Firmographics", value: "Weight 25%" },
  { label: "Intent", value: "Weight 20%" },
  { label: "Engagement", value: "Weight 10%" },
  { label: "Recency", value: "Weight 5%" },
];

const LIST_SUGGESTIONS = [
  "Weight intent higher",
  "Raise PRIORITY threshold",
  "Drop NURTURE under 35",
  "Only PRIORITY + ENGAGE",
  "Sort by intent",
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

function Row({ icon: Icon, label, value, link }: { icon: typeof Globe; label: string; value: string; link?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-28 shrink-0 items-center gap-1.5 text-muted"><Icon className="h-3.5 w-3.5" /> {label}</span>
      <span className={cn("truncate", link ? "inline-flex items-center gap-1 text-info" : "text-strong")}>
        {value}
        {link && <ExternalLink className="h-3 w-3" />}
      </span>
    </div>
  );
}

function Collapsible({ icon: Icon, label, meta, badge, open, onToggle, children }: { icon: typeof Globe; label: string; meta: string; badge?: boolean; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <button onClick={onToggle} className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-muted">
        <Icon className="h-4 w-4 text-muted" />
        <span className="text-sm font-semibold text-strong">{label}</span>
        <span className="text-sm text-muted">— {meta}</span>
        {badge && <Badge tone="ai" className="ml-1"><Sparkles className="h-3 w-3" /> Claude</Badge>}
        <ChevronDown className={cn("ml-auto h-4 w-4 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-border-subtle px-4 py-3">{children}</div>}
    </div>
  );
}

function LeadDetail({ lead }: { lead: Lead }) {
  const account = useStore((s) => s.accounts.find((a) => a.id === lead.accountId));
  const rescore = useStore((s) => s.addToast);
  const toggleQueue = useStore((s) => s.toggleQueue);
  const removeLead = useStore((s) => s.removeLead);
  const [techOpen, setTechOpen] = useState(false);
  const [hiringOpen, setHiringOpen] = useState(false);

  const fg = account?.firmographics;

  return (
    <div className="border-t border-border-subtle bg-surface-muted/40 px-5 py-4">
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">Scorecard · 5 axes</p>
          <div className="rounded-xl border border-border-subtle bg-surface p-3">
            {AXES.map((a) => (
              <ScoreBar key={a.key} label={a.label} value={lead.scorecard[a.key]} icon={a.icon} />
            ))}
          </div>
          {lead.routingNote && (
            <div className="mt-3 rounded-lg bg-primary-subtle/60 px-3 py-2 text-[13px] text-text">
              <span className="font-medium text-strong">Routing:</span> {lead.routingNote}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="eyebrow mb-2">Contact</p>
            <div className="space-y-1.5 rounded-xl border border-border-subtle bg-surface p-3 text-[13px]">
              <p className="flex items-center gap-2 text-text"><Mail className="h-3.5 w-3.5 text-muted" /> {lead.contact.email}</p>
              <p className="flex items-center gap-2 text-text"><Phone className="h-3.5 w-3.5 text-muted" /> {lead.contact.phone}</p>
              <p className="flex items-center gap-2 text-info"><Link2 className="h-3.5 w-3.5" /> {lead.contact.linkedin} <ExternalLink className="h-3 w-3" /></p>
              <p className="flex items-center gap-2 text-text"><MapPin className="h-3.5 w-3.5 text-muted" /> {lead.location}</p>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-2">Lineage</p>
            <div className="space-y-1.5 rounded-xl border border-border-subtle bg-surface p-3 text-[13px]">
              <p className="flex items-start gap-2 text-text"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" /> Lead Research · &ldquo;{lead.lineage.originBrief}&rdquo;</p>
              <p className="flex items-center gap-2 text-text"><Sparkles className="h-3.5 w-3.5 text-primary" /> {lead.lineage.qualified}</p>
              <p className="flex items-center gap-2 text-text"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> {lead.lineage.enrichment}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle bg-surface">
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
          <Building2 className="h-4 w-4 text-muted" />
          <span className="text-sm font-semibold text-strong">Firmographics</span>
          <span className="text-sm text-muted">— {fg?.industry ?? lead.industry}</span>
        </div>
        <div className="grid gap-x-8 gap-y-2 px-4 py-3 text-[13px] sm:grid-cols-2">
          <Row icon={Globe} label="Industry" value={fg?.industry ?? lead.industry} />
          <Row icon={Users} label="Employees" value={fg?.employees ?? `${lead.headcount} (201–500)`} />
          <Row icon={CircleDollarSign} label="Revenue" value={fg?.revenue ?? "—"} />
          <Row icon={CalendarDays} label="Founded" value={fg?.founded?.toString() ?? "—"} />
          <Row icon={MapPin} label="HQ" value={fg?.hq ?? lead.location} />
          <Row icon={CircleDollarSign} label="Funding" value={fg?.funding ?? "—"} />
          <Row icon={Globe} label="Website" value={fg?.website ?? "—"} link />
          <Row icon={Link2} label="LinkedIn" value="Page" link />
        </div>
        {fg?.description && (
          <p className="border-t border-border-subtle px-4 py-3 text-[13px] leading-relaxed text-text">{fg.description}</p>
        )}
      </div>

      <Collapsible icon={Cpu} label="Tech stack" meta={`${account?.techStackCount ?? 0} detected`} open={techOpen} onToggle={() => setTechOpen((v) => !v)}>
        <div className="flex flex-wrap gap-1.5">
          {["AWS", "Snowflake", "Salesforce", "React", "Kubernetes", "Datadog", "Segment", "Okta"].map((t) => (
            <span key={t} className="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-text">{t}</span>
          ))}
        </div>
      </Collapsible>
      <Collapsible icon={Briefcase} label="Hiring intel" meta={`${account?.hiringIntelCount ?? 0} open`} badge open={hiringOpen} onToggle={() => setHiringOpen((v) => !v)}>
        <ul className="space-y-1.5 text-[13px] text-text">
          <li className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-muted" /> Senior Platform Engineer — posted 4d ago</li>
          <li className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-muted" /> Product Manager, Payments — posted 9d ago</li>
          <li className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-muted" /> Data Platform Lead — posted 12d ago</li>
        </ul>
      </Collapsible>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => rescore("Re-scoring lead…")}>
          <RotateCcw className="h-3.5 w-3.5" /> Re-score
        </Button>
        <Button size="sm" variant={lead.queued ? "subtle" : "secondary"} onClick={() => toggleQueue(lead.id)}>
          <CheckCircle2 className="h-3.5 w-3.5" /> {lead.queued ? "Queued" : "Queue"}
        </Button>
        <Button size="sm" variant="danger" className="ml-auto" onClick={() => removeLead(lead.id)}>
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </Button>
      </div>
    </div>
  );
}

/** The qualification list — collapsed scorecards that expand in place. */
function QualificationList({ items, selection, toggle }: ListCtx) {
  const expandedId = useStore((s) => s.expandedLeadId);
  const toggleExpand = useStore((s) => s.toggleExpand);

  return (
    <div className="space-y-2">
      {items.map((l) => {
        const expanded = expandedId === l.id;
        const checked = selection.includes(l.id);
        return (
          <div key={l.id} className={cn("overflow-hidden rounded-xl border bg-surface", expanded ? "border-primary-border" : "border-border")}>
            <div className="flex items-center gap-3 px-4 py-3">
              <input type="checkbox" checked={checked} onChange={() => toggle(l.id)} className="accent-[var(--primary)]" aria-label={`Select ${l.name}`} />
              <button onClick={() => toggleExpand(l.id)} className="flex flex-1 items-center gap-3 text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">{initials(l.name)}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-semibold text-strong">
                    {l.name}
                    <CheckCircle2 className="h-3.5 w-3.5 text-info" />
                  </span>
                  <span className="text-xs text-muted">{l.title}</span>
                </span>
                <span className="ml-4 hidden items-center gap-1.5 text-sm text-text sm:flex">
                  <Building2 className="h-3.5 w-3.5 text-muted" /> {l.company}
                </span>
                <span className="ml-auto flex items-center gap-3">
                  <span className="hidden items-center gap-1 text-sm text-muted md:flex"><MapPin className="h-3.5 w-3.5" /> New York, NY</span>
                  <span className="text-lg font-semibold tabular-nums text-strong">{l.score}</span>
                  <Badge tone={routingTone(l.routingBadge)} uppercase>{l.routingBadge}</Badge>
                  <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", expanded && "rotate-180")} />
                </span>
              </button>
            </div>
            {expanded && <LeadDetail lead={l} />}
          </div>
        );
      })}
    </div>
  );
}

export function Qualification({ sheets, planExtra }: { sheets?: React.ReactNode; planExtra?: React.ReactNode }) {
  const leads = useStore((s) => s.leads);
  const qualifiedLeadIds = useStore((s) => s.qualifiedLeadIds);
  const qualSelection = useStore((s) => s.qualSelection);
  const toggleQualSelect = useStore((s) => s.toggleQualSelect);
  const setQualSelection = useStore((s) => s.setQualSelection);
  const pushToRecommendation = useStore((s) => s.pushToRecommendation);

  const initialIds = qualifiedLeadIds.length ? qualifiedLeadIds : leads.map((l) => l.id);

  return (
    <Workbench
      scope="Lead Qualification"
      listLabel="List of leads"
      planLabel="Scoring plan"
      planLabels={PLAN_LABELS}
      allItems={leads}
      initialItemIds={initialIds}
      initialPlan={{ brief: "Score each lead against the ICP and route by fit.", filters: SCORING_WEIGHTS.map((f) => ({ ...f })), steps: [...PLAN_STEPS] }}
      listSuggestions={LIST_SUGGESTIONS}
      footerPlaceholder="Drop edits to re-score or refine — e.g. 'weight intent higher, drop NURTURE under 35'"
      primaryLabel="Recommend"
      selection={qualSelection}
      toggleSelect={toggleQualSelect}
      setSelection={setQualSelection}
      onPrimary={pushToRecommendation}
      sheets={sheets}
      planExtra={planExtra}
      renderList={(ctx) => <QualificationList {...ctx} />}
    />
  );
}
