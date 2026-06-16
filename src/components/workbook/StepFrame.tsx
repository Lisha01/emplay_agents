"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FrameTab {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

/**
 * Reusable glass-box agent frame — four tabs (Output · Rules · Analytics ·
 * Recommendations). Every step can expose its output, the rules it used, how it
 * converts, and suggested rule changes. Built generic so other steps adopt it later.
 */
export function StepFrame({
  tabs,
  defaultTab,
  right,
}: {
  tabs: FrameTab[];
  defaultTab?: string;
  right?: React.ReactNode;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center border-b border-border px-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            aria-current={active === t.id ? "true" : undefined}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-3 text-[13px] font-medium transition-colors",
              active === t.id ? "text-primary" : "text-muted hover:text-strong",
            )}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className="rounded-full bg-surface-muted px-1.5 text-[10px] tabular-nums text-muted">{t.count}</span>
            )}
            {active === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
        {right && <span className="ml-auto pr-1">{right}</span>}
      </div>
      <div className="p-4">{current?.content}</div>
    </div>
  );
}
