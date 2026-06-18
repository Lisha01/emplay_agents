"use client";

import { useMemo, useState } from "react";
import { Bell, Check, Plus, Search } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import {
  INTEGRATIONS,
  INTEGRATION_CATEGORIES,
  logoCandidates,
  type Integration,
  type IntegrationCategory,
} from "@/lib/integrations";
import { cn } from "@/lib/utils";

type Filter = "all" | IntegrationCategory;

/** Brand logo — walks the candidate URLs on error, then a monogram if all fail. */
function Logo({ integration }: { integration: Integration }) {
  const candidates = logoCandidates(integration.domain);
  const [idx, setIdx] = useState(0);
  if (idx >= candidates.length) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-sm font-semibold text-primary">
        {integration.name.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={candidates[idx]}
      alt={`${integration.name} logo`}
      width={36}
      height={36}
      onError={() => setIdx((i) => i + 1)}
      className="h-9 w-9 shrink-0 rounded-lg bg-surface-muted object-contain p-1.5"
    />
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const connected = useStore((s) => s.connectedIntegrations.includes(integration.id));
  const toggle = useStore((s) => s.toggleIntegration);
  const addToast = useStore((s) => s.addToast);

  return (
    <div className={cn("flex flex-col rounded-xl border bg-surface p-4 transition-colors", connected ? "border-primary-border" : "border-border")}>
      <div className="flex items-start gap-3">
        <Logo integration={integration} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-strong">{integration.name}</p>
          <span className="mt-1 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted">
            {integration.category}
          </span>
        </div>
        {connected && !integration.soon && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-surface" aria-label="Connected">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>

      <p className="mt-2.5 min-h-[2.5rem] text-[13px] leading-relaxed text-muted">{integration.description}</p>

      <div className="mt-3">
        {integration.soon ? (
          <button
            onClick={() => addToast(`We'll let you know when ${integration.name} is ready`, "success")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-strong"
          >
            <Bell className="h-3.5 w-3.5" /> Notify me · Soon
          </button>
        ) : connected ? (
          <button
            onClick={() => toggle(integration.id)}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary-subtle px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:border-danger hover:bg-danger-bg hover:text-danger"
          >
            <Check className="h-3.5 w-3.5 group-hover:hidden" />
            <span className="group-hover:hidden">Connected</span>
            <span className="hidden group-hover:inline">Disconnect</span>
          </button>
        ) : (
          <button
            onClick={() => toggle(integration.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-surface px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-subtle"
          >
            <Plus className="h-3.5 w-3.5" /> Connect
          </button>
        )}
      </div>
    </div>
  );
}

/** Onboarding Step 2 — connect the tools the workspace pulls from. */
export function IntegrationsStep() {
  const connectedCount = useStore((s) => s.connectedIntegrations.length);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTEGRATIONS.filter((it) => {
      const matchesFilter = filter === "all" || it.category === filter;
      const matchesQuery = !q || it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  const filters: Filter[] = ["all", ...INTEGRATION_CATEGORIES];

  return (
    <div>
      {/* Search */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 transition-colors hover:border-primary-border focus-within:border-primary">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search integrations…"
          className="min-w-0 flex-1 bg-transparent text-sm text-strong outline-none placeholder:text-muted"
        />
        <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">
          {connectedCount} connected
        </span>
      </div>

      {/* Category toggles */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const on = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={on}
              className={cn(
                "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
                on
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border bg-surface text-text hover:border-primary-border hover:text-primary",
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface py-12 text-center text-sm text-muted">
          No integrations match “{query}”.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((it) => (
            <IntegrationCard key={it.id} integration={it} />
          ))}
        </div>
      )}
    </div>
  );
}
