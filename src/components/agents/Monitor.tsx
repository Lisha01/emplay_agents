"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, PauseCircle, PhoneCall, PlayCircle, Sparkles, Zap } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import type { Campaign } from "@/lib/types";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { StatTiles, Badge } from "@/components/campaigns/shared";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { Button } from "@/components/ui/Button";

// Mock per-account cadence rows for a drilled-in campaign.
const DRILL_ROWS = [
  { account: "Softheon", contact: "Akshay Punde", day: 2, of: 12, state: "in-cadence" as const },
  { account: "Softheon", contact: "Chris Kaspar", day: 2, of: 12, state: "in-cadence" as const },
  { account: "Meridian Health Systems", contact: "Dana Whitfield", day: 4, of: 10, state: "replied" as const },
];

const STATE_BADGE = {
  "in-cadence": { tone: "info" as const, label: "In cadence" },
  replied: { tone: "approved" as const, label: "Replied" },
  meeting: { tone: "approved" as const, label: "Meeting booked" },
};

export function Monitor() {
  const campaigns = useStore((s) => s.campaigns);
  const addToast = useStore((s) => s.addToast);
  const command = useStore((s) => s.command);
  const openAccount = useStore((s) => s.openAccountInWorkbook);
  const router = useRouter();
  const [selected, setSelected] = useState<Campaign | null>(campaigns.find((c) => c.status === "running") ?? null);

  const replied = DRILL_ROWS.find((r) => r.state === "replied");

  const canvas = (
    <div className="p-5 pb-24">
      <h2 className="mb-4 text-lg font-semibold text-strong">Campaign Monitor</h2>
      <div className="mb-4"><StatTiles campaigns={campaigns} /></div>

      <CampaignsTable campaigns={campaigns} onOpen={setSelected} selectedId={selected?.id} />

      {selected && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-strong">{selected.name}</h3>
            <Badge tone={selected.status === "running" ? "running" : selected.status === "paused" ? "paused" : "completed"} dot className="capitalize">
              {selected.status}
            </Badge>
            <div className="ml-auto flex items-center gap-2">
              {selected.status === "running" ? (
                <Button size="sm" variant="secondary" onClick={() => addToast("Campaign paused")}>
                  <PauseCircle className="h-3.5 w-3.5" /> Pause
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => addToast("Campaign resumed")}>
                  <PlayCircle className="h-3.5 w-3.5" /> Resume
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted text-left">
                  {["Account", "Contact", "Cadence", "State"].map((h) => (
                    <th key={h} className="px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DRILL_ROWS.map((r, i) => (
                  <tr key={i} className="border-b border-border-subtle last:border-0">
                    <td className="px-3 py-2.5 font-medium text-strong">{r.account}</td>
                    <td className="px-3 py-2.5 text-text">{r.contact}</td>
                    <td className="px-3 py-2.5 text-muted">Day {r.day} of {r.of}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={STATE_BADGE[r.state].tone}>{STATE_BADGE[r.state].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Next-best-action card for a replying account */}
          {replied && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 bg-accent-subtle/50 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
                <Zap className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-accent">Next best action</p>
                <p className="text-[13px] text-strong">
                  <span className="font-semibold">{replied.contact}</span> at {replied.account} replied — call now or send a hyper-personalized reply.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => addToast("Call task created")}>
                  <PhoneCall className="h-3.5 w-3.5" /> Call now
                </Button>
                <Button size="sm" variant="primary" onClick={() => openAccount("acc-meridian", 3)}>
                  <Sparkles className="h-3.5 w-3.5" /> Personalize reply
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loop back to Home */}
      <button
        onClick={() => router.push("/")}
        className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
      >
        Back to today&rsquo;s attention queue <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <WorkbookShell
      canvas={canvas}
      commandPlaceholder="Ask about a campaign — e.g. 'which accounts replied this week?'"
      commandScope="Monitor"
      onCommand={(v) => command(v, "Looking that up…", "Monitor")}
    />
  );
}
