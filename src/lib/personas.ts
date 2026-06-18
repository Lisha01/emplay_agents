// Workspace personas. The app ships two: Demand Generation (built) and Renewal
// Manager (coming next). Chosen at onboarding, switchable from the icon rail.
// Central metadata so onboarding, the switcher, and the landing stay in sync.

import { Target, RefreshCw, type LucideIcon } from "@/components/ui/icons";
import type { Persona } from "./types";

export interface PersonaMeta {
  id: Persona;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** Whether the workspace is built yet. Renewal is a "coming soon" stub for now. */
  available: boolean;
  /** The headline capabilities, shown on the onboarding cards and the landing. */
  features: string[];
}

export const PERSONAS: PersonaMeta[] = [
  {
    id: "demandgen",
    name: "Demand Gen",
    tagline: "Find, qualify & convert new pipeline",
    description:
      "Run the full top-of-funnel motion — research accounts, qualify leads, bundle segments, and launch multi-channel campaigns the agent monitors for you.",
    icon: Target,
    available: true,
    features: [
      "Lead research & enrichment",
      "5-axis lead qualification",
      "Segment & next-best recommendations",
      "Multi-channel campaign build",
      "Live campaign monitoring",
    ],
  },
  {
    id: "renewal",
    name: "Renewal",
    tagline: "Protect & grow the book you own",
    description:
      "Stay ahead of every renewal — track the renewal timeline, catch churn-risk and health signals early, and run save and expansion plays before the window closes.",
    icon: RefreshCw,
    available: true,
    features: [
      "Renewal pipeline & timeline",
      "Churn-risk & health signals",
      "Save-play recommendations",
      "Expansion & upsell plays",
      "Renewal forecast & coverage",
    ],
  },
];

export const personaMeta = (id: Persona): PersonaMeta =>
  PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
