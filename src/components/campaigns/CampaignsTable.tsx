"use client";

import { useState } from "react";
import { ChevronRight, Search, Trash2 } from "@/components/ui/icons";
import type { Campaign, CampaignStatus } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Badge, BuildTag, ChannelChips, STATUS_TONE } from "./shared";
import { cn } from "@/lib/utils";

const FILTERS: ("all" | CampaignStatus)[] = ["all", "running", "paused", "completed"];

export function CampaignsTable({
  campaigns,
  onOpen,
  selectedId,
  query: queryProp,
  filter: filterProp,
  hideControls,
}: {
  campaigns: Campaign[];
  onOpen?: (c: Campaign) => void;
  selectedId?: string | null;
  /** Controlled search/filter (used when controls live outside the table). */
  query?: string;
  filter?: "all" | CampaignStatus;
  hideControls?: boolean;
}) {
  const deleteCampaign = useStore((s) => s.deleteCampaign);
  const [filterState, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [queryState, setQuery] = useState("");
  const controlled = !!hideControls;
  const filter = controlled ? filterProp ?? "all" : filterState;
  const query = controlled ? queryProp ?? "" : queryState;

  const rows = campaigns.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      (c.name.toLowerCase().includes(query.toLowerCase()) || c.segment.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div>
      {!controlled && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns…"
              className="w-40 bg-transparent text-sm text-strong outline-none placeholder:text-muted"
            />
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  filter === f ? "bg-primary-subtle text-primary" : "text-muted hover:text-strong",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left">
              {["Campaign", "Status", "Channels", "Accounts", "Sent", "Replied", "Meetings", "Updated", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                onClick={() => onOpen?.(c)}
                className={cn(
                  "border-b border-border-subtle last:border-0 transition-colors",
                  onOpen && "cursor-pointer",
                  selectedId === c.id ? "bg-primary-subtle/40" : onOpen && "hover:bg-surface-muted",
                )}
              >
                <td className="px-3 py-3">
                  <p className="font-semibold text-strong">{c.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <BuildTag build={c.build} />
                    <span className="max-w-md truncate text-xs text-muted">{c.segment}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Badge tone={STATUS_TONE[c.status]} dot className="capitalize">{c.status}</Badge>
                </td>
                <td className="px-3 py-3"><ChannelChips channels={c.channels} /></td>
                <td className="px-3 py-3 tabular-nums text-text">{c.accounts}</td>
                <td className="px-3 py-3 tabular-nums text-text">{c.sent}</td>
                <td className="px-3 py-3 tabular-nums text-text">{c.replied}</td>
                <td className="px-3 py-3 font-semibold tabular-nums text-warning">{c.meetings}</td>
                <td className="px-3 py-3 text-xs text-muted">{c.updated}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCampaign(c.id); }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-danger"
                      aria-label="Delete campaign"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {onOpen && <ChevronRight className="h-4 w-4 text-muted" />}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted">No campaigns match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
