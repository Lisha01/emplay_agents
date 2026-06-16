"use client";

import { Check } from "@/components/ui/icons";
import { AGENTS } from "@/lib/agents";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * The spine of the Workbook: the pipeline grows one step at a time. Only steps the rep
 * has reached are shown — the active step is highlighted, completed steps keep a check,
 * and any shown step is clickable to go back (spec §3.3, §7).
 */
export function PlanRail() {
  const currentStep = useStore((s) => s.currentStep);
  const maxStepReached = useStore((s) => s.maxStepReached);
  const setStep = useStore((s) => s.setStep);

  const steps = AGENTS.filter((a) => a.step <= maxStepReached);

  return (
    <div className="flex flex-col gap-1 p-3">
      <p className="eyebrow px-2 pb-2 pt-1">Sheets · {steps.length}/{AGENTS.length}</p>
      {steps.map((a) => {
        const active = a.step === currentStep;
        const done = a.step < maxStepReached;
        const Icon = a.icon;
        return (
          <button
            key={a.step}
            onClick={() => setStep(a.step)}
            aria-current={active ? "step" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
              active ? "bg-primary-subtle" : "hover:bg-surface-muted",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                active
                  ? "bg-primary text-primary-fg"
                  : done
                    ? "bg-success-bg text-success"
                    : "bg-surface-muted text-muted",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : a.step}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  active ? "text-primary" : "text-strong",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                {a.name}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
