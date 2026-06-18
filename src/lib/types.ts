// Data model for the prototype (spec §9). Mock-data only, in-memory.

export type Source = "hubspot" | "salesforce" | "upload";
/** Which workspace the user is in. Chosen at onboarding, switchable from the icon rail. */
export type Persona = "demandgen" | "renewal";
export type Mode = "assist" | "augment" | "autonomous";
export type Scenario = "renewal" | "expansion" | "acquisition";
export type Channel = "linkedin" | "email" | "whatsapp";
export type TouchState = "draft" | "approved";
export type CampaignStatus = "running" | "paused" | "completed";
export type BuildType = "ai" | "manual" | "personalisation";

/** The five agents render as ordered plan-rail steps. */
export type AgentStep = 1 | 2 | 3 | 4 | 5;

export interface Scorecard {
  icpFit: number | null;
  firmographics: number | null;
  intent: number | null;
  engagement: number | null;
  recency: number | null;
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  headcount: string;
  score: number;
  routingBadge: string; // 'NURTURE'
  routingNote?: string;
  scorecard: Scorecard;
  contact: { email: string; phone?: string; linkedin?: string };
  lineage: { originBrief: string; qualified: string; enrichment: string };
  accountId: string;
  queued?: boolean;
}

export interface ResearchCard {
  kind: "TRIGGER" | "BUYING SIGNAL" | "CONTEXT";
  title: string;
  body: string;
  source: string;
}

export interface Account {
  id: string;
  name: string;
  location: string;
  routingBadge: string; // 'NURTURE 40'
  firmographics: {
    industry: string;
    employees: string;
    revenue: string;
    founded: number;
    hq: string;
    funding: string;
    website: string;
    description: string;
  };
  techStackCount: number;
  hiringIntelCount: number;
  contactIds: string[];
  research: ResearchCard[];
}

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  title: string;
  state: "researched" | "drafting";
  focused: boolean;
  progress: string; // '0/8'
}

export interface Touch {
  id: string;
  channel: Channel;
  day: number;
  type: string; // 'Value DM'
  state: TouchState;
  body: string;
  inviteMode?: "with-note" | "without-note";
}

export interface ChannelSequence {
  window: string;
  touches: Touch[];
}

export interface Sequence {
  accountId: string;
  byChannel: Partial<Record<Channel, ChannelSequence>>;
}

export interface Campaign {
  id: string;
  name: string;
  build: BuildType;
  segment: string;
  status: CampaignStatus;
  channels: Channel[];
  accounts: number;
  sent: number;
  replied: number;
  meetings: number;
  updated: string;
}

export interface Todo {
  id: string;
  label: string;
  done: boolean;
}

export interface Notification {
  id: string;
  kind: "reply" | "trigger";
  accountId: string;
  body: string;
  at: string;
}

/** A single message in the persistent Workbook conversation (left-panel Chat tab). */
export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  scope?: string; // e.g. the sheet/account the message relates to
  at: string;
}

/** Home attention queue item — one prepared account awaiting a decision (spec §6.0). */
export interface AttentionItem {
  id: string;
  accountId: string;
  accountName: string;
  triggerSummary: string;
  score: number;
  routingBadge: string;
  nextBestAction: string;
  note?: string; // the "why now" line under the recommended action
  cta: string;
  priority: "now" | "wait";
  step: AgentStep; // where the CTA drops the rep in the Workbook
}

// ── Auto ("Autonomous") mode ─────────────────────────────────────────────────
// The plan-first autonomous flow: Clarify → Plan → Run → Needs-your-attention.
// (This prompt is the source of truth for these shapes, layered on the §9 model.)

/** Where the rep is in the auto-mode flow. */
export type AutoPhase = "clarify" | "plan" | "run" | "attention";

/** One tappable choice within a clarify segment. */
export interface ChoiceOption {
  id: string;
  label: string;
}

/** A single-select group of choice chips inside a clarify question. */
export interface ClarifySegment {
  id: string; // unique key; also the assumption key on the Plan
  label?: string; // small eyebrow above the chips
  multi?: boolean;
  options: ChoiceOption[];
  defaultId?: string;
}

/** A conversational clarifying question rendered as tappable chips (no free text). */
export interface ClarifyQuestion {
  id: string;
  question: string; // what the agent asks
  ack: string; // brief acknowledgement once answered
  segments: ClarifySegment[];
}

/** Map of clarify segment id → selected choice id(s). */
export type ClarifyAnswers = Record<string, string[]>;

/** An editable line in the Plan (resolved assumption the run will act on). */
export interface PlanAssumption {
  key: string; // matches a ClarifySegment id when editable, else a derived key
  label: string;
  value: string; // human-readable resolved value
  segmentId?: string; // if set, inline-editable via this clarify segment's options
}

/** The Plan: the contract the rep approves before the agent runs (Step 2). */
export interface Plan {
  resolvedTargeting: string;
  hook: string; // what we're expanding in (motion · product · offer)
  projectedAccounts: number;
  projectedContacts: number;
  assumptions: PlanAssumption[];
  qualAxes: string[]; // the 5 scorecard axes
  qualThreshold: string; // advance threshold + tiers
  sequence: { channel: Channel; label: string; touches: number; window: string }[];
  channels: Channel[];
  dailyVolume: string;
  timeline: string;
  sources: string[]; // connected sources the list is pulled from
  crmTarget: string;
  escalationRules: string[];
  recommendation: RecommendationPlan; // the decision-layer assumptions (this prompt)
  status: "draft" | "approved";
}

// ── Recommendation stage ──────────────────────────────────────────────────────
// The decision layer between Qualification and Campaign (this prompt is the source
// of truth). Bundle qualified accounts into segments, surface three next-bests per
// segment, and resolve the next-best action into one of five types. Mock-only.

/** The five ways a next-best action resolves. */
export type ActionType =
  | "call" // schedule a 1:1 call task
  | "campaign_ab" // micro-segment + run A/B variants
  | "discount_bundle" // opens the margin simulator (discount % → revenue & margin)
  | "assign_partner" // hand off to the next-best partner
  | "new_opportunity"; // create a cross-sell opp for the next-best product

/** A discount range/guardrail in percent — used both as a segment's negotiable
 *  range and (on the Plan) as the rep-set cap. */
export interface DiscountConfig {
  minPct: number;
  maxPct: number;
  appliedPct: number;
}

/** Per-account inputs to the deterministic margin model. */
export interface MarginInputs {
  accountId: string;
  dealSize: number; // $ deal value
  baseMarginPct: number; // margin before any discount
}

/** A bundle of qualified accounts sharing industry + buyer title + prior response. */
export interface Segment {
  id: string;
  name: string; // "Mid-market SaaS · NYC"
  accountIds: string[];
  basis: string; // "SaaS · PM · responded to Product X"
  nextBest: { product: string; action: ActionType; partner?: string };
  baseRevenue: number; // Σ dealSize across the segment's accounts
  baseMarginPct: number; // blended base margin
  discount?: DiscountConfig; // negotiable range + applied % (discount_bundle action)
  abVariants?: number; // micro-segments × A/B (campaign_ab action)
  signals: string[]; // the "why" lines shown in the right context panel
  analytics: { replyPct: number; meetingPct: number };
}

/** A reusable rule shown in the glass-box Rules tab. */
export interface Rule {
  id: string;
  scope: string; // where it applies
  rule: string; // the rule text
  source: "human" | "analytics";
}

/** The Recommendation assumptions carried on the Plan (editable pre-run). */
export interface RecommendationPlan {
  segmentationBasis: string;
  discount: DiscountConfig; // the rep-set cap (minPct/maxPct) + default applied %
  abVariants: number;
}

/** A streamed line in the run's live activity log. */
export interface ActivityLine {
  id: string;
  stage: AgentStep;
  text: string;
}

/** One next-best-action button on a run-attention card. */
export interface AttentionAction {
  label: string;
  primary?: boolean;
}

/** A boundary the autonomous run hit and returned to the rep to decide (Step 4). */
export interface RunAttentionItem {
  id: string;
  title: string;
  detail: string;
  accountId?: string;
  step: AgentStep; // where clicking drops the rep, with context loaded
  actions: AttentionAction[];
  priority: "now" | "wait";
}
