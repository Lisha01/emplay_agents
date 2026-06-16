import type { Lead } from "@/lib/types";

export interface EditRequest {
  id: string;
  target: string;
  note: string;
}

export interface PlanState {
  brief: string;
  filters: { label: string; value: string }[];
  steps: string[];
}

export interface Version {
  id: string;
  n: number;
  changelog: string[];
  itemIds: string[];
  plan: PlanState;
}

export interface Editor {
  target: string;
  rect: DOMRect;
}

export interface PlanLabels {
  brief: string;
  filters: string;
  steps: string;
}

/** Context handed to a screen's list renderer (Research table / Qualification cards). */
export interface ListCtx {
  items: Lead[];
  selection: string[];
  toggle: (id: string) => void;
  setSelection: (ids: string[]) => void;
  onAsk: (target: string, rect: DOMRect) => void;
  countFor: (target: string) => number;
  generating: boolean;
}
