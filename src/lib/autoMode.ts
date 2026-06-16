// Auto ("Autonomous") mode — the scripted spine of the plan-first flow.
// Clarify questions (tappable chips), Plan derivation from the answers, the
// watchable run timeline, and the "Needs your attention" boundary items.
// All mock; the run mutates the in-memory store over scripted timers (no network).

import type {
  AgentStep,
  ClarifyAnswers,
  ClarifyQuestion,
  MarginInputs,
  Plan,
  PlanAssumption,
  RunAttentionItem,
} from "./types";

// ── Step 1: Clarify — a small, expansion-specific question set ────────────────
// Scenario is fixed to expansion (existing customers), so we DON'T ask: scenario,
// "exclude current customers" (inverted here), source (defaults to CRM), the
// trigger/"why now" (detected from signals), or geo/seniority-detail/channels/
// tone/cadence/scoring (demoted to editable plan assumptions or standing config).
// We only ask what the downstream message, offer, and campaign hang on.
export const CLARIFY_QUESTIONS: ClarifyQuestion[] = [
  {
    // The non-negotiable one — in expansion everything downstream hangs on this.
    id: "q-motion",
    question:
      "You're expanding into existing customers that match the brief — Product Managers at Tech/SaaS + Telecom accounts you already own. Biggest question first: what are you expanding into these accounts?",
    ack: "Locked the expansion motion and offer.",
    segments: [
      {
        id: "motion",
        label: "Motion",
        options: [
          { id: "cross-sell", label: "Cross-sell a product they don't own yet" },
          { id: "upsell", label: "Upsell more of what they have — seats/tier" },
          { id: "module", label: "A specific new module/launch" },
        ],
      },
      {
        id: "product",
        label: "Which product",
        options: [
          { id: "billing", label: "Payments & Billing module" },
          { id: "engagement", label: "Member Engagement add-on" },
          { id: "analytics", label: "Analytics & Reporting tier" },
        ],
      },
      {
        id: "offer",
        label: "Expansion offer",
        options: [
          { id: "bundle", label: "Bundle/discount" },
          { id: "none", label: "None" },
        ],
        defaultId: "none",
      },
    ],
  },
  {
    id: "q-entry",
    question: "Who should I engage inside each account?",
    ack: "Got the entry point.",
    segments: [
      {
        id: "entry",
        label: "Entry point",
        options: [
          { id: "new-bc", label: "The PMs as a new buying center" },
          { id: "champion", label: "Thread through the existing champion/owner too" },
          { id: "both", label: "Both" },
        ],
      },
      {
        id: "seniority",
        label: "Within product",
        options: [
          { id: "pm-only", label: "PM only" },
          { id: "incl-sr", label: "+ Sr/Group PM" },
          { id: "incl-dir", label: "+ Dir/VP Product" },
        ],
      },
    ],
  },
  {
    // Highest-stakes expansion guardrail — these are current customers with owners.
    id: "q-guardrail",
    question: "These are current customers — how should I handle the existing relationship?",
    ack: "Noted the guardrail.",
    segments: [
      {
        id: "guardrail",
        options: [
          { id: "own-only", label: "Only accounts I own" },
          { id: "loop-csm", label: "Loop in the account owner/CSM before outreach" },
          { id: "independent", label: "Run independently across all matching customers" },
        ],
      },
    ],
  },
  {
    id: "q-scope",
    question: "Which matching customers should I go after?",
    ack: "Scoped the target customers.",
    segments: [
      {
        id: "customerScope",
        label: "Scope",
        options: [
          { id: "all", label: "All current customers matching the filters" },
          { id: "signals", label: "Only those showing expansion signals" },
          { id: "health", label: "Only above a health-score threshold" },
        ],
        defaultId: "signals", // smart default: expansion-ready
      },
    ],
  },
  {
    id: "q-volume",
    question: "Last one — how big a run, and do you want a checkpoint before sending?",
    ack: "All set — building your plan.",
    segments: [
      {
        id: "size",
        label: "Run size",
        options: [
          { id: "10", label: "10 accounts" },
          { id: "25", label: "25 accounts" },
          { id: "50", label: "50 accounts" },
        ],
      },
      {
        id: "checkpoint",
        label: "Checkpoint",
        options: [
          { id: "review-first", label: "Review the first batch before sending" },
          { id: "send-approved", label: "Send within the approved plan" },
        ],
        defaultId: "review-first", // higher-stakes base — confirm before sending
      },
    ],
  },
];

/** Find a clarify segment by id (used to render inline edit chips on the Plan). */
export const segmentById = (id: string) => {
  for (const q of CLARIFY_QUESTIONS) {
    const seg = q.segments.find((s) => s.id === id);
    if (seg) return seg;
  }
  return undefined;
};

/** Default answers (every segment's `defaultId`) — also the Plan's starting point. */
export const defaultClarifyAnswers = (): ClarifyAnswers => {
  const a: ClarifyAnswers = {};
  for (const q of CLARIFY_QUESTIONS)
    for (const seg of q.segments) if (seg.defaultId) a[seg.id] = [seg.defaultId];
  return a;
};

// Lookup: segment id → (choice id → label)
const labelOf = (segmentId: string, choiceId?: string): string => {
  for (const q of CLARIFY_QUESTIONS) {
    const seg = q.segments.find((s) => s.id === segmentId);
    if (seg) return seg.options.find((o) => o.id === choiceId)?.label ?? "—";
  }
  return "—";
};

const pick = (answers: ClarifyAnswers, segmentId: string): string | undefined =>
  answers[segmentId]?.[0];

// ── Step 2: Plan — derive the contract from the clarify answers ──────────────
const SENIORITY_LABEL: Record<string, string> = {
  "pm-only": "PMs only",
  "incl-sr": "PM + Sr/Group PM",
  "incl-dir": "PM + Dir/VP Product",
};
const ENTRY_LABEL: Record<string, string> = {
  "new-bc": "open the PMs as a new buying center",
  champion: "thread through the existing champion/owner",
  both: "PMs + existing champion (multi-thread)",
};
const SCOPE_LABEL: Record<string, string> = {
  all: "all matching current customers",
  signals: "customers showing expansion signals",
  health: "customers above the health-score threshold",
};
const MOTION_LABEL: Record<string, string> = {
  "cross-sell": "Cross-sell a new product",
  upsell: "Upsell seats/tier",
  module: "New module/launch",
};
// contacts-per-account multiplier from seniority breadth × multi-threading
const SENIORITY_FACTOR: Record<string, number> = { "pm-only": 1.4, "incl-sr": 1.8, "incl-dir": 2.2 };
const entryFactor = (entry?: string) => (entry === "both" ? 1.4 : entry === "champion" ? 1.2 : 1);

export function derivePlan(answers: ClarifyAnswers): Plan {
  const motion = pick(answers, "motion");
  const product = pick(answers, "product");
  const offer = pick(answers, "offer") ?? "none";
  const entry = pick(answers, "entry");
  const seniority = pick(answers, "seniority") ?? "pm-only";
  const guardrail = pick(answers, "guardrail");
  const scope = pick(answers, "customerScope") ?? "signals";
  const size = pick(answers, "size") ?? "25";
  const checkpoint = pick(answers, "checkpoint") ?? "review-first";

  const accounts = Number(size) || 25;
  const contacts = Math.round(accounts * (SENIORITY_FACTOR[seniority] ?? 1.4) * entryFactor(entry));

  const hook = [
    MOTION_LABEL[motion ?? ""] ?? "Expansion",
    labelOf("product", product),
    offer === "bundle" ? "with a bundle/discount" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const resolvedTargeting = `Current customers · ${SCOPE_LABEL[scope]} · ${SENIORITY_LABEL[seniority]}, ${ENTRY_LABEL[entry ?? "new-bc"]} · Tech/SaaS + Telecom · 251–500 employees`;

  const dailyVolume = `≈ ${Math.max(6, Math.round(contacts / 6))} sends/day across LinkedIn + Email`;
  const timeline = "First replies in ~3–4 days · full 12-day cadence per contact";

  const assumptions: PlanAssumption[] = [
    { key: "motion", label: "Motion", value: labelOf("motion", motion), segmentId: "motion" },
    { key: "product", label: "Product", value: labelOf("product", product), segmentId: "product" },
    { key: "offer", label: "Offer", value: labelOf("offer", offer), segmentId: "offer" },
    { key: "entry", label: "Entry point", value: labelOf("entry", entry), segmentId: "entry" },
    { key: "seniority", label: "Seniority", value: SENIORITY_LABEL[seniority], segmentId: "seniority" },
    { key: "guardrail", label: "Relationship", value: labelOf("guardrail", guardrail), segmentId: "guardrail" },
    { key: "customerScope", label: "Customer scope", value: SCOPE_LABEL[scope], segmentId: "customerScope" },
    { key: "size", label: "Run size", value: `${accounts} accounts`, segmentId: "size" },
    { key: "checkpoint", label: "Send checkpoint", value: labelOf("checkpoint", checkpoint), segmentId: "checkpoint" },
  ];

  const escalationRules = [
    "A contact replies about pricing, timing, or interest → pause and surface for a human reply",
    "Day 6 reached with no LinkedIn connection-accept → propose switching that contact to email",
    `Expansion-ready accounts fall short of the ${accounts}-account target → pause to widen the scope`,
    "An account shows a churn-risk or renewal signal → pause and alert the account owner",
    "Hard bounce or opt-out → stop that contact immediately",
    "Meeting booked → hand off with a prepared pre-call brief",
  ];
  if (guardrail === "loop-csm")
    escalationRules.unshift("Notify the account owner/CSM before any outreach to their accounts");
  else if (guardrail === "own-only")
    escalationRules.unshift("Skip any account owned by another rep");
  if (checkpoint === "review-first")
    escalationRules.unshift("First batch holds for your review before anything sends");

  return {
    resolvedTargeting,
    hook,
    projectedAccounts: accounts,
    projectedContacts: contacts,
    assumptions,
    qualAxes: ["ICP Fit", "Firmographics", "Intent", "Engagement", "Recency"],
    qualThreshold: "Expansion-ready ≥ 50 · FOCUSED ≥ 70 · below 50 holds for nurture",
    sequence: [
      { channel: "linkedin", label: "LinkedIn", touches: 4, window: "Day 0 → Day 12" },
      { channel: "email", label: "Email", touches: 4, window: "Day 1 → Day 10" },
    ],
    channels: ["linkedin", "email"],
    dailyVolume,
    timeline,
    sources: ["HubSpot", "Salesforce"],
    crmTarget: "HubSpot",
    escalationRules,
    recommendation: {
      segmentationBasis: "Industry + buyer title + prior campaign response",
      discount: { minPct: 0, maxPct: 15, appliedPct: offer === "bundle" ? 12 : 0 },
      abVariants: 3,
    },
    status: "draft",
  };
}

// ── Margin model (deterministic; round every displayed number) ────────────────
// segmentRevenue = Σ dealSize × (1 − appliedPct/100);  marginPct ≈ baseMarginPct − appliedPct
export const accountRevenue = (dealSize: number, appliedPct: number): number =>
  Math.round(dealSize * (1 - appliedPct / 100));

export const segmentRevenue = (inputs: MarginInputs[], appliedPct: number): number =>
  inputs.reduce((sum, i) => sum + accountRevenue(i.dealSize, appliedPct), 0);

export const marginPct = (baseMarginPct: number, appliedPct: number): number =>
  Math.round(baseMarginPct - appliedPct);

/** Compact "$218k" formatting for revenue figures. */
export const usdCompact = (n: number): string =>
  n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;

/** Sources the rep can connect (the picker is stubbed; toggling is local — spec §3.4). */
export const ALL_SOURCES = ["HubSpot", "Salesforce", "Upload sheet"];

// ── Step 3: Run — the watchable timeline (one entry per plan-rail stage) ──────
// Each stage streams a few activity lines, then the store is populated so the
// stage reads as real (verbatim §6 data) when opened. Lines reflect the plan.
export interface RunStage {
  step: AgentStep;
  title: string;
  lines: string[];
}

export function buildRunStages(plan: Plan): RunStage[] {
  const { projectedAccounts: accts, projectedContacts: contacts, crmTarget } = plan;
  return [
    {
      step: 1,
      title: "Lead Research",
      lines: [
        `Pulled ${accts} current customers matching the brief from HubSpot + Salesforce…`,
        `Enriched ${contacts} contacts via Prospeo…`,
        `Resolved Softheon, Meridian Health Systems, Northwind Labs + ${Math.max(0, accts - 3)} more.`,
      ],
    },
    {
      step: 2,
      title: "Lead Qualification",
      lines: [
        "Scored expansion-readiness on the 5-axis model…",
        "Scored Softheon 40 (NURTURE) · Northwind Labs 88 (PRIORITY)…",
        "18 accounts cleared the ≥ 50 expansion-ready threshold.",
      ],
    },
    {
      step: 3,
      title: "Recommendation",
      lines: [
        "Bundled 7 qualified accounts into 3 segments by industry + title + prior response…",
        "Next best · Mid-market SaaS · NYC: discount + bundle (Security add-on)…",
        "Applied 12% within your 15% cap — margin 19%, segment revenue $218k…",
        "Sightview wants 22% — beyond your 15% cap → flagged for approval.",
      ],
    },
    {
      step: 4,
      title: "Campaign Build",
      lines: [
        "Assembled LinkedIn + Email channels with the approved cadence…",
        "Launched 'Softheon — Personalised Outreach'…",
        `Logged the campaign to ${crmTarget}.`,
      ],
    },
    {
      step: 5,
      title: "Campaign Monitor",
      lines: [
        "Watching live sends…",
        "Akshay Punde replied on the Day 1 email — flagged for you.",
        "Run complete — 3 items need your attention.",
      ],
    },
  ];
}

// ── Step 4: Needs your attention — the boundaries the run returned on ─────────
export const runAttentionItems = (): RunAttentionItem[] => [
  {
    id: "rat-overcap",
    title: "Sightview wants 22% — beyond your 15% cap",
    detail: "Telecom · NYC. The recommended discount clears the cap; I held it for your call.",
    accountId: "acc-sightview",
    step: 3,
    priority: "now",
    actions: [
      { label: "Approve 22%", primary: true },
      { label: "Counter" },
    ],
  },
  {
    id: "rat-reply",
    title: "Akshay Punde replied — asking about pricing",
    detail: "Softheon · LinkedIn Day 1. High intent — the sequence is paused for this contact.",
    accountId: "acc-softheon",
    step: 3,
    priority: "now",
    actions: [
      { label: "Draft reply", primary: true },
      { label: "Book call" },
    ],
  },
  {
    id: "rat-noaccept",
    title: "Softheon hit Day 6 with no connection-accept",
    detail: "Chris Kaspar hasn't accepted the LinkedIn invite. I can pivot the channel.",
    accountId: "acc-softheon",
    step: 3,
    priority: "wait",
    actions: [
      { label: "Switch to email", primary: true },
      { label: "Hold" },
    ],
  },
  {
    id: "rat-exhausted",
    title: "List exhausted at 18 qualified accounts",
    detail: "Below the 50-contact target after the ≥ 50 threshold. Widen the brief or proceed.",
    accountId: "acc-softheon",
    step: 2,
    priority: "wait",
    actions: [
      { label: "Widen brief", primary: true },
      { label: "Proceed" },
    ],
  },
];
