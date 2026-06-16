"use client";

import { RotateCcw, Save } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { LeftPanel } from "./LeftPanel";
import { CommandBar } from "./CommandBar";

const SCENARIOS: Record<string, string> = {
  renewal: "Renewal",
  expansion: "Account expansion",
  acquisition: "Lead acquisition",
};

/**
 * Persistent three-part shell: header · PlanRail · Canvas · ContextPanel · CommandBar
 * (spec §3.2). The shell stays put while work moves through it.
 */
export function WorkbookShell({
  canvas,
  aside,
  commandPlaceholder,
  commandScope,
  onCommand,
  footer,
  sheets,
}: {
  canvas: React.ReactNode;
  aside?: React.ReactNode;
  commandPlaceholder?: string;
  commandScope?: string;
  onCommand?: (value: string) => void;
  /** Replaces the default CommandBar at the bottom (e.g. the Research notes + actions bar). */
  footer?: React.ReactNode;
  /** Replaces the PlanRail under the Sheets tab (e.g. the autonomous-run rail). */
  sheets?: React.ReactNode;
}) {
  const scenario = useStore((s) => s.scenario);
  const resetDemo = useStore((s) => s.resetDemo);
  const addToast = useStore((s) => s.addToast);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <h1 className="text-sm font-semibold text-strong">Unified Demand-Gen Workspace</h1>
        <span className="text-border">·</span>
        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-text">
          {SCENARIOS[scenario]}
        </span>

        <button
          onClick={() => resetDemo()}
          title="Reset demo"
          className="ml-auto flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted hover:bg-surface-muted hover:text-strong"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset demo
        </button>
        <button
          onClick={() => addToast("Workspace saved", "success")}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-strong hover:bg-surface-muted"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </header>

      {/* Body: PlanRail · (Canvas + ContextPanel) over CommandBar */}
      <div className="flex min-h-0 flex-1">
        <LeftPanel sheets={sheets} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <section className="min-w-0 flex-1 overflow-y-auto">{canvas}</section>
            {aside && (
              <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-surface lg:block">
                {aside}
              </aside>
            )}
          </div>
          {footer ?? (
            <CommandBar placeholder={commandPlaceholder ?? ""} scope={commandScope} onSubmit={onCommand} />
          )}
        </div>
      </div>
    </div>
  );
}
