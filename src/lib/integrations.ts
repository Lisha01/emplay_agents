// Integration catalogue for onboarding (Step 2). Mock metadata only — logos are
// pulled from the open web by `domain` (Clearbit logo API, then a Google-favicon
// fallback, then a monogram if both fail). Connection state lives in the store.

export type IntegrationCategory =
  | "Database Management"
  | "CRM & Sales"
  | "Customer Engagement"
  | "Marketing Automation"
  | "Web Analytics";

export interface Integration {
  id: string;
  name: string;
  /** Company domain — used to resolve the brand logo from the open web. */
  domain: string;
  category: IntegrationCategory;
  description: string;
  /** Not yet wired up — shown as a disabled "Coming soon" card. */
  soon?: boolean;
}

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  "Database Management",
  "CRM & Sales",
  "Customer Engagement",
  "Marketing Automation",
  "Web Analytics",
];

/** Brand-logo URL candidates for a domain, best quality first. The <img> walks the
 *  list on error and falls back to a monogram if all fail. */
export const logoCandidates = (domain: string): string[] => [
  `https://logo.clearbit.com/${domain}`,
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
];

export const INTEGRATIONS: Integration[] = [
  // ── Database Management ─────────────────────────────────────────────
  { id: "snowflake", name: "Snowflake", domain: "snowflake.com", category: "Database Management", description: "Sync warehoused account and usage data into your workspace." },
  { id: "postgresql", name: "PostgreSQL", domain: "postgresql.org", category: "Database Management", description: "Pull lead and account records straight from your Postgres database." },
  { id: "bigquery", name: "Google BigQuery", domain: "cloud.google.com", category: "Database Management", description: "Query analytics and event data from BigQuery in real time." },
  { id: "mongodb", name: "MongoDB", domain: "mongodb.com", category: "Database Management", description: "Enrich accounts with product data from your collections.", soon: true },

  // ── CRM & Sales ─────────────────────────────────────────────────────
  { id: "salesforce", name: "Salesforce", domain: "salesforce.com", category: "CRM & Sales", description: "Two-way sync the full CRM — accounts, opportunities, and owners." },
  { id: "zoominfo", name: "ZoomInfo", domain: "zoominfo.com", category: "CRM & Sales", description: "Enrich accounts with firmographics and verified contact data." },
  { id: "salesnav", name: "LinkedIn Sales Navigator", domain: "linkedin.com", category: "CRM & Sales", description: "Pull buying-committee insights and warm intros from Sales Navigator.", soon: true },

  // ── Customer Engagement ─────────────────────────────────────────────
  { id: "slack", name: "Slack", domain: "slack.com", category: "Customer Engagement", description: "Get run alerts and reply notifications in any Slack channel." },
  { id: "teams", name: "Microsoft Teams", domain: "teams.microsoft.com", category: "Customer Engagement", description: "Route attention items and approvals to your Teams channels." },
  { id: "intercom", name: "Intercom", domain: "intercom.com", category: "Customer Engagement", description: "Sync conversations and capture intent signals from live chats." },
  { id: "zendesk", name: "Zendesk", domain: "zendesk.com", category: "Customer Engagement", description: "Surface support tickets and CSAT as account health signals.", soon: true },

  // ── Marketing Automation ────────────────────────────────────────────
  { id: "hubspot", name: "HubSpot", domain: "hubspot.com", category: "Marketing Automation", description: "Two-way sync contacts, campaigns, and activity with HubSpot." },
  { id: "mailchimp", name: "Mailchimp", domain: "mailchimp.com", category: "Marketing Automation", description: "Push qualified segments into Mailchimp audiences automatically." },
  { id: "marketo", name: "Marketo", domain: "marketo.com", category: "Marketing Automation", description: "Hand off nurtured leads into Marketo Engage programs.", soon: true },

  // ── Web Analytics ───────────────────────────────────────────────────
  { id: "ga", name: "Google Analytics", domain: "analytics.google.com", category: "Web Analytics", description: "Tie web engagement and intent signals to scored accounts." },
  { id: "mixpanel", name: "Mixpanel", domain: "mixpanel.com", category: "Web Analytics", description: "Bring product engagement events into lead qualification." },
  { id: "segment", name: "Segment", domain: "segment.com", category: "Web Analytics", description: "Stream unified customer events across the entire funnel." },
  { id: "amplitude", name: "Amplitude", domain: "amplitude.com", category: "Web Analytics", description: "Use behavioural cohorts to sharpen lead scoring.", soon: true },
];

/** Integrations connected out of the box (so onboarding reads as a real account). */
export const DEFAULT_CONNECTED = ["salesforce", "hubspot"];
