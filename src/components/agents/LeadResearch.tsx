"use client";

import { useStore } from "@/lib/store";
import { briefFilters } from "@/lib/mockData";
import type { ListCtx } from "@/components/workbench/types";
import { Workbench } from "@/components/workbench/Workbench";
import { AskEdit } from "@/components/workbench/editing";
import { COLUMNS, LeadCells } from "@/components/workbench/diff";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const PLAN_STEPS = [
  "Interpret the brief into structured filters",
  "Query connected sources (HubSpot, Salesforce, Upload)",
  "De-duplicate and enrich contacts via Prospeo",
  "Auto-qualify and score against the ICP",
];

const LIST_SUGGESTIONS = [
  "Add Telecom companies",
  "Drop NURTURE under 35",
  "Sort by intent",
  "Prioritize renewals",
  "Widen headcount to 1000",
];

const PLAN_LABELS = { brief: "Interpreted brief", filters: "Filters", steps: "How the agent builds it" };

/** The Research results table — passed to Workbench as the list renderer. */
function ResultsTable({ items, selection, allSelected, toggle, setSelection, onAsk, countFor, generating }: ListCtx & { allSelected: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left">
            <th className="w-10 px-4 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelection(allSelected ? [] : items.map((l) => l.id))}
                className="accent-[var(--primary)]"
                aria-label="Select all"
              />
            </th>
            {COLUMNS.map((h) => (
              <th key={h} className="group px-3 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
                <span className="flex items-center gap-1">
                  {h}
                  <AskEdit count={countFor(`Column: ${h}`)} onPick={(rect) => onAsk(`Column: ${h}`, rect)} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {generating
            ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={COLUMNS.length + 1} className="p-0">
                    <SkeletonRow />
                  </td>
                </tr>
              ))
            : items.map((l) => {
                const checked = selection.includes(l.id);
                return (
                  <tr
                    key={l.id}
                    onClick={() => toggle(l.id)}
                    className={cn("cursor-pointer border-b border-border-subtle last:border-0 transition-colors", checked ? "bg-primary-subtle/40" : "hover:bg-surface-muted")}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(l.id)}
                        className="accent-[var(--primary)]"
                        aria-label={`Select ${l.name}`}
                      />
                    </td>
                    <LeadCells lead={l} />
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

export function LeadResearch({ sheets, planExtra }: { sheets?: React.ReactNode; planExtra?: React.ReactNode }) {
  const leads = useStore((s) => s.leads);
  const selection = useStore((s) => s.researchSelection);
  const toggle = useStore((s) => s.toggleResearchSelect);
  const setSelection = useStore((s) => s.setResearchSelection);
  const generating = useStore((s) => s.generating);
  const brief = useStore((s) => s.brief);
  const planFirst = useStore((s) => s.planFirst);
  const pushToQualification = useStore((s) => s.pushToQualification);

  return (
    <Workbench
      scope="Lead Research"
      listLabel="List of leads"
      planLabel="Plan for this list"
      planLabels={PLAN_LABELS}
      allItems={leads}
      initialItemIds={leads.map((l) => l.id)}
      initialPlan={{ brief, filters: briefFilters.map((f) => ({ ...f })), steps: [...PLAN_STEPS] }}
      listSuggestions={LIST_SUGGESTIONS}
      footerPlaceholder="Drop edits to revise the plan or list — e.g. 'add Telecom, drop NURTURE under 35, sort by intent'"
      primaryLabel="Qualify"
      selection={selection}
      toggleSelect={toggle}
      setSelection={setSelection}
      onPrimary={pushToQualification}
      generating={generating}
      initialTab={planFirst ? "plan" : "list"}
      sheets={sheets}
      planExtra={planExtra}
      renderList={(ctx) => (
        <ResultsTable {...ctx} allSelected={ctx.selection.length === ctx.items.length && ctx.items.length > 0} />
      )}
    />
  );
}
