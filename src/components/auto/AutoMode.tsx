"use client";

import { useStore } from "@/lib/store";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { ClarifyThread } from "./ClarifyThread";
import { PlanCard } from "./PlanCard";
import { RunView } from "./RunView";

/**
 * Auto ("Autonomous") mode orchestrator. Drives the plan-first flow:
 * Clarify → Plan → Run → Needs-your-attention, switching on `autoPhase`.
 */
export function AutoMode() {
  const phase = useStore((s) => s.autoPhase);

  switch (phase) {
    case "clarify":
      return <ClarifyThread />;
    case "plan":
      return <PlanCard />;
    case "run":
    case "attention":
      return <RunView />;
    default:
      return (
        <WorkbookShell
          canvas={
            <div className="mx-auto max-w-2xl p-6">
              <p className="text-sm text-muted">Starting…</p>
            </div>
          }
        />
      );
  }
}
