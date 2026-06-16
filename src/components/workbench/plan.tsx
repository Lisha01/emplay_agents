"use client";

import { Check, Database, Upload } from "@/components/ui/icons";
import { AskEdit } from "./editing";
import type { PlanLabels, PlanState } from "./types";

const SOURCES = [
  { id: "hubspot", label: "HubSpot", icon: Database },
  { id: "salesforce", label: "Salesforce", icon: Database },
  { id: "upload", label: "Upload sheet", icon: Upload },
];

/** Editable plan: objective + criteria + steps + connected sources. Generic over PlanState. */
export function PlanTab({
  plan,
  labels,
  onAsk,
  countFor,
}: {
  plan: PlanState;
  labels: PlanLabels;
  onAsk: (target: string, rect: DOMRect) => void;
  countFor: (target: string) => number;
}) {
  return (
    <div className="max-w-2xl space-y-5">
      <section className="group rounded-xl border border-border bg-surface p-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="eyebrow">{labels.brief}</p>
          <AskEdit count={countFor("Brief")} onPick={(rect) => onAsk("Brief", rect)} />
        </div>
        <p className="text-[13px] text-text">{plan.brief}</p>
      </section>

      <section>
        <p className="eyebrow mb-2">{labels.filters}</p>
        <div className="space-y-1.5">
          {plan.filters.map((f) => (
            <div key={f.label} className="group flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-[13px]">
              <span className="w-28 shrink-0 text-muted">{f.label}</span>
              <span className="flex-1 font-medium text-strong">{f.value}</span>
              <AskEdit count={countFor(`Filter: ${f.label}`)} onPick={(rect) => onAsk(`Filter: ${f.label}`, rect)} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow mb-2">{labels.steps}</p>
        <ol className="space-y-1.5">
          {plan.steps.map((step, i) => (
            <li key={`${step}-${i}`} className="group flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="flex-1 text-[13px] text-text">{step}</span>
              <AskEdit count={countFor(`Step ${i + 1}`)} onPick={(rect) => onAsk(`Step ${i + 1}`, rect)} />
            </li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow mb-2">Sources · all connected</p>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-bg/50 px-2.5 py-1 text-xs font-medium text-success">
              <s.icon className="h-3 w-3" /> {s.label} <Check className="h-3 w-3" />
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
