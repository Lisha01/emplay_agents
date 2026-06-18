// The renewal "play" pipeline — the ordered stages a renewal manager walks for one
// account (PRD §6.2). Mirrors the demand-gen AGENTS shape so the shared StagePipeline
// rail can render it. Ten old tabs collapse onto these five stages (PRD §6.4).

import {
  FileText,
  GitBranch,
  Megaphone,
  CheckCircle2,
  type LucideIcon,
} from "@/components/ui/icons";

export type RenewalStage = 1 | 2 | 3 | 4;

export interface RenewalStageMeta {
  step: RenewalStage;
  name: string;
  short: string;
  icon: LucideIcon;
  /** The one advance CTA shown in the co-pilot bar for this stage. */
  cta: string;
  /** Co-pilot bar placeholder for this stage. */
  prompt: string;
}

export const RENEWAL_STAGES: RenewalStageMeta[] = [
  { step: 1, name: "Brief", short: "Brief", icon: FileText, cta: "See the recommendation", prompt: "Ask about this account…" },
  { step: 2, name: "Recommendation", short: "Recommend", icon: GitBranch, cta: "Build campaign", prompt: "Ask why, sharpen the recommendation, or adjust the plan…" },
  { step: 3, name: "Campaign", short: "Campaign", icon: Megaphone, cta: "Launch campaign", prompt: "Tweak a touch or the cadence…" },
  { step: 4, name: "Approval", short: "Approval", icon: CheckCircle2, cta: "Submit to Deal Desk", prompt: "Add a note for the approver…" },
];

export const stageMeta = (step: number): RenewalStageMeta => RENEWAL_STAGES.find((s) => s.step === step) ?? RENEWAL_STAGES[0];
