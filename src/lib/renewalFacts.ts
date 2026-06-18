// Single source of truth (PRD §6.5). Every repeated account fact is computed ONCE here
// and rendered by every stage — no stage recomputes. The only mutable input is the
// canonical discount lever `offer.appliedPct`; pass an override to preview a value.
// This makes the prototype's 8%-vs-10% drift impossible by construction.

import type { RenewalAccount, RenewalPosture, CompetitiveThreat, BillingDiscrepancy } from "./renewalTypes";

export type GuardrailBand = "self" | "dealdesk" | "vp";

export interface AccountFacts {
  // risk / clock
  riskScore: number;
  posture: RenewalPosture;
  daysToExpiry: number;
  renewalDate: string;
  nps: number;
  // the one canonical discount + its economics
  discountPct: number;
  capPct: number;
  baseMarginPct: number;
  marginAtDiscount: number;
  currentSpendAnnual: number;
  currentSpendMonthly: number;
  proposedSpendAnnual: number;
  proposedSpendMonthly: number;
  customerSavingAnnual: number;
  customerSavingMonthly: number;
  profitMonthly: number;
  /** Advisory floor — below this margin the deal "bleeds" (PRD FR-4.2, advisory only). */
  worstCaseDiscountPct: number;
  guardrail: { band: GuardrailBand; routesTo: string; withinPolicy: boolean };
  competitor?: CompetitiveThreat;
  billing?: BillingDiscrepancy;
}

function guardrailFor(pct: number, cap: number): AccountFacts["guardrail"] {
  if (pct <= cap) return { band: "self", routesTo: "Self-approval", withinPolicy: true };
  if (pct <= cap + 6) return { band: "dealdesk", routesTo: "Deal Desk", withinPolicy: false };
  return { band: "vp", routesTo: "VP Sales", withinPolicy: false };
}

/** Compute the canonical facts for an account at a given discount (defaults to the
 *  account's current applied discount — the single source of truth). */
export function accountFacts(a: RenewalAccount, pct: number = a.offer.appliedPct): AccountFacts {
  const discountPct = pct;
  // Blended margin erodes gently with discount on a value-priced base (demo model):
  // a 10% discount shaves ~0.7 pts off the blended margin.
  const marginAtDiscount = Math.max(0, Math.round((a.baseMarginPct - discountPct * 0.07) * 10) / 10);
  const proposedSpendAnnual = Math.round(a.value * (1 - discountPct / 100));
  const customerSavingAnnual = a.value - proposedSpendAnnual;
  const proposedSpendMonthly = Math.round(proposedSpendAnnual / 12);
  return {
    riskScore: a.churnRisk.score,
    posture: a.posture,
    daysToExpiry: a.daysToExpiry,
    renewalDate: a.contractEnd,
    nps: a.npsScore,
    discountPct,
    capPct: a.offer.capPct,
    baseMarginPct: a.baseMarginPct,
    marginAtDiscount,
    currentSpendAnnual: a.value,
    currentSpendMonthly: Math.round(a.value / 12),
    proposedSpendAnnual,
    proposedSpendMonthly,
    customerSavingAnnual,
    customerSavingMonthly: Math.round(customerSavingAnnual / 12),
    profitMonthly: Math.round((marginAtDiscount / 100) * proposedSpendMonthly),
    // "Beyond this you bleed" — where margin would fall under ~8%.
    worstCaseDiscountPct: Math.max(a.offer.capPct, Math.round(a.baseMarginPct - 8)),
    guardrail: guardrailFor(discountPct, a.offer.capPct),
    competitor: a.competitiveThreat,
    billing: a.billingDiscrepancy,
  };
}
