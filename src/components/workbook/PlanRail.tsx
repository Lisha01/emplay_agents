"use client";

import { AGENTS } from "@/lib/agents";
import type { AgentStep } from "@/lib/types";
import { useStore } from "@/lib/store";
import { StagePipeline } from "./StagePipeline";

/**
 * The spine of the Workbook: the pipeline grows one step at a time. Thin demand-gen
 * binding over the shared {@link StagePipeline} — reads the demand-gen store and feeds
 * the five agents in as steps (spec §3.3, §7).
 */
export function PlanRail() {
  const currentStep = useStore((s) => s.currentStep);
  const maxStepReached = useStore((s) => s.maxStepReached);
  const setStep = useStore((s) => s.setStep);

  const shown = AGENTS.filter((a) => a.step <= maxStepReached).length;

  return (
    <StagePipeline
      steps={AGENTS}
      current={currentStep}
      maxReached={maxStepReached}
      onStep={(s) => setStep(s as AgentStep)}
      label={`Sheets · ${shown}/${AGENTS.length}`}
    />
  );
}
