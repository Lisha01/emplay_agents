"use client";

import { useStore } from "@/lib/store";
import { AutoMode } from "@/components/auto/AutoMode";
import { LeadResearch } from "@/components/agents/LeadResearch";
import { Qualification } from "@/components/agents/Qualification";
import { Recommendation } from "@/components/agents/Recommendation";
import { CampaignBuild } from "@/components/agents/CampaignBuild";
import { Monitor } from "@/components/agents/Monitor";

/** The Workbook: the five agents render as steps within one route (spec §10). */
export default function WorkbookPage() {
  const step = useStore((s) => s.currentStep);
  const autoRunActive = useStore((s) => s.autoRunActive);

  if (autoRunActive) return <AutoMode />;

  switch (step) {
    case 1:
      return <LeadResearch />;
    case 2:
      return <Qualification />;
    case 3:
      return <Recommendation />;
    case 4:
      return <CampaignBuild />;
    case 5:
      return <Monitor />;
    default:
      return <LeadResearch />;
  }
}
