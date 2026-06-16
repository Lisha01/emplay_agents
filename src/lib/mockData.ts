// Seed data — verbatim from spec §6.2–§6.4 where marked, plus invented rows so lists
// aren't single-item. No persistence; the store deep-clones this on reset.

import type {
  Account,
  AttentionItem,
  Campaign,
  Contact,
  Lead,
  MarginInputs,
  Notification,
  Rule,
  Segment,
  Sequence,
  Todo,
} from "./types";

export const ORIGIN_BRIEF =
  "Help me find the Product Managers in New York city in Tech/SaaS";

// ── Accounts ───────────────────────────────────────────────────────────────
export const accounts: Account[] = [
  {
    id: "acc-softheon",
    name: "Softheon",
    location: "New York, New York, United States",
    routingBadge: "NURTURE 40",
    firmographics: {
      industry: "Software Development",
      employees: "253 (201–500)",
      revenue: "100M",
      founded: 2000,
      hq: "Stony Brook, New York, United States",
      funding: "$200.0K · Series unknown",
      website: "https://softheon.com",
      description:
        "Softheon is a healthcare technology company that helps health plans, brokers, and government agencies streamline enrollment, billing, payments, and member engagement across ACA, ICHRA, Medicare Advantage, and other products. Its integrated, compliant platform reduces administrative costs, improves member experiences, and supports scalable growth.",
    },
    techStackCount: 35,
    hiringIntelCount: 3,
    contactIds: ["con-akshay", "con-chris"],
    research: [
      {
        kind: "TRIGGER",
        title: "Softheon — Software Development signal",
        body: "Softheon in New York, New York, United States flagged as a target. ICP score 40 (NURTURE). Vendor evaluation likely in progress for the relevant capability area.",
        source: "Internal qualification",
      },
      {
        kind: "BUYING SIGNAL",
        title: 'Akshay owns "Product Manager"',
        body: "Decision authority in scope. Open the chat with Akshay above to tailor the plan to their remit.",
        source: "LinkedIn profile",
      },
      {
        kind: "CONTEXT",
        title: "Region context",
        body: "Operating in New York, New York, United States. Cross-reference with similar accounts in the same block for tone calibration.",
        source: "Block-level signals",
      },
    ],
  },
  {
    id: "acc-meridian",
    name: "Meridian Health Systems",
    location: "Boston, Massachusetts, United States",
    routingBadge: "ENGAGE 72",
    firmographics: {
      industry: "Telecommunications",
      employees: "410 (201–500)",
      revenue: "240M",
      founded: 2008,
      hq: "Boston, Massachusetts, United States",
      funding: "$48.0M · Series C",
      website: "https://meridianhs.com",
      description:
        "Meridian Health Systems builds connectivity infrastructure for regional care networks, with a growing SaaS layer for provider scheduling and patient messaging.",
    },
    techStackCount: 28,
    hiringIntelCount: 6,
    contactIds: ["con-dana"],
    research: [
      {
        kind: "TRIGGER",
        title: "Renewal window opens in 38 days",
        body: "Annual contract renews next quarter; usage up 22% QoQ. Strong expansion candidate.",
        source: "Internal CRM",
      },
      {
        kind: "BUYING SIGNAL",
        title: "Posted 6 platform-engineering roles",
        body: "Hiring intel suggests an infra build-out — timely for a capacity conversation.",
        source: "Hiring intel",
      },
    ],
  },
  {
    id: "acc-northwind",
    name: "Northwind Labs",
    location: "Austin, Texas, United States",
    routingBadge: "PRIORITY 88",
    firmographics: {
      industry: "Tech / SaaS",
      employees: "320 (201–500)",
      revenue: "180M",
      founded: 2012,
      hq: "Austin, Texas, United States",
      funding: "$120.0M · Series D",
      website: "https://northwindlabs.com",
      description:
        "Northwind Labs is a data-infrastructure company serving fintech and insurance customers with a real-time pipeline and observability suite.",
    },
    techStackCount: 41,
    hiringIntelCount: 9,
    contactIds: ["con-priya"],
    research: [
      {
        kind: "TRIGGER",
        title: "New VP of Product hired 11 days ago",
        body: "Leadership change often re-opens the tooling stack. Reach out while priorities are forming.",
        source: "LinkedIn signal",
      },
    ],
  },
  ...recommendationAccounts(),
];

// Lightweight accounts that populate the Recommendation segments (this prompt).
// Softheon (above) is reused; these add segment variety. Firmographics are mock.
function recommendationAccounts(): Account[] {
  const mk = (
    id: string,
    name: string,
    industry: string,
    badge: string,
    employees: string,
    revenue: string,
    desc: string,
    research: Account["research"],
  ): Account => ({
    id,
    name,
    location: "New York, New York, United States",
    routingBadge: badge,
    firmographics: {
      industry,
      employees,
      revenue,
      founded: 2014,
      hq: "New York, New York, United States",
      funding: "—",
      website: `https://${name.split(" ")[0].toLowerCase()}.com`,
      description: desc,
    },
    techStackCount: 24,
    hiringIntelCount: 2,
    contactIds: [],
    research,
  });
  return [
    mk(
      "acc-ripplematch",
      "RippleMatch",
      "Tech / SaaS",
      "ENGAGE 64",
      "290 (201–500)",
      "72M",
      "RippleMatch runs an AI recruiting platform that matches early-career candidates to employers.",
      [
        { kind: "BUYING SIGNAL", title: "Responded to the Product X campaign", body: "Opened and replied to the prior add-on drip — warm for a security cross-sell.", source: "Campaign engagement" },
        { kind: "CONTEXT", title: "Mid-market SaaS · NYC", body: "Fits the SaaS · PM · prior-responder segment for a bundled security add-on.", source: "Segment signals" },
      ],
    ),
    mk(
      "acc-latitude",
      "Latitude SaaS",
      "Tech / SaaS",
      "ENGAGE 58",
      "265 (201–500)",
      "60M",
      "Latitude SaaS builds workflow automation for mid-market operations teams.",
      [
        { kind: "BUYING SIGNAL", title: "PM owns the security roadmap", body: "Decision authority in scope for an add-on bundle.", source: "LinkedIn profile" },
        { kind: "CONTEXT", title: "Mid-market SaaS · NYC", body: "Clusters with Softheon + RippleMatch on industry, title, and prior response.", source: "Segment signals" },
      ],
    ),
    mk(
      "acc-sightview",
      "Sightview Software",
      "Telecommunications",
      "PRIORITY 78",
      "430 (201–500)",
      "150M",
      "Sightview Software provides network observability tooling to regional carriers.",
      [
        { kind: "TRIGGER", title: "Asked about pricing on the last touch", body: "High intent — flagged a discount request beyond the standard cap.", source: "Reply intel" },
        { kind: "BUYING SIGNAL", title: "Prior webinar attendee", body: "Attended the network-analytics webinar; a 1:1 call converts this segment best.", source: "Campaign engagement" },
      ],
    ),
    mk(
      "acc-northway",
      "Northway Telecom",
      "Telecommunications",
      "ENGAGE 66",
      "380 (201–500)",
      "120M",
      "Northway Telecom operates fiber infrastructure across the northeast corridor.",
      [
        { kind: "BUYING SIGNAL", title: "Network ops team expanding", body: "Capacity build-out makes an analytics upsell timely.", source: "Hiring intel" },
        { kind: "CONTEXT", title: "Telecom · NYC", body: "Call-first segment — prior webinar attendees reply better to a 1:1 than a campaign.", source: "Segment signals" },
      ],
    ),
    mk(
      "acc-meridian-networks",
      "Meridian Networks",
      "Telecommunications",
      "ENGAGE 70",
      "405 (201–500)",
      "210M",
      "Meridian Networks builds connectivity infrastructure for regional care networks.",
      [
        { kind: "TRIGGER", title: "Renewal window opens in 52 days", body: "Usage up QoQ — renewal-ready and a candidate for a tier upgrade via A/B.", source: "Internal CRM" },
        { kind: "CONTEXT", title: "Renewal-ready segment", body: "A Regional VAR partner is available to co-sell the platform tier.", source: "Segment signals" },
      ],
    ),
    mk(
      "acc-vantage",
      "Vantage Cloud",
      "Tech / SaaS",
      "ENGAGE 62",
      "240 (201–500)",
      "55M",
      "Vantage Cloud offers managed data-platform hosting for fintech customers.",
      [
        { kind: "TRIGGER", title: "Renewal window opens in 44 days", body: "Steady usage; a good A/B candidate for a platform tier upgrade.", source: "Internal CRM" },
        { kind: "CONTEXT", title: "Renewal-ready segment", body: "Clusters with Meridian Networks on renewal timing.", source: "Segment signals" },
      ],
    ),
  ];
}

// ── Contacts ───────────────────────────────────────────────────────────────
export const contacts: Contact[] = [
  {
    id: "con-akshay",
    accountId: "acc-softheon",
    name: "Akshay Punde",
    title: "Product Manager",
    state: "researched",
    focused: true,
    progress: "0/8",
  },
  {
    id: "con-chris",
    accountId: "acc-softheon",
    name: "Chris Kaspar",
    title: "Product Manager",
    state: "researched",
    focused: false,
    progress: "0/8",
  },
  {
    id: "con-dana",
    accountId: "acc-meridian",
    name: "Dana Whitfield",
    title: "Director of Platform",
    state: "researched",
    focused: true,
    progress: "0/6",
  },
  {
    id: "con-priya",
    accountId: "acc-northwind",
    name: "Priya Raman",
    title: "VP of Product",
    state: "researched",
    focused: true,
    progress: "0/8",
  },
];

// ── Leads (Research results) ────────────────────────────────────────────────
// ~15 Product Managers across invented Tech/SaaS + Telecom companies, headcount
// 201–500. Chris Kaspar + Akshay Punde thread into later screens (spec §6.1).
const emptyScorecard = {
  icpFit: null,
  firmographics: null,
  intent: null,
  engagement: null,
  recency: null,
};

export const leads: Lead[] = [
  {
    id: "lead-chris",
    name: "Chris Kaspar",
    title: "Product Manager",
    company: "Softheon",
    location: "New York, New York, United States",
    industry: "Software Development",
    headcount: "253",
    score: 40,
    routingBadge: "NURTURE",
    routingNote: "Nurture campaign · Unassigned (not MENA/APAC)",
    scorecard: { icpFit: 47, firmographics: 32, intent: null, engagement: null, recency: null },
    contact: {
      email: "ckaspar@softheon.com",
      phone: "+1 402-6**-****",
      linkedin: "LinkedIn profile",
    },
    lineage: {
      originBrief: ORIGIN_BRIEF,
      qualified: "Auto-qualified · 30m ago",
      enrichment: "Enriched via Prospeo",
    },
    accountId: "acc-softheon",
  },
  {
    id: "lead-akshay",
    name: "Akshay Punde",
    title: "Product Manager",
    company: "Softheon",
    location: "New York, New York, United States",
    industry: "Software Development",
    headcount: "253",
    score: 44,
    routingBadge: "NURTURE",
    routingNote: "Nurture campaign · Unassigned (not MENA/APAC)",
    scorecard: { icpFit: 51, firmographics: 32, intent: 28, engagement: null, recency: null },
    contact: { email: "apunde@softheon.com", phone: "+1 402-6**-****", linkedin: "LinkedIn profile" },
    lineage: {
      originBrief: ORIGIN_BRIEF,
      qualified: "Auto-qualified · 30m ago",
      enrichment: "Enriched via Prospeo",
    },
    accountId: "acc-softheon",
  },
  ...(
    [
      ["Dana Whitfield", "Atlas Telecom", "New York, New York, United States", "Telecommunications", "410", 72, "ENGAGE"],
      ["Priya Raman", "Northwind Labs", "New York, New York, United States", "Tech / SaaS", "320", 88, "PRIORITY"],
      ["Marcus Lee", "Brightwave Cloud", "New York, New York, United States", "Tech / SaaS", "275", 61, "ENGAGE"],
      ["Sofia Mendes", "Cordova Networks", "New York, New York, United States", "Telecommunications", "488", 35, "NURTURE"],
      ["Ethan Park", "Quanta Systems", "New York, New York, United States", "Tech / SaaS", "212", 54, "ENGAGE"],
      ["Hannah Cole", "Veritas Signal", "New York, New York, United States", "Telecommunications", "366", 47, "NURTURE"],
      ["Liam O'Brien", "Plexus Data", "New York, New York, United States", "Tech / SaaS", "299", 69, "ENGAGE"],
      ["Aisha Khan", "Lumen Telecom", "New York, New York, United States", "Telecommunications", "451", 81, "PRIORITY"],
      ["Noah Bennett", "Forge Analytics", "New York, New York, United States", "Tech / SaaS", "204", 38, "NURTURE"],
      ["Maya Iyer", "Sterling Comm", "New York, New York, United States", "Telecommunications", "390", 58, "ENGAGE"],
      ["Diego Torres", "Apex SaaS", "New York, New York, United States", "Tech / SaaS", "263", 66, "ENGAGE"],
      ["Grace Lin", "Halcyon Telecom", "New York, New York, United States", "Telecommunications", "478", 43, "NURTURE"],
      ["Owen Walsh", "Nimbus Platform", "New York, New York, United States", "Tech / SaaS", "318", 76, "PRIORITY"],
    ] as const
  ).map(([name, company, location, industry, headcount, score, badge], i) => ({
    id: `lead-${i + 3}`,
    name,
    title: "Product Manager",
    company,
    location,
    industry,
    headcount,
    score,
    routingBadge: badge,
    routingNote:
      badge === "NURTURE" ? "Nurture campaign · Unassigned (not MENA/APAC)" : `${badge} · Auto-routed`,
    scorecard: {
      icpFit: Math.min(99, score + 7),
      firmographics: Math.max(20, score - 8),
      intent: i % 3 === 0 ? null : Math.max(15, score - 15),
      engagement: i % 2 === 0 ? null : Math.max(12, score - 20),
      recency: i % 4 === 0 ? Math.max(30, score - 5) : null,
    },
    contact: {
      email: `${name.split(" ")[0].toLowerCase()}@${company.split(" ")[0].toLowerCase()}.com`,
      phone: "+1 ***-***-****",
      linkedin: "LinkedIn profile",
    },
    lineage: {
      originBrief: ORIGIN_BRIEF,
      qualified: "Auto-qualified · 30m ago",
      enrichment: "Enriched via Prospeo",
    },
    accountId:
      company === "Atlas Telecom"
        ? "acc-meridian"
        : company === "Northwind Labs"
          ? "acc-northwind"
          : `acc-${company.split(" ")[0].toLowerCase()}`,
  })),
];

// keep the unused import happy for emptyScorecard usage pattern reference
void emptyScorecard;

// ── Sequences ──────────────────────────────────────────────────────────────
// Softheon LinkedIn + Email sequences, verbatim from spec §6.3.
export const sequences: Sequence[] = [
  {
    accountId: "acc-softheon",
    byChannel: {
      linkedin: {
        window: "Day 0 → Day 12",
        touches: [
          {
            id: "t-li-0",
            channel: "linkedin",
            day: 0,
            type: "Connection note",
            state: "approved",
            inviteMode: "with-note",
            body: "Akshay — saw Softheon's Software Development announcement and your remit as Product Manager. Connecting with leaders in New York, New York, United States; would value your perspective.",
          },
          {
            id: "t-li-2",
            channel: "linkedin",
            day: 2,
            type: "Value DM",
            state: "draft",
            body: "Thanks for connecting, Akshay. Quick one — most Software Development teams we work with are wrestling with DCS migration timelines on brownfield assets. How's that landing for Softheon right now?",
          },
          {
            id: "t-li-6",
            channel: "linkedin",
            day: 6,
            type: "Proof DM",
            state: "draft",
            body: "Akshay — a comparable operator in your region cut DCS migration time by 60% and avoided a 14-day production hit. Worth a 20-min call to compare notes?",
          },
          {
            id: "t-li-12",
            channel: "linkedin",
            day: 12,
            type: "Break-up DM",
            state: "draft",
            body: "Akshay — closing the loop. Timing's not right, no worries. If Softheon enters a DCS review later this year, I'd be glad to share what we've seen at ADNOC and QatarEnergy.",
          },
        ],
      },
      email: {
        window: "Day 1 → Day 10",
        touches: [
          {
            id: "t-em-1",
            channel: "email",
            day: 1,
            type: "Intro email",
            state: "draft",
            body: "Hi Akshay,\n\nFollowing Softheon's recent Software Development push, I wanted to reach out. We help platform teams de-risk DCS migrations on brownfield estates without the usual production hit. Would a short comparison of approaches be useful?\n\nBest,\nAanya",
          },
          {
            id: "t-em-4",
            channel: "email",
            day: 4,
            type: "Value email",
            state: "draft",
            body: "Hi Akshay,\n\nOne pattern we keep seeing: migration timelines slip because cutover testing starts too late. We've packaged a phased approach that brought a peer operator's timeline down 60%. Happy to walk you through it.\n\nBest,\nAanya",
          },
          {
            id: "t-em-7",
            channel: "email",
            day: 7,
            type: "Proof email",
            state: "draft",
            body: "Hi Akshay,\n\nSharing a one-pager on how a comparable team avoided a 14-day production hit during their DCS migration. If Softheon is scoping similar work, the sequencing here may save you weeks.\n\nBest,\nAanya",
          },
          {
            id: "t-em-10",
            channel: "email",
            day: 10,
            type: "Break-up email",
            state: "draft",
            body: "Hi Akshay,\n\nI'll close the loop here — I know timing matters. If a DCS review lands on Softheon's roadmap this year, I'd be glad to compare notes on what's worked at ADNOC and QatarEnergy.\n\nBest,\nAanya",
          },
        ],
      },
    },
  },
];

// ── Campaigns + stats ───────────────────────────────────────────────────────
// Verbatim from spec §6.4.
export const campaignStats = { total: 4, running: 2, sent: 49, replied: 34, meetings: 32 };

export const campaigns: Campaign[] = [
  {
    id: "camp-softheon",
    name: "Softheon — Personalised Outreach",
    build: "personalisation",
    segment: "Help me find the Product Managers in New York city in Tech/SaaS",
    status: "running",
    channels: ["linkedin", "email"],
    accounts: 2,
    sent: 2,
    replied: 0,
    meetings: 0,
    updated: "just now",
  },
  {
    id: "camp-dcs",
    name: "DCS Modernisation — MENA Tier 2",
    build: "personalisation",
    segment: "Tier 2 — Oil & Gas — MENA",
    status: "running",
    channels: ["email", "linkedin"],
    accounts: 5,
    sent: 30,
    replied: 30,
    meetings: 30,
    updated: "21h ago",
  },
  {
    id: "camp-ot",
    name: "OT Cybersecurity Webinar Drive — KSA",
    build: "ai",
    segment: "Tier 1 — Oil & Gas — KSA",
    status: "paused",
    channels: ["email", "linkedin"],
    accounts: 3,
    sent: 9,
    replied: 1,
    meetings: 0,
    updated: "6d ago",
  },
  {
    id: "camp-safety",
    name: "Safety System — Renewal Expansion Q3",
    build: "manual",
    segment: "Existing accounts — safety-system install base",
    status: "completed",
    channels: ["email"],
    accounts: 2,
    sent: 8,
    replied: 3,
    meetings: 2,
    updated: "5d ago",
  },
];

export const personalisationQueueReady = 4;

// ── Home: attention queue, to-dos, notifications ─────────────────────────────
export const attentionItems: AttentionItem[] = [
  {
    id: "att-northwind",
    accountId: "acc-northwind",
    accountName: "Northwind Labs",
    triggerSummary: "New VP of Product hired 11 days ago — tooling stack in flux",
    score: 88,
    routingBadge: "PRIORITY",
    nextBestAction: "Call now — the warm intro window is open.",
    note: "New exec + 3 platform-engineering roles posted today means budget is forming right now.",
    cta: "Open call task",
    priority: "now",
    step: 3,
  },
  {
    id: "att-meridian",
    accountId: "acc-meridian",
    accountName: "Meridian Health Systems",
    triggerSummary: "Renewal window opens in 38 days · usage up 22% QoQ",
    score: 72,
    routingBadge: "ENGAGE",
    nextBestAction: "Send the prepared expansion sequence.",
    note: "Usage is up 22% QoQ with a renewal landing in 38 days — expansion is wide open.",
    cta: "Review sequence",
    priority: "wait",
    step: 3,
  },
  {
    id: "att-softheon",
    accountId: "acc-softheon",
    accountName: "Softheon",
    triggerSummary: "Software Development signal · vendor evaluation likely",
    score: 40,
    routingBadge: "NURTURE",
    nextBestAction: "Personalise the LinkedIn + Email sequence.",
    note: "A Software Development signal suggests a vendor evaluation is already underway.",
    cta: "Open in Workbook",
    priority: "wait",
    step: 3,
  },
];

export const todos: Todo[] = [
  { id: "todo-1", label: "Confirm channels for Softheon outreach", done: false },
  { id: "todo-2", label: "Review re-scored leads from this morning's pull", done: false },
  { id: "todo-3", label: "Book follow-up with Meridian champion", done: true },
];

export const notifications: Notification[] = [
  {
    id: "notif-1",
    kind: "reply",
    accountId: "acc-meridian",
    body: "Dana Whitfield replied to your Day 4 email — interested in timelines.",
    at: "12m ago",
  },
  {
    id: "notif-2",
    kind: "trigger",
    accountId: "acc-northwind",
    body: "New trigger fired: Northwind Labs posted 3 platform-engineering roles.",
    at: "1h ago",
  },
];

// Brief echo filters for Lead Research (spec §6.1)
export const briefFilters = [
  { label: "Role", value: "Product Manager" },
  { label: "Geo", value: "New York City" },
  { label: "Industry", value: "Tech/SaaS, Telecom" },
  { label: "Headcount", value: "201–500" },
];

// ── Recommendation stage (this prompt) ───────────────────────────────────────
// Qualified accounts bundled into segments by industry + buyer title + prior
// campaign response, each with three next-bests. Numbers are round + deterministic.

export const segments: Segment[] = [
  {
    id: "seg-saas",
    name: "Mid-market SaaS · NYC",
    accountIds: ["acc-softheon", "acc-ripplematch", "acc-latitude"],
    basis: "SaaS · PM · responded to the Product X campaign",
    nextBest: { product: "Security add-on", action: "discount_bundle" },
    baseRevenue: 248000,
    baseMarginPct: 31,
    discount: { minPct: 0, maxPct: 25, appliedPct: 12 },
    signals: [
      "All three replied to the Product X drip in the last 30 days.",
      "Shared buyer title (Product Manager) owns the security roadmap.",
      "A bundled security add-on lifts ACV without a new buying center.",
    ],
    analytics: { replyPct: 34, meetingPct: 12 },
  },
  {
    id: "seg-telecom",
    name: "Telecom · NYC",
    accountIds: ["acc-sightview", "acc-northway"],
    basis: "Telecom · Network ops · prior webinar attendee",
    nextBest: { product: "Network analytics upsell", action: "call" },
    baseRevenue: 162000,
    baseMarginPct: 38,
    signals: [
      "Both attended the network-analytics webinar.",
      "Segment converts on a 1:1 call far better than on a campaign.",
      "Sightview asked about pricing — high intent, time-sensitive.",
    ],
    analytics: { replyPct: 19, meetingPct: 22 },
  },
  {
    id: "seg-renewal",
    name: "Renewal-ready",
    accountIds: ["acc-meridian-networks", "acc-vantage"],
    basis: "Renewal ≤ 60 days · usage up QoQ",
    nextBest: { product: "Platform tier upgrade", action: "campaign_ab", partner: "Regional VAR" },
    baseRevenue: 196000,
    baseMarginPct: 34,
    abVariants: 3,
    signals: [
      "Renewal windows open in the next 44–52 days.",
      "Usage is trending up — a tier upgrade is well-timed.",
      "A Regional VAR partner is available to co-sell.",
    ],
    analytics: { replyPct: 27, meetingPct: 9 },
  },
];

/** Per-account inputs to the margin model. Discount segment Σ ≈ $248k; per-segment
 *  sums line up with each segment's baseRevenue so the Impact column reads true. */
export const marginInputs: MarginInputs[] = [
  // Mid-market SaaS · NYC (Σ $248k @ 31%)
  { accountId: "acc-softheon", dealSize: 110000, baseMarginPct: 31 },
  { accountId: "acc-ripplematch", dealSize: 78000, baseMarginPct: 31 },
  { accountId: "acc-latitude", dealSize: 60000, baseMarginPct: 31 },
  // Telecom · NYC (Σ $162k @ 38%)
  { accountId: "acc-sightview", dealSize: 95000, baseMarginPct: 38 },
  { accountId: "acc-northway", dealSize: 67000, baseMarginPct: 38 },
  // Renewal-ready (Σ $196k @ 34%)
  { accountId: "acc-meridian-networks", dealSize: 110000, baseMarginPct: 34 },
  { accountId: "acc-vantage", dealSize: 86000, baseMarginPct: 34 },
];

/** Seeded rules shown in the glass-box Rules tab; the rep adds more via save-as-rule. */
export const recommendationRules: Rule[] = [
  { id: "rule-seg", scope: "Segmentation", rule: "Bundle by industry + buyer title + prior campaign response.", source: "human" },
  { id: "rule-nb", scope: "Next-best action", rule: "Pick the highest-yield action by the segment's reply / meeting history.", source: "analytics" },
  { id: "rule-cap", scope: "Discount / bundle", rule: "Cap discount at 15%; anything above escalates for approval.", source: "human" },
  { id: "rule-src", scope: "Data sources", rule: "CRM firmographics + campaign engagement + win/loss history.", source: "human" },
];

/** Suggested rule changes shown in the Recommendations tab (Apply promotes to a rule). */
export const ruleSuggestions: Rule[] = [
  { id: "sug-telecom", scope: "Telecom · NYC", rule: "Telecom · NYC responds better to Call than Campaign — apply as the default action?", source: "analytics" },
  { id: "sug-renewal", scope: "Renewal-ready", rule: "Loop the Regional VAR partner in before the A/B campaign — partner-assisted renewals close 18% faster.", source: "analytics" },
];
