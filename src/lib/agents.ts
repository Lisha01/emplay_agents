import { Search, ListChecks, GitBranch, Megaphone, Activity, type LucideIcon } from "@/components/ui/icons";
import type { AgentStep } from "./types";

export interface AgentMeta {
  step: AgentStep;
  name: string;
  short: string;
  icon: LucideIcon;
}

/** The five agents as ordered plan-rail steps (spec §3.2). */
export const AGENTS: AgentMeta[] = [
  { step: 1, name: "Lead Research", short: "Research", icon: Search },
  { step: 2, name: "Lead Qualification", short: "Qualify", icon: ListChecks },
  { step: 3, name: "Recommendation", short: "Recommend", icon: GitBranch },
  { step: 4, name: "Campaign Build", short: "Campaign", icon: Megaphone },
  { step: 5, name: "Campaign Monitor", short: "Monitor", icon: Activity },
];
