"use client";

import { Check } from "@/components/ui/icons";
import type { ChoiceOption } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A single/multi-select group of tappable choice chips (no free text). */
export function ChoiceChips({
  options,
  selected,
  onSelect,
  locked,
}: {
  options: ChoiceOption[];
  selected: string[];
  onSelect: (id: string) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            disabled={locked}
            aria-pressed={on}
            onClick={() => onSelect(o.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
              on
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border bg-surface text-text hover:border-primary-border hover:text-primary",
              locked && "cursor-default",
              locked && !on && "opacity-40",
            )}
          >
            {on && <Check className="h-3.5 w-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
