"use client";

import { Eye } from "@/components/ui/icons";
import type { Lead } from "@/lib/types";
import { Badge, routingTone } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { PlanLabels, PlanState, Version } from "./types";

export const COLUMNS = ["Name", "Title", "Company", "Location", "Industry", "Headcount", "Signal"];

/** The data cells for one lead row, shared by the Research table and the diff views. */
export function LeadCells({ lead, tone }: { lead: Lead; tone?: "removed" | "added" }) {
  const text = tone === "removed" ? "text-danger line-through" : tone === "added" ? "text-success" : "";
  return (
    <>
      <td className={cn("px-3 py-3 font-medium", tone ? text : "text-strong")}>{lead.name}</td>
      <td className={cn("px-3 py-3", tone ? text : "text-text")}>{lead.title}</td>
      <td className={cn("px-3 py-3", tone ? text : "text-text")}>{lead.company}</td>
      <td className={cn("px-3 py-3", tone ? text : "text-muted")}>New York, NY</td>
      <td className={cn("px-3 py-3", tone ? text : "text-muted")}>{lead.industry}</td>
      <td className={cn("px-3 py-3 tabular-nums", tone ? text : "text-muted")}>{lead.headcount}</td>
      <td className="px-3 py-3">
        <Badge tone={routingTone(lead.routingBadge)} uppercase>{lead.routingBadge}</Badge>
      </td>
    </>
  );
}

export function DiffBanner({ prev, curr }: { prev: Version; curr: Version }) {
  const removed = prev.itemIds.filter((id) => !curr.itemIds.includes(id)).length;
  const added = curr.itemIds.filter((id) => !prev.itemIds.includes(id)).length;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary-border bg-primary-subtle/50 px-3 py-2 text-[13px]">
      <Eye className="h-4 w-4 text-primary" />
      <span className="font-medium text-strong">Viewing edits · v{prev.n} → v{curr.n}</span>
      <span className="text-muted">
        {removed > 0 && <span className="text-danger">−{removed}</span>}
        {removed > 0 && added > 0 && " · "}
        {added > 0 && <span className="text-success">+{added}</span>}
        {removed === 0 && added === 0 && "Plan updated; list unchanged"}
      </span>
    </div>
  );
}

export function LeadsDiff({ prev, curr, allItems }: { prev: Version; curr: Version; allItems: Lead[] }) {
  const byId = (id: string) => allItems.find((l) => l.id === id);
  const added = curr.itemIds.filter((id) => !prev.itemIds.includes(id));
  const rows = [
    ...prev.itemIds.map((id) => ({ id, tone: curr.itemIds.includes(id) ? undefined : ("removed" as const) })),
    ...added.map((id) => ({ id, tone: "added" as const })),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left">
            <th className="w-8 px-4 py-2.5" />
            {COLUMNS.map((h) => (
              <th key={h} className="px-3 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, tone }) => {
            const lead = byId(id);
            if (!lead) return null;
            return (
              <tr key={id} className={cn("border-b border-border-subtle last:border-0", tone === "removed" && "bg-danger-bg/30", tone === "added" && "bg-success-bg/30")}>
                <td className="px-4 py-3 text-center font-semibold">
                  {tone === "removed" ? <span className="text-danger">−</span> : tone === "added" ? <span className="text-success">+</span> : null}
                </td>
                <LeadCells lead={lead} tone={tone} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PlanDiff({ prev, curr, labels }: { prev: PlanState; curr: PlanState; labels: PlanLabels }) {
  const removedSteps = prev.steps.filter((s) => !curr.steps.includes(s));
  return (
    <div className="max-w-2xl space-y-5">
      <section className="rounded-xl border border-border bg-surface p-4">
        <p className="eyebrow mb-1">{labels.brief}</p>
        {prev.brief === curr.brief ? (
          <p className="text-[13px] text-text">{curr.brief}</p>
        ) : (
          <p className="text-[13px]">
            <span className="text-danger line-through">{prev.brief}</span> <span className="text-success">{curr.brief}</span>
          </p>
        )}
      </section>

      <section>
        <p className="eyebrow mb-2">{labels.filters}</p>
        <div className="space-y-1.5">
          {curr.filters.map((f) => {
            const old = prev.filters.find((pf) => pf.label === f.label);
            const changed = old && old.value !== f.value;
            return (
              <div key={f.label} className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-[13px]">
                <span className="w-28 shrink-0 text-muted">{f.label}</span>
                {changed ? (
                  <span className="flex-1">
                    <span className="text-danger line-through">{old!.value}</span> <span className="text-success">{f.value}</span>
                  </span>
                ) : (
                  <span className="flex-1 font-medium text-strong">{f.value}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <p className="eyebrow mb-2">{labels.steps}</p>
        <ol className="space-y-1.5">
          {curr.steps.map((step, i) => {
            const isNew = !prev.steps.includes(step);
            return (
              <li key={`${step}-${i}`} className={cn("flex items-center gap-3 rounded-lg border border-border-subtle px-3 py-2", isNew ? "bg-success-bg/30" : "bg-surface")}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">{i + 1}</span>
                <span className={cn("flex-1 text-[13px]", isNew ? "text-success" : "text-text")}>{step}</span>
              </li>
            );
          })}
          {removedSteps.map((step) => (
            <li key={step} className="flex items-center gap-3 rounded-lg border border-border-subtle bg-danger-bg/30 px-3 py-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center font-semibold text-danger">−</span>
              <span className="flex-1 text-[13px] text-danger line-through">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
