"use client";

import type { Mode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: { id: Mode; label: string; stub?: boolean }[] = [
  { id: "autonomous", label: "Auto" },
  { id: "assist", label: "Assist" },
];

/**
 * The operating modes (spec §2.3): Assist (manual, step-by-step) and Autonomous
 * (plan-first, hands-off).
 */
export function ModeToggle({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Operating mode"
      className="inline-flex items-center rounded-lg bg-surface-muted p-0.5"
    >
      {MODES.map((m) => {
        const active = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={m.stub}
            onClick={() => !m.stub && onChange(m.id)}
            title={m.stub ? "Stubbed in this prototype" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              active ? "bg-surface text-strong shadow-sm" : "text-muted hover:text-strong",
              m.stub && "cursor-not-allowed opacity-50 hover:text-muted",
            )}
          >
            {m.label}
            {m.stub && (
              <span className="rounded-full bg-surface px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-muted">
                soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
