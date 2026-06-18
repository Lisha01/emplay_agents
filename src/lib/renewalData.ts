// Renewal book seed (telecom-flavoured SME, GBP) + posture metadata + formatters.
// Mock-only; no network. Mirrors the demand-gen mockData conventions.

import type {
  RenewalAccount,
  RenewalAlert,
  RenewalApproval,
  RenewalPosture,
  RenewalStrategy,
  RenewalTaskRow,
} from "./renewalTypes";

// ── Formatting (GBP, kept consistent across the workspace) ────────────────────
export const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;
export const gbpCompact = (n: number) =>
  n >= 1000 ? `£${(Math.round(n / 100) / 10).toString().replace(/\.0$/, "")}k` : `£${Math.round(n)}`;
/** Euro — used by the My Renewal Tasks board (which is in €). */
export const eur = (n: number) => `€${Math.round(n).toLocaleString("en-IE")}`;
/** Compact euro for dense lists — €770.4k / €1.18m. */
export const eurCompact = (n: number) =>
  n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(2)}m` : `€${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;

// ── Posture metadata (token-only colour; never hardcode a hex) ────────────────
export const POSTURE_META: Record<
  RenewalPosture,
  { label: string; chip: string; dot: string; bar: string }
> = {
  urgent: { label: "Urgent", chip: "bg-danger-bg text-danger", dot: "bg-danger", bar: "bg-danger" },
  watch: { label: "Watch", chip: "bg-warning-bg text-warning", dot: "bg-warning", bar: "bg-warning" },
  opportunity: { label: "Opportunity", chip: "bg-primary-subtle text-primary", dot: "bg-primary", bar: "bg-primary" },
  steady: { label: "Steady", chip: "bg-surface-muted text-muted", dot: "bg-muted", bar: "bg-success" },
};

export const POSTURE_ORDER: RenewalPosture[] = ["urgent", "watch", "opportunity", "steady"];

/** A renewal counts as high-risk if it's urgent or its churn score is high. */
export const isHighRisk = (a: RenewalAccount) => a.posture === "urgent" || a.churnRisk.score >= 70;

/** Renewed this cycle, before the rep does anything (a dashboard metric). */
export const RENEWED_THIS_MONTH = 7;

// ── My Renewal Tasks table (WHO · WHY · WHAT) ─────────────────────────────────
/** Strategy → chip tone (token colour only). */
export const STRATEGY_META: Record<RenewalStrategy, "danger" | "warning"> = {
  "Aggressive Defend": "danger",
  "Margin Protect": "warning",
  "High Risk Save": "danger",
  "Fix Billing Leakage": "warning",
};

export const renewalTaskRows: RenewalTaskRow[] = [
  { id: "rt-equinox", customer: "Equinox Logistics PLC", value: 770400, contactName: "Helena Voss", contactRole: "Group Procurement Lead", strategy: "Aggressive Defend", trigger: "Competitor risk", reason: "Competitor quote in play on 240 connections. Renewal at risk if not defended early.", product: "Support-led defend", offerPct: 10, call: "Script", campaign: "Save the renewal", play: "4-touch play", posture: "urgent", daysToExpiry: 19, renewalDate: "19 Jan 2026" },
  { id: "rt-vertex", customer: "Vertex Retail Group", value: 494400, contactName: "Sandra Okafor", contactRole: "Finance Business Partner", strategy: "Fix Billing Leakage", trigger: "Billing discrepancy", reason: "Risk 58/100 from an open billing dispute. Resolve the charge before any offer.", product: "Clean first, then renew", offerPct: 10, call: "Script", campaign: "Save the renewal", play: "3-touch play", posture: "watch", daysToExpiry: 29, renewalDate: "29 Jan 2026" },
  { id: "rt-shannon", customer: "Shannon AgriFoods Co-op", value: 201600, contactName: "Declan Moran", contactRole: "Operations Manager", strategy: "Margin Protect", trigger: "Usage decline", reason: "64 connections with API usage trending down. Right-size before the renewal.", product: "Downgrade + API plan", offerPct: 4.5, call: "Script", campaign: "", play: "3-touch", posture: "watch", daysToExpiry: 37, renewalDate: "06 Feb 2026" },
  { id: "rt-atlas", customer: "Atlas Construction Ltd", value: 1182000, contactName: "Marcus Reilly", contactRole: "IT & Operations Manager", strategy: "Margin Protect", trigger: "Margin decline", reason: "410 connections with blended margin slipping below the protected band.", product: "Downgrade + add-on", offerPct: 3, call: "Script", campaign: "Save the renewal", play: "4-touch play", posture: "urgent", daysToExpiry: 54, renewalDate: "23 Feb 2026" },
  { id: "rt-cftooling", customer: "C & F Tooling Ltd", value: 143368, contactName: "Gerard Fowler", contactRole: "Operations Director", strategy: "Margin Protect", trigger: "Contract expiry", reason: "Margin 37% sits below the target band on an expiring contract.", product: "Right-size the estate", offerPct: 3, call: "Script", campaign: "Bundle adoption push", play: "4-touch play", posture: "urgent", daysToExpiry: 120, renewalDate: "30 Apr 2026" },
  { id: "rt-galway", customer: "Galway Marine Services Ltd", value: 631200, contactName: "Fiona Gallagher", contactRole: "Procurement Director", strategy: "High Risk Save", trigger: "Competitor risk", reason: "Competitor quote in hand with a decision near. Defend with support, not price.", product: "Support-led defend", offerPct: 3, call: "Script", campaign: "Save the renewal", play: "4-touch play", posture: "urgent", daysToExpiry: 131, renewalDate: "11 May 2026" },
  { id: "rt-dublinport", customer: "Dublin Port Authority", value: 796800, contactName: "Tom Nolan", contactRole: "Head of ICT", strategy: "Margin Protect", trigger: "High support cost", reason: "280 connections on a support-heavy account. Convert overage to a plan.", product: "Convert overage to plan", offerPct: 12, call: "Script", campaign: "Enterprise warm-up", play: "3-touch play", posture: "watch", daysToExpiry: 190, renewalDate: "09 Jul 2026" },
  { id: "rt-titan", customer: "Titan Mining & Metals", value: 1056000, contactName: "Liam Donovan", contactRole: "Global IT & Operations Lead", strategy: "High Risk Save", trigger: "Margin decline", reason: "360 connections under cost review. Right-size and add value to hold margin.", product: "Downgrade + add-on", offerPct: 3, call: "Script", campaign: "Save the renewal", play: "4-touch play", posture: "urgent", daysToExpiry: 258, renewalDate: "15 Sep 2026" },
];

export const renewalAccounts: RenewalAccount[] = [
  // ── Equinox Logistics PLC — Urgent · new CFO + cheaper competitor (hero) ─────
  {
    id: "ren-equinox",
    customer: "Equinox Logistics PLC",
    segment: "Strategic · Transport & Logistics",
    currency: "EUR",
    lines: 240,
    contractStart: "01 May 2025",
    contractEnd: "19 Jan 2026",
    daysToExpiry: 19,
    value: 770400,
    products: ["Business connectivity", "240 connections"],
    blendedMargin: 41,
    baseMarginPct: 41,
    posture: "urgent",
    renewalStage: "Negotiation",
    tenureYears: 1,
    npsScore: 29,
    npsTrend: -12,
    satisfactionLabel: "Negative",
    npsTags: ["Price-sensitive after CFO change", "Questions ROI vs cheaper tools", "Wants stronger SLA"],
    npsPositive: "Dispatch team finds the product sticky for daily routing once onboarded.",
    npsNegative: "New cost-focused CFO + a cheaper competitor at €49/conn make this a live switch risk at first renewal.",
    accountOwner: "Priya Nair",
    readKeyword: "RESTRUCTURE",
    approvalRisk: 64,
    savingOpportunity: 78,
    forecastRenewalValue: 693360,
    lastEngagement: "6 days ago · email from Daniel",
    nextEngagement: "Within 3 days · CFO value call",
    pendingActions: ["Book value-defence session with CFO", "Prepare support/SLA differentiation pack"],
    insights: {
      competitor: { name: "Velocity Freight Cloud", product: "Velocity TMS Lite", theirPrice: 49, ourPrice: 268, source: "Logistics Tech Wire · 24 Feb 2026", sourceUrl: "https://www.ofcom.org.uk/phones-and-broadband/coverage-and-speeds/connected-nations", switchingRiskPct: 78, vulnerabilityPct: 78 },
      usage: { healthScore: 72, overageMonthly: 978, planFit: 78, yoyVolumePct: -4.58, premiumConnections: 18 },
      sentiment: { csatPct: 28, tickets: 24, complaints: 9, serviceIssues: 8, escalations: 2, callsNote: "Recent calls carry frustration on price and unresolved issues.", emailNote: "Email threads show rising impatience as goodwill slips." },
      billing: {
        exposureYr: 50484, found: 4, highSeverity: 2, renewalEffectPts: -9,
        issues: [
          { title: "Products charged separately instead of bundled", scope: "31 connections", monthly: 1926, severity: "High" },
          { title: "Charge for something not subscribed", scope: "22 connections", monthly: 1284, severity: "High" },
          { title: "Contract vs billing data mismatch", scope: "12 connections", monthly: 642, severity: "Medium" },
          { title: "Different roaming rates being applied", scope: "Roaming", monthly: 355, severity: "Low" },
        ],
      },
      dataSources: [
        { label: "Identity & contract", source: "CRM · contract system" },
        { label: "Risk & churn score", source: "Renewal model (glass-box)" },
        { label: "Competitor evidence", source: "Logistics Tech Wire · 24 Feb 2026" },
        { label: "Billing discrepancies", source: "Billing-vs-contract scan" },
        { label: "Usage & overage", source: "Usage telemetry" },
        { label: "NPS / CSAT & sentiment", source: "Survey + call/email analysis" },
      ],
    },
    contacts: [
      { name: "Sarah Lynch", role: "CFO (new decision-maker)", stance: "detractor", changeNote: "New since Nov — cost-cutting mandate" },
      { name: "Daniel Hughes", role: "Head of Operations", stance: "supporter", changeNote: "Signed the first deal; influence diluted" },
      { name: "Mark Whelan", role: "Dispatch Lead (user)", stance: "neutral" },
    ],
    changesOverTime: [
      { date: "2025", who: "Daniel Hughes", event: "Head of Operations — signed the first 12-month deal.", kind: "added" },
      { date: "Nov 2025", who: "Sarah Lynch", event: "New CFO joined post-restructure — cost-cutting mandate.", kind: "added" },
      { date: "Jan 2026", who: "Daniel Hughes", event: "Influence diluted — CFO now leads vendor decisions.", kind: "changed" },
    ],
    contractHistory: [
      { period: "May 2025 → May 2026", value: 286000, products: "Business · 240 connections", outcome: "First term — up for first renewal", discountPct: 5, connections: 240 },
    ],
    openIssues: ["Competitor quote circulating internally", "CFO disputes per-connection value"],
    competitiveThreat: {
      summary: "Velocity Freight Cloud is pitching 240 connections at €49/conn vs our €268; the quote is circulating with the new CFO.",
      severity: "urgent",
      sourceLabel: "Logistics Tech Wire · 24 Feb 2026",
      sourceUrl: "https://www.ofcom.org.uk/phones-and-broadband/coverage-and-speeds/connected-nations",
    },
    usage: {
      arpu: 268,
      avgConsumption: "240 active connections · daily dispatch routing",
      mix: [
        { label: "Connectivity", pct: 78 },
        { label: "Support & SLA", pct: 14 },
        { label: "Add-ons", pct: 8 },
      ],
      adoptionGaps: ["SLA tier under-used vs need", "No analytics add-on despite heavy routing"],
    },
    costStack: [
      { label: "Network & connectivity", monthly: 34000 },
      { label: "Support & service", monthly: 9800 },
      { label: "Onboarding & success", monthly: 3200 },
    ],
    cpiImpactPct: 3.9,
    handsetSubsidyMonthly: 0,
    clv: 2300000,
    costToServeMonthly: 47000,
    churnRisk: {
      label: "Churn risk",
      score: 64,
      suffix: "/100",
      why: "High — new cost-focused CFO, diluted champion, NPS down 12, and a competitor at €49/conn, 19 days out. Rule R-31: a cheaper rival + a new cost-focused buyer at first renewal is a top-band switch risk.",
    },
    expansionPotential: {
      label: "Expansion potential",
      score: 22,
      suffix: "/100",
      why: "Low — defend the base first; no expansion until the relationship is re-secured.",
    },
    riskScores: [
      { label: "Switching risk", score: 78, suffix: "/100", why: "Cheaper credible competitor + cost-focused CFO + first-renewal timing." },
      { label: "Price sensitivity", score: 81, suffix: "/100", why: "CFO disputes per-connection value and is benchmarking against €49/conn." },
    ],
    recommendedMove: {
      action: "make_offer",
      label: "Defend on support, not price",
      cta: "Make offer",
      whyText:
        "Defend the base: a discount that holds margin plus an SLA/support story gives Equinox a credible reason to stay against the €49/conn competitor — lead with a CFO value call, follow with a value-led email naming the 19-day deadline.",
      ruleId: "R-31",
      ruleText: "When a cheaper competitor and a new cost-focused buyer coincide near renewal, defend on value with a margin-holding discount, not a price match.",
      opensTab: "economics",
    },
    offer: { minPct: 0, maxPct: 25, capPct: 8, appliedPct: 10 },
    economics: {
      connections: 240,
      connectionMix: "182 phones · 18 MBB · 40 M2M",
      arpu: 267.5,
      ampu: 109.68,
      approvalNote: "A 8% discount sits inside the under-20% self-approval band and margin holds at 41% — no escalation required.",
      annualRevenue: 770400,
      revenueYoYPct: -4.58,
      annualCost: 454536,
      grossProfit: 315864,
      grossMarginPct: 41,
      subsidyDrag: 21000,
      subsidyDragPts: -3,
      netMarginPct: 38,
      netProfit: 294864,
      products: [
        { name: "Voice (mobile access + calls)", color: "bg-primary", marginPct: 42, rev: 368463, cost: 213658, profit: 154805 },
        { name: "Data & MBB", color: "bg-info", marginPct: 45, rev: 143444, cost: 78875, profit: 64569 },
        { name: "Roaming", color: "bg-success", marginPct: 30, rev: 35545, cost: 24876, profit: 10669 },
        { name: "SMS & MMS", color: "bg-warning", marginPct: 60, rev: 30585, cost: 12231, profit: 18354 },
        { name: "Devices (handsets)", color: "bg-danger", marginPct: 18, rev: 101302, cost: 83048, profit: 18254 },
        { name: "Bundles", color: "bg-primary/60", marginPct: 50, rev: 66579, cost: 33282, profit: 33297 },
        { name: "Add-ons (VAS)", color: "bg-info/60", marginPct: 65, rev: 24482, cost: 8569, profit: 15913 },
      ],
      scores: [
        { label: "Renewal propensity", score: 71, band: "Strong", summary: "Equinox likely to renew with light touch.", why: "Starts at 100, −44.8 for risk (64×0.7) and +15.6 for potential (78×0.2) = 70.8, rounding to 71/100." },
        { label: "Expansion potential", score: 78, band: "Strong", summary: "Equinox strong headroom to grow value at renewal.", why: "Mirrors the potential score (78/100): 240 connections with an 8% saving target leaves upsell / cross-sell headroom." },
        { label: "Margin health", score: 66, band: "Moderate", summary: "Tracking in the middle — below the margin floor — approval exposure.", why: "Proposed margin 41% ×1.6 = 65.6, rounding to 66/100; the 40% policy floor maps to 64/100, so anything below that flags approval exposure." },
        { label: "Renewal risk", score: 64, band: "Weak", summary: "Equinox high risk — escalate and de-risk early.", why: "The raw risk score 64/100 — built from the Deal Desk approval route, 41% margin and churn signals. Lower is better here." },
        { label: "Time urgency", score: 79, band: "Weak", summary: "Equinox renews soon — act now.", why: "19 days to renewal ×1.1 = 20.9 subtracted from 100 = 79.1, rounding to 79/100; fewer days push urgency higher." },
        { label: "Price sensitivity", score: 48, band: "Moderate", summary: "Discount-led — guard margin in negotiation.", why: "Proposed discount 8% ×6 = 48.0, rounding to 48/100. Lower is better here." },
        { label: "Product fit", score: 78, band: "Strong", summary: "Equinox plans match usage well.", why: "The tariff-fit signal 78/100 across 240 connections (18 MBB · 40 M2M) — how closely plans match real usage." },
        { label: "Engagement", score: 100, band: "Strong", summary: "Equinox actively engaged in the renewal.", why: "Base 40 + 3 round(s) ×16 +12 (renews in under 30 days) = 100.0, rounding to 100/100." },
      ],
      saving: {
        total: 191059,
        cycles: [
          { year: "2023", type: "Discount", amount: 36979, note: "12% account discount applied at last renewal." },
          { year: "2024", type: "Bundled", amount: 24653, note: "Bundle migration removed out-of-bundle leakage." },
          { year: "2024", type: "Cost optimisation", amount: 30816, note: "Right-sized over-provisioned plans to actual usage." },
          { year: "2025", type: "Negotiated", amount: 43142, note: "Mid-term renegotiation held rental flat against list increases." },
          { year: "2026", type: "Optimisation", amount: 55469, note: "Proposed renewal saving (8% of spend) at this cycle." },
        ],
        notes: [
          "Hardware fund / BDF of 42,000 committed over the term.",
          "Cumulative commercial benefit of ~191,059 across the relationship.",
          "Out-of-bundle leakage reduced toward zero through bundle migration.",
        ],
      },
    },
    campaign: {
      rule: "Save the renewal",
      ruleDesc: "Lead with a call; run the save the renewal play.",
      lead: "Sequence leads with Call.",
      touches: [
        { day: 1, channel: "Call", title: "Competitor response call", detail: "Walk the committee through like-for-like value." },
        { day: 7, channel: "Call", title: "Decision call", detail: "Confirm terms before the 19-day clock runs out." },
        { day: 0, channel: "Email", title: "Our best support-led renewal", detail: "Lead with the support add-on and the 24-month onboarding credit." },
        { day: 4, channel: "LinkedIn", title: "Quick nudge", detail: "Share the support battlecard one-pager." },
      ],
    },
    recommendationDetail: {
      reason: "Competitor quote in play on 240 connections; an 8% discount lands margin at a tight 41% — defend on support, not price, within 19 days.",
      signals: ["Renewal signal", "Competitive switch risk"],
      context: "Renews in 19 days. Customer has shared a competitor quote and wants a 24-month term with a refreshed onboarding credit. High support-usage base across European depots.",
      headline: "Defend the account with a targeted 10% renewal offer — don't start a price war.",
      steps: [
        "Lead on value, not price: stack our service quality, the 240-connection support footprint and the cost of switching against Velocity Freight Cloud's cheaper entrant.",
        "Put a 10% discount on the table — it holds a 40.3% margin and gives Equinox a credible reason to stay.",
        "That 10% needs Deal Desk sign-off — run the numbers below and submit it for approval before you commit to the customer.",
        "Follow up with a defend email that leads on value and names the renewal deadline.",
      ],
      signoffNote: "10% off lands a 40.3% margin — workable but thin, leaving €23,285/mo profit. You're giving away €77,040/yr, so expect scrutiny. Bring the usage and right-sizing justification to the approval.",
      evidence: [
        { label: "Risk & margin", value: "64/100 · 41%", note: "1 pt of headroom — Deal Desk route." },
        { label: "Tenure & relationship", value: "1 year", note: "Not a strategic partner — only 1 year in (since 2025), so switching cost is low and churn odds rise." },
        { label: "Satisfaction", value: "NPS 29", note: "Down 12 pts over the trend — eroding goodwill adds to renewal risk." },
        { label: "Renewal clock", value: "19 days", note: "Renews 19 Jan 2026; act this week across 240 connections." },
      ],
    },
    performanceNote: "Service delivery solid; the dispatch team relies on it daily — the risk is commercial, not technical.",
  },

  // ── Brightwave Logistics — Watch · competitor quote spotted ─────────────────
  {
    id: "ren-brightwave",
    customer: "Brightwave Logistics",
    segment: "Logistics · SME",
    lines: 45,
    contractStart: "01 Jul 2022",
    contractEnd: "09 Jul 2026",
    daysToExpiry: 22,
    value: 38000,
    products: ["Mobile voice & data", "Roaming pack", "4G routers"],
    blendedMargin: 21,
    baseMarginPct: 21,
    posture: "watch",
    renewalStage: "Renewal due",
    tenureYears: 4,
    npsScore: 42,
    satisfactionLabel: "Satisfied — stable usage",
    contacts: [
      { name: "Dawn Whitfield", role: "Operations Director", changeNote: "Long-standing — your main sponsor", stance: "supporter" },
      { name: "Raj Patel", role: "Finance Manager", changeNote: "New since Mar — comparing the market", stance: "detractor" },
    ],
    contractHistory: [
      { period: "2018–2022", value: 31000, products: "Voice & data", outcome: "Renewed +4%" },
      { period: "2022–2026", value: 38000, products: "+ Roaming, 4G routers", outcome: "Upsold roaming" },
    ],
    openIssues: ["One billing query on roaming bundle (resolved)"],
    competitiveThreat: {
      summary: "Brightwave's finance manager requested a competitor quote; a rival is pitching a 45-line plan ~8% below current.",
      severity: "watch",
      sourceLabel: "Ofcom — SME mobile market review 2024",
      sourceUrl: "https://www.ofcom.org.uk/phones-and-broadband/coverage-and-speeds/connected-nations",
    },
    usage: {
      arpu: 70,
      avgConsumption: "8.4 GB data · 320 min voice / line",
      mix: [
        { label: "Voice & data", pct: 64 },
        { label: "Roaming", pct: 26 },
        { label: "Devices", pct: 10 },
      ],
      adoptionGaps: ["Mobile device management unused", "Only 38% on the roaming pack they pay for"],
    },
    costStack: [
      { label: "Network & data", monthly: 1450 },
      { label: "Roaming", monthly: 520 },
      { label: "Devices / handsets", monthly: 410 },
      { label: "Support & service", monthly: 240 },
    ],
    cpiImpactPct: 3.9,
    handsetSubsidyMonthly: 410,
    clv: 168000,
    costToServeMonthly: 2620,
    churnRisk: {
      label: "Churn risk",
      score: 48,
      suffix: "/100",
      why: "Moderate — a new finance contact is shopping the market, but usage is stable and the sponsor is loyal. Rule R-12: a competitor-quote signal raises risk one band.",
    },
    expansionPotential: {
      label: "Expansion potential",
      score: 55,
      suffix: "/100",
      why: "Roaming adoption is low (38%) and MDM is unused — a bundled roaming offer both defends and grows the account.",
    },
    riskScores: [
      { label: "Price sensitivity", score: 62, suffix: "/100", why: "Finance-led review + a sub-market rival quote." },
      { label: "Relationship strength", score: 74, suffix: "/100", why: "4-year tenure, loyal operations sponsor, low complaint volume." },
    ],
    recommendedMove: {
      action: "make_offer",
      label: "Renew at 6% uplift, bundle roaming",
      cta: "Make offer",
      whyText:
        "Defends against the competitor quote while still protecting margin: a 6% uplift offsets CPI, and bundling roaming raises stickiness on a pack they under-use.",
      ruleId: "R-12",
      ruleText: "When a competitor quote is detected on a Watch account, lead with a modest uplift + a bundle, not a discount.",
      opensTab: "economics",
    },
    offer: { minPct: 0, maxPct: 20, capPct: 10, appliedPct: 6 },
    performanceNote: "Service delivery on target; 99.4% uptime, 2 tickets in 12 months, both resolved < 1 day.",
  },

  // ── Coastline Retail Group — Urgent · billing dispute, high churn ────────────
  {
    id: "ren-coastline",
    customer: "Coastline Retail Group",
    segment: "Retail · SME",
    lines: 78,
    contractStart: "12 Jun 2023",
    contractEnd: "29 Jun 2026",
    daysToExpiry: 12,
    value: 61000,
    products: ["Mobile voice & data", "POS connectivity", "International calling"],
    blendedMargin: 17,
    baseMarginPct: 17,
    posture: "urgent",
    renewalStage: "At risk — dispute open",
    tenureYears: 3,
    npsScore: 21,
    satisfactionLabel: "Frustrated — open billing dispute",
    contacts: [
      { name: "Marcus Lwhere", role: "IT Manager", changeNote: "Escalated the dispute twice", stance: "neutral" },
      { name: "Sofia Almeida", role: "CFO", changeNote: "New since Jan — cost-focused, wants the dispute closed", stance: "detractor" },
    ],
    contractHistory: [
      { period: "2020–2023", value: 54000, products: "Voice & data, POS", outcome: "Renewed flat" },
      { period: "2023–2026", value: 61000, products: "+ International calling", outcome: "Upsold international" },
    ],
    openIssues: [
      "£3,200 billing dispute on duplicated POS line charges (open 6 weeks)",
      "Two unresolved escalations on international call rates",
    ],
    competitiveThreat: {
      summary: "No active rival quote yet, but the CFO has signalled they'll go to market if the dispute isn't resolved before renewal.",
      severity: "urgent",
      sourceLabel: "Internal — CFO call notes (14 Jun)",
      sourceUrl: "https://www.ofcom.org.uk/phones-and-broadband/saving-money/treating-customers-fairly",
    },
    billingDiscrepancy: {
      summary: "Duplicated POS connectivity line charged across 6 invoices; customer withholding payment until corrected.",
      amount: 3200,
      marginImpactPts: 4,
    },
    usage: {
      arpu: 65,
      avgConsumption: "6.1 GB data · 540 min voice / line",
      mix: [
        { label: "Voice & data", pct: 58 },
        { label: "POS connectivity", pct: 28 },
        { label: "International", pct: 14 },
      ],
      adoptionGaps: ["International calling under-used vs spend", "No fraud-protection add-on"],
    },
    costStack: [
      { label: "Network & data", monthly: 2300 },
      { label: "POS connectivity", monthly: 980 },
      { label: "International", monthly: 640 },
      { label: "Support & service", monthly: 520 },
    ],
    cpiImpactPct: 3.9,
    handsetSubsidyMonthly: 690,
    clv: 214000,
    costToServeMonthly: 4440,
    churnRisk: {
      label: "Churn risk",
      score: 82,
      suffix: "/100",
      why: "High — open dispute, a new cost-focused CFO, low NPS (21), and renewal in 12 days. Rule R-03: an unresolved billing dispute inside 30 days of expiry is a top-band churn risk.",
    },
    expansionPotential: {
      label: "Expansion potential",
      score: 24,
      suffix: "/100",
      why: "Low while trust is damaged — resolve the dispute before any cross-sell.",
    },
    riskScores: [
      { label: "Dispute exposure", score: 88, suffix: "/100", why: "£3,200 withheld; margin −4 pts until corrected." },
      { label: "Sentiment", score: 79, suffix: "/100", why: "Two escalations, NPS 21, CFO patience thin." },
    ],
    recommendedMove: {
      action: "open_dispute",
      label: "Resolve billing dispute before offer",
      cta: "Open dispute",
      whyText:
        "An offer now will be rejected — the CFO has tied renewal to closing the £3,200 dispute. Correct the duplicated charge first, then renew from a position of trust.",
      ruleId: "R-03",
      ruleText: "Never make a renewal offer over an open billing dispute inside 30 days of expiry — resolve first.",
      opensTab: "risk",
    },
    offer: { minPct: 0, maxPct: 20, capPct: 10, appliedPct: 0 },
    performanceNote: "Delivery solid pre-dispute; the relationship damage is commercial, not technical.",
  },

  // ── Meridian Health Clinics — Opportunity · expansion-ready ──────────────────
  {
    id: "ren-meridian",
    customer: "Meridian Health Clinics",
    segment: "Healthcare · SME",
    lines: 34,
    contractStart: "20 May 2023",
    contractEnd: "27 Jul 2026",
    daysToExpiry: 40,
    value: 24000,
    products: ["Mobile voice & data", "Secure messaging"],
    blendedMargin: 28,
    baseMarginPct: 28,
    posture: "opportunity",
    renewalStage: "Renewal upcoming",
    tenureYears: 3,
    npsScore: 68,
    satisfactionLabel: "Promoter — opening new sites",
    contacts: [
      { name: "Dr. Helen Voss", role: "Practice Director", changeNote: "Champion — expanding to 3 new clinics", stance: "supporter" },
      { name: "Tom Bridges", role: "Office Manager", changeNote: "Day-to-day contact", stance: "neutral" },
    ],
    contractHistory: [
      { period: "2020–2023", value: 19000, products: "Voice & data", outcome: "Renewed +6%" },
      { period: "2023–2026", value: 24000, products: "+ Secure messaging", outcome: "Upsold secure messaging" },
    ],
    openIssues: [],
    usage: {
      arpu: 59,
      avgConsumption: "5.2 GB data · 280 min voice / line",
      mix: [
        { label: "Voice & data", pct: 72 },
        { label: "Secure messaging", pct: 28 },
      ],
      adoptionGaps: ["No mobile device lines for the 3 new clinics yet"],
    },
    costStack: [
      { label: "Network & data", monthly: 780 },
      { label: "Secure messaging", monthly: 220 },
      { label: "Support & service", monthly: 160 },
    ],
    cpiImpactPct: 3.9,
    handsetSubsidyMonthly: 180,
    clv: 132000,
    costToServeMonthly: 1160,
    churnRisk: {
      label: "Churn risk",
      score: 14,
      suffix: "/100",
      why: "Very low — promoter NPS (68), zero open issues, and an actively expanding footprint.",
    },
    expansionPotential: {
      label: "Expansion potential",
      score: 86,
      suffix: "/100",
      why: "Three new clinics opening need device lines; the champion has already asked about adding them. Rule R-21: a promoter opening sites is a prime expansion trigger.",
    },
    riskScores: [
      { label: "Adoption health", score: 81, suffix: "/100", why: "Secure messaging well adopted; strong product fit." },
    ],
    recommendedMove: {
      action: "build_offer",
      label: "Expansion offer: +12 device lines",
      cta: "Build offer",
      whyText:
        "Meridian is opening three clinics and the champion has asked about more lines — lead the renewal with a +12-line expansion at the current healthy margin rather than a flat renewal.",
      ruleId: "R-21",
      ruleText: "When a promoter is opening new sites, lead the renewal with an expansion offer, not a flat renewal.",
      opensTab: "economics",
    },
    offer: { minPct: 0, maxPct: 15, capPct: 10, appliedPct: 0 },
    performanceNote: "Excellent — 100% uptime, fastest-resolving account in the book.",
  },

  // ── Northgate Manufacturing — over-cap discount → Approvals ──────────────────
  {
    id: "ren-northgate",
    customer: "Northgate Manufacturing",
    segment: "Manufacturing · SME",
    lines: 64,
    contractStart: "03 Aug 2022",
    contractEnd: "06 Jul 2026",
    daysToExpiry: 19,
    value: 52000,
    products: ["Mobile voice & data", "IoT connectivity", "Devices"],
    blendedMargin: 16,
    baseMarginPct: 16,
    posture: "watch",
    renewalStage: "In negotiation",
    tenureYears: 4,
    npsScore: 38,
    satisfactionLabel: "Neutral — price-driven",
    contacts: [
      { name: "Ian Forsythe", role: "Procurement Lead", changeNote: "Hard negotiator — wants 18% off", stance: "detractor" },
      { name: "Grace Liu", role: "Operations Manager", changeNote: "Cares about IoT reliability", stance: "supporter" },
    ],
    contractHistory: [
      { period: "2018–2022", value: 47000, products: "Voice & data", outcome: "Renewed flat" },
      { period: "2022–2026", value: 52000, products: "+ IoT connectivity", outcome: "Upsold IoT" },
    ],
    openIssues: ["Procurement pushing for 18% discount to match a framework rate"],
    competitiveThreat: {
      summary: "Procurement is citing a public-sector framework rate to justify an 18% discount ask.",
      severity: "watch",
      sourceLabel: "Crown Commercial Service — Network Services framework",
      sourceUrl: "https://www.crowncommercial.gov.uk/agreements/RM6116",
    },
    usage: {
      arpu: 68,
      avgConsumption: "7.0 GB data · 410 min voice / line",
      mix: [
        { label: "Voice & data", pct: 60 },
        { label: "IoT connectivity", pct: 28 },
        { label: "Devices", pct: 12 },
      ],
      adoptionGaps: ["IoT SIM utilisation at 71% of provisioned"],
    },
    costStack: [
      { label: "Network & data", monthly: 1900 },
      { label: "IoT connectivity", monthly: 760 },
      { label: "Devices / handsets", monthly: 520 },
      { label: "Support & service", monthly: 360 },
    ],
    cpiImpactPct: 3.9,
    handsetSubsidyMonthly: 520,
    clv: 196000,
    costToServeMonthly: 3540,
    churnRisk: {
      label: "Churn risk",
      score: 58,
      suffix: "/100",
      why: "Moderate–high — purely price-driven, with a framework rate cited. Relationship is functional, not loyal.",
    },
    expansionPotential: {
      label: "Expansion potential",
      score: 44,
      suffix: "/100",
      why: "IoT utilisation has room, but procurement won't expand until price is settled.",
    },
    riskScores: [
      { label: "Margin exposure", score: 84, suffix: "/100", why: "An 18% ask is 6 pts over the 12% protected cap → −margin into the red." },
    ],
    recommendedMove: {
      action: "send_approval",
      label: "18% ask is over your 12% cap — send for approval",
      cta: "Send for approval",
      whyText:
        "Procurement wants 18% to match a framework rate, but that breaches your 12% protected-margin cap. Hold the line at the cap or route the 18% for sign-off — don't concede it in the room.",
      ruleId: "R-07",
      ruleText: "Any discount above the protected-margin cap must route to Approvals before it can be offered.",
      opensTab: "economics",
    },
    offer: { minPct: 0, maxPct: 25, capPct: 12, appliedPct: 18 },
    performanceNote: "Delivery reliable; IoT uptime 99.6%. The friction is commercial.",
  },

  // ── Pinnacle Travel Co. — Watch · roaming-heavy, CPI, usage anomaly ──────────
  {
    id: "ren-pinnacle",
    customer: "Pinnacle Travel Co.",
    segment: "Travel · SME",
    lines: 41,
    contractStart: "15 Jul 2022",
    contractEnd: "20 Jul 2026",
    daysToExpiry: 33,
    value: 29000,
    products: ["Mobile voice & data", "Global roaming", "International calling"],
    blendedMargin: 19,
    baseMarginPct: 19,
    posture: "watch",
    renewalStage: "Renewal due",
    tenureYears: 4,
    npsScore: 51,
    satisfactionLabel: "Satisfied — roaming-dependent",
    contacts: [
      { name: "Elena Rossi", role: "Travel Operations Lead", changeNote: "Relies on reliable global roaming", stance: "supporter" },
      { name: "Mark Doyle", role: "Finance Business Partner", changeNote: "Watching the CPI uplift closely", stance: "neutral" },
    ],
    contractHistory: [
      { period: "2018–2022", value: 25000, products: "Voice & data, roaming", outcome: "Renewed +5%" },
      { period: "2022–2026", value: 29000, products: "+ International calling", outcome: "Renewed +CPI" },
    ],
    openIssues: ["Roaming data spike in May (+38%) flagged for review"],
    competitiveThreat: {
      summary: "No rival quote; risk is internal — a CPI-driven uplift could prompt a market check given roaming-heavy spend.",
      severity: "watch",
      sourceLabel: "ONS — Consumer Prices Index (CPI) annual rate",
      sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices",
    },
    usage: {
      arpu: 59,
      avgConsumption: "11.2 GB data · 260 min voice / line",
      mix: [
        { label: "Roaming", pct: 44 },
        { label: "Voice & data", pct: 41 },
        { label: "International", pct: 15 },
      ],
      adoptionGaps: ["No roaming-cap controls enabled — exposed to bill shock"],
    },
    costStack: [
      { label: "Roaming", monthly: 1080 },
      { label: "Network & data", monthly: 900 },
      { label: "International", monthly: 360 },
      { label: "Support & service", monthly: 180 },
    ],
    cpiImpactPct: 3.9,
    handsetSubsidyMonthly: 240,
    clv: 142000,
    costToServeMonthly: 2520,
    churnRisk: {
      label: "Churn risk",
      score: 46,
      suffix: "/100",
      why: "Moderate — happy with service but CPI-sensitive on a roaming-heavy bill. Rule R-15: roaming-heavy + CPI exposure warrants a protective clause.",
    },
    expansionPotential: {
      label: "Expansion potential",
      score: 40,
      suffix: "/100",
      why: "Roaming-cap controls would add value and reduce bill-shock risk, but limited net-new spend.",
    },
    riskScores: [
      { label: "Usage anomaly", score: 57, suffix: "/100", why: "May roaming +38% vs baseline — verify before renewal so the offer reflects true usage." },
      { label: "CPI sensitivity", score: 63, suffix: "/100", why: "Finance partner is tracking the uplift on a roaming-weighted bill." },
    ],
    recommendedMove: {
      action: "make_offer",
      label: "Renew flat + add a CPI clause",
      cta: "Make offer",
      whyText:
        "Pinnacle values service but is CPI-sensitive on a roaming-heavy bill. A flat renewal with a transparent CPI clause protects future margin without a discount fight now.",
      ruleId: "R-15",
      ruleText: "For roaming-heavy, CPI-sensitive accounts, renew flat with an explicit CPI clause rather than discounting.",
      opensTab: "economics",
    },
    offer: { minPct: 0, maxPct: 20, capPct: 10, appliedPct: 0 },
    performanceNote: "Good — roaming reliability strong across 30+ countries; one usage spike under review.",
  },

  // ── Harbor Freight Partners — Steady · auto-renew ────────────────────────────
  {
    id: "ren-harbor",
    customer: "Harbor Freight Partners",
    segment: "Freight · SME",
    lines: 22,
    contractStart: "08 Aug 2023",
    contractEnd: "16 Aug 2026",
    daysToExpiry: 60,
    value: 18000,
    products: ["Mobile voice & data"],
    blendedMargin: 31,
    baseMarginPct: 31,
    posture: "steady",
    renewalStage: "Renewal upcoming",
    tenureYears: 3,
    npsScore: 60,
    satisfactionLabel: "Content — low-touch",
    contacts: [
      { name: "Priya Nair", role: "Office Manager", changeNote: "Single low-touch contact", stance: "neutral" },
    ],
    contractHistory: [
      { period: "2020–2023", value: 16000, products: "Voice & data", outcome: "Renewed +CPI" },
      { period: "2023–2026", value: 18000, products: "Voice & data", outcome: "Renewed flat" },
    ],
    openIssues: [],
    usage: {
      arpu: 68,
      avgConsumption: "4.0 GB data · 210 min voice / line",
      mix: [{ label: "Voice & data", pct: 100 }],
      adoptionGaps: ["No add-ons — simple, healthy account"],
    },
    costStack: [
      { label: "Network & data", monthly: 760 },
      { label: "Support & service", monthly: 90 },
    ],
    cpiImpactPct: 3.9,
    handsetSubsidyMonthly: 110,
    clv: 96000,
    costToServeMonthly: 850,
    churnRisk: {
      label: "Churn risk",
      score: 9,
      suffix: "/100",
      why: "Minimal — healthy margin, content contact, no issues, plenty of runway to expiry.",
    },
    expansionPotential: {
      label: "Expansion potential",
      score: 18,
      suffix: "/100",
      why: "Low — a simple single-product account with no growth signals right now.",
    },
    riskScores: [
      { label: "Account health", score: 12, suffix: "/100", why: "All-green; lowest-risk account in the book." },
    ],
    recommendedMove: {
      action: "confirm",
      label: "Auto-renew, monitor",
      cta: "Confirm",
      whyText:
        "Healthy margin, content customer, 60 days of runway and no signals — confirm the auto-renew and keep monitoring. Spend your time on the at-risk accounts.",
      ruleId: "R-01",
      ruleText: "Steady accounts with >45 days runway and no signals auto-renew; confirm and monitor.",
      opensTab: "summary",
    },
    offer: { minPct: 0, maxPct: 15, capPct: 10, appliedPct: 0 },
    performanceNote: "Excellent and effortless — zero tickets in 12 months.",
  },
];

// ── My Renewal Tasks board, derived from the canonical telecom book ───────────
// The board renders the same accounts the workspace opens, so "View in detail" maps
// 1:1 to a deep RenewalAccount (no id mismatch). Strategy/trigger are derived from the
// account's signals — the single source of truth, not a parallel dataset.
const strategyFor = (a: RenewalAccount): RenewalStrategy => {
  if (a.billingDiscrepancy) return "Fix Billing Leakage";
  if (a.posture === "urgent" || a.churnRisk.score >= 70) return "High Risk Save";
  if (a.competitiveThreat) return "Aggressive Defend";
  return "Margin Protect";
};
const triggerFor = (a: RenewalAccount): string => {
  if (a.billingDiscrepancy) return "Billing dispute";
  if (a.offer.appliedPct > a.offer.capPct) return "Margin decline";
  if (a.competitiveThreat) return "Competitor risk";
  if (a.daysToExpiry <= 30) return "Contract expiry";
  return "Renewal upcoming";
};

export const accountsAsTaskRows = (): RenewalTaskRow[] =>
  renewalAccounts.map((a) => ({
    id: a.id,
    customer: a.customer,
    value: a.value,
    contactName: a.contacts[0]?.name ?? "—",
    contactRole: a.contacts[0]?.role ?? "",
    strategy: strategyFor(a),
    trigger: triggerFor(a),
    reason: a.recommendedMove.whyText,
    product: a.recommendedMove.label,
    offerPct: a.offer.appliedPct,
    call: "Script",
    campaign: a.recommendedMove.cta,
    play: "Renewal play",
    posture: a.posture,
    daysToExpiry: a.daysToExpiry,
    renewalDate: a.contractEnd,
    currency: a.currency ?? "GBP",
  }));

// Northgate's over-cap ask is already routed to Approvals at seed time.
export const seedApprovals: RenewalApproval[] = [
  {
    id: "rapp-northgate",
    accountId: "ren-northgate",
    customer: "Northgate Manufacturing",
    requestedPct: 18,
    capPct: 12,
    reason: "Procurement wants 18% to match a framework rate — 6 pts over the protected cap.",
  },
];

export const renewalAlerts: RenewalAlert[] = [
  { id: "ralert-1", kind: "competitor", accountId: "ren-brightwave", body: "Competitor quote spotted for Brightwave Logistics (~8% under current).", at: "1h ago" },
  { id: "ralert-2", kind: "billing", accountId: "ren-coastline", body: "Coastline billing dispute unresolved 6 weeks — £3,200 withheld.", at: "3h ago" },
  { id: "ralert-3", kind: "churn", accountId: "ren-coastline", body: "Churn-risk spike: Coastline NPS dropped to 21 after CFO change.", at: "5h ago" },
  { id: "ralert-4", kind: "usage", accountId: "ren-pinnacle", body: "Usage anomaly: Pinnacle roaming data +38% in May vs baseline.", at: "Yesterday" },
];
