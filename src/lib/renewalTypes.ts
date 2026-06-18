// Renewal Manager workspace — renewal-scoped data model. Layered on top of the
// existing prototype WITHOUT touching the demand-gen types. Telecom-flavoured SME
// renewal book; mock-data only. Currency is GBP (£) throughout, kept consistent.

/** The four triage postures that drive the Home posture filters + row chips. */
export type RenewalPosture = "urgent" | "watch" | "opportunity" | "steady";

/** The decision tabs on the account workspace, in renewal-decision order. */
export type RenewalTab = "summary" | "risk" | "performance" | "economics" | "usage";

/** The ONE recommended action per account (drives the single row CTA). */
export type RenewalActionKind = "make_offer" | "build_offer" | "open_dispute" | "confirm" | "send_approval";

/** Where a stakeholder stands on the renewal (drives the Brief contact badges). */
export type ContactStance = "detractor" | "supporter" | "neutral";

export interface RenewalContact {
  name: string;
  role: string;
  /** How the relationship has changed (e.g. "New CFO since Jan — cost-focused"). */
  changeNote?: string;
  stance?: ContactStance;
}

/** A stakeholder/contract change on the account timeline (Brief "changes over time"). */
export interface AccountChange {
  date: string; // "Nov 2025"
  who: string; // "Sarah Lynch"
  event: string; // "New CFO joined post-restructure — cost-cutting mandate."
  kind: "added" | "changed";
}

export interface ContractRecord {
  period: string; // "2021–2024"
  value: number; // £/yr
  products: string;
  outcome: string; // "Renewed flat", "Upsold roaming", …
  discountPct?: number;
  connections?: number;
}

/** An explainable score — the renewal glass-box: a number + plain-language "why". */
export interface ExplainableScore {
  label: string;
  score: number; // 0–100 unless noted
  suffix?: string; // "%", "/10", …
  why: string; // plain-language reason + the rule it used
}

export interface CompetitiveThreat {
  summary: string;
  severity: RenewalPosture; // reuse posture tones for severity
  sourceLabel: string;
  sourceUrl: string; // a real, linkable source (not scraped)
}

export interface BillingDiscrepancy {
  summary: string;
  amount: number; // £ disputed
  marginImpactPts: number; // points knocked off margin while unresolved
}

export interface UsageInfo {
  arpu: number; // £ average revenue per user/line per month
  avgConsumption: string; // "8.4 GB data · 320 min voice"
  mix: { label: string; pct: number }[]; // product mix
  adoptionGaps: string[]; // features paid for but unused
}

export interface CostStackItem {
  label: string; // "Roaming", "International", "Devices/handsets", …
  monthly: number; // £/mo
}

/** The recommended next move — shown as the Home row + the account header hero. */
export interface RenewalMove {
  action: RenewalActionKind;
  label: string; // "Renew at 6% uplift, bundle roaming"
  cta: string; // "Make offer"
  whyText: string; // plain-language why
  ruleId: string; // the rule used (glass-box)
  ruleText: string; // human text of the rule
  /** Which account tab the CTA opens. */
  opensTab: RenewalTab;
}

/** Discount/offer lever — mirrors the demand-gen DiscountConfig shape, plus an
 *  explicit rep-set cap so over-cap offers can route to Approvals. */
export interface RenewalOffer {
  minPct: number;
  maxPct: number; // slider extent (can exceed the cap so the rep can breach it)
  capPct: number; // the protected-margin cap
  appliedPct: number; // current discount on the slider
}

export interface RenewalAccount {
  id: string;
  customer: string;
  segment: string; // "Logistics · SME", …
  lines: number; // device lines
  contractStart: string;
  contractEnd: string;
  daysToExpiry: number;
  value: number; // £/yr
  products: string[];
  blendedMargin: number; // %
  baseMarginPct: number; // baseline for the offer simulator (= blendedMargin)
  posture: RenewalPosture;
  renewalStage: string; // "Renewal due", "In negotiation", …
  tenureYears: number;
  npsScore: number;
  satisfactionLabel: string;
  contacts: RenewalContact[];
  contractHistory: ContractRecord[];
  openIssues: string[];
  competitiveThreat?: CompetitiveThreat;
  billingDiscrepancy?: BillingDiscrepancy;
  usage: UsageInfo;
  costStack: CostStackItem[];
  cpiImpactPct: number; // CPI uplift impact (line item in economics)
  handsetSubsidyMonthly: number; // handset subsidy cost (line item)
  clv: number; // customer lifetime value, £
  costToServeMonthly: number; // £/mo
  churnRisk: ExplainableScore;
  expansionPotential: ExplainableScore;
  riskScores: ExplainableScore[]; // additional explainable risk signals
  recommendedMove: RenewalMove;
  offer: RenewalOffer;
  performanceNote: string; // scaffold copy

  // ── Rich Brief detail (optional; populated for hero accounts) ───────────────
  currency?: "GBP" | "EUR"; // defaults to GBP
  accountOwner?: string;
  readKeyword?: string; // one-word account read, e.g. "RESTRUCTURE"
  approvalRisk?: number; // header read score (defaults to churnRisk.score)
  savingOpportunity?: number; // header read score
  forecastRenewalValue?: number; // £/€ per yr
  lastEngagement?: string;
  nextEngagement?: string;
  openIssuesPriority?: string[]; // (openIssues already exists; this is a curated list)
  pendingActions?: string[];
  changesOverTime?: AccountChange[];
  npsTrend?: number; // ↑/↓ points vs last
  npsTags?: string[];
  npsPositive?: string;
  npsNegative?: string;
  insights?: RenewalInsights;
  recommendationDetail?: RenewalRecommendationDetail;
  campaign?: RenewalCampaign;
  economics?: RenewalEconomics;
}

/** A Need-approval item — created when an over-cap offer is escalated (mirrors the
 *  demand-gen over-cap → escalation pattern). Surfaced on Home + the Approvals tab. */
export interface RenewalApproval {
  id: string;
  accountId: string;
  customer: string;
  requestedPct: number;
  capPct: number;
  reason: string;
}

/** Deep Risk & Insights evidence for the Brief tab (optional; hero accounts only). */
export interface RenewalInsights {
  competitor?: { name: string; product: string; theirPrice: number; ourPrice: number; source: string; sourceUrl: string; switchingRiskPct: number; vulnerabilityPct: number };
  usage?: { healthScore: number; overageMonthly: number; planFit: number; yoyVolumePct: number; premiumConnections?: number };
  sentiment?: { csatPct: number; tickets: number; complaints: number; serviceIssues: number; escalations: number; callsNote: string; emailNote: string };
  billing?: { exposureYr: number; found: number; highSeverity: number; renewalEffectPts: number; issues: { title: string; scope: string; monthly: number; severity: "High" | "Medium" | "Low" }[] };
  /** Plain-language map of where each canonical fact is pulled from (Plan & rules tab). */
  dataSources?: { label: string; source: string }[];
}

/** Brief → Economics tab (optional; hero accounts). */
export interface RenewalEconomics {
  connections: number;
  connectionMix: string; // "182 phones · 18 MBB · 40 M2M"
  arpu: number; // avg revenue / connection / mo
  ampu: number; // avg margin / connection / mo
  approvalNote: string;
  annualRevenue: number;
  revenueYoYPct: number;
  annualCost: number;
  grossProfit: number;
  grossMarginPct: number;
  subsidyDrag: number;
  subsidyDragPts: number;
  netMarginPct: number;
  netProfit: number;
  products: { name: string; color: string; marginPct: number; rev: number; cost: number; profit: number }[];
  scores: { label: string; score: number; band: "Strong" | "Moderate" | "Weak"; summary: string; why: string }[];
  saving: { total: number; cycles: { year: string; type: string; amount: number; note: string }[]; notes: string[] };
}

/** A single outreach touch in the renewal campaign sequence (Campaign stage). */
export interface RenewalTouch {
  day: number;
  channel: "Call" | "Email" | "LinkedIn" | "WhatsApp";
  title: string;
  detail: string;
}
export interface RenewalCampaign {
  rule: string; // "Save the renewal"
  ruleDesc: string; // "Lead with a call; run the save the renewal play."
  lead: string; // "Sequence leads with Call."
  touches: RenewalTouch[];
}

/** The multi-step recommended strategy shown on the Recommendation stage. */
export interface RenewalRecommendationDetail {
  reason: string; // REASON FOR ACTION banner
  signals: string[]; // extra signal chips beyond strategy + trigger
  context: string; // the situation paragraph under the chips
  headline: string; // "What to do" headline
  steps: string[]; // ordered what-to-do steps
  signoffNote: string; // SIGN-OFF SIMULATION narrative
  evidence: { label: string; value: string; note: string }[]; // WHAT THE EVIDENCE SHOWS rows
}

/** The renewal play shown in the My Renewal Tasks table STRATEGY column. */
export type RenewalStrategy = "Aggressive Defend" | "Margin Protect" | "High Risk Save" | "Fix Billing Leakage";

/** One row of the My Renewal Tasks table — flat, table-shaped (WHO · WHY · WHAT). */
export interface RenewalTaskRow {
  id: string;
  customer: string;
  value: number; // €/yr
  contactName: string;
  contactRole: string;
  strategy: RenewalStrategy;
  trigger: string; // short signal ("Competitor risk")
  reason: string; // plain-language detail (truncated in the cell)
  product: string; // recommended product move
  offerPct: number; // recommended discount, shown as −N%
  call: string; // outreach asset ("Script")
  campaign: string; // campaign name ("" → render the play as a pill)
  play: string; // "4-touch play"
  posture: RenewalPosture; // dot colour + attention filter
  daysToExpiry: number;
  renewalDate: string; // display date, "19 Jan 2026"
  currency?: "GBP" | "EUR";
}

/** The single artifact the renewal flow converges on (PRD §8). Composed from canonical
 *  facts + the recommended move; the seller selects which actions to include (opt-out). */
export type RenewalActionId = "offer" | "call" | "email";
export type RenewalPlayState = "draft" | "in_review" | "approved" | "sent_back" | "rejected" | "sent";

export interface RenewalPlay {
  accountId: string;
  chosenActions: RenewalActionId[]; // pre-selected from the recommendation, opt-out in Build
  billingResolved: boolean; // billing gate must clear before submit (FR-4.1)
  state: RenewalPlayState;
  staleArtifacts: boolean; // an upstream change invalidated the generated artifacts (SoT-3)
  callScript?: string; // generated in Build when "call" is chosen
  emailDraft?: string; // generated in Build when "email" is chosen
}

export type RenewalAlertKind = "competitor" | "billing" | "usage" | "churn";

export interface RenewalAlert {
  id: string;
  kind: RenewalAlertKind;
  accountId: string;
  body: string;
  at: string;
}
