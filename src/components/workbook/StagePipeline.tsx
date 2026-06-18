"use client";

import { Check, type LucideIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface PipelineStep {
  step: number;
  name: string;
  icon: LucideIcon;
}

/**
 * Generic staged-pipeline rail (shared by Demand-Gen and Renewal). Presentational only:
 * the host passes the steps + current/max state + an onStep handler. Steps beyond
 * `maxReached` are hidden; the active step is highlighted; completed steps keep a check.
 */
export function StagePipeline({
  steps,
  current,
  maxReached,
  onStep,
  label,
}: {
  steps: PipelineStep[];
  current: number;
  maxReached: number;
  onStep: (step: number) => void;
  label?: string;
}) {
  const shown = steps.filter((s) => s.step <= maxReached);
  return (
    <div className="flex flex-col gap-1 p-3">
      {label && <p className="eyebrow px-2 pb-2 pt-1">{label}</p>}
      {shown.map((s) => {
        const active = s.step === current;
        const done = s.step < maxReached;
        const Icon = s.icon;
        return (
          <button
            key={s.step}
            onClick={() => onStep(s.step)}
            aria-current={active ? "step" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
              active ? "bg-primary-subtle" : "hover:bg-surface-muted",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                active ? "bg-primary text-primary-fg" : done ? "bg-success-bg text-success" : "bg-surface-muted text-muted",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : s.step}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("flex items-center gap-1.5 text-sm font-medium", active ? "text-primary" : "text-strong")}>
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                {s.name}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
