"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  FileText,
  Megaphone,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { personalisationQueueReady } from "@/lib/mockData";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { StatTiles } from "@/components/campaigns/shared";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FloatingQueue } from "@/components/campaigns/FloatingQueue";
import { cn } from "@/lib/utils";

const STEPS = ["Add accounts", "Pick channels & cadence", "Launch & monitor"];

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn("relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors", active ? "text-primary" : "text-muted hover:text-strong")}
    >
      <Icon className="h-4 w-4" />
      {children}
      {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
    </button>
  );
}

function BuildCard({
  icon: Icon,
  title,
  badge,
  badgeTone,
  body,
  cta,
  recommended,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  badge: string;
  badgeTone: "recommended" | "fullControl";
  body: string;
  cta: string;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-start gap-2 rounded-xl border bg-surface p-4 text-left transition-colors",
        recommended ? "border-primary-border ring-1 ring-primary-border hover:bg-primary-subtle/30" : "border-border hover:bg-surface-muted",
      )}
    >
      <div className="flex w-full items-center gap-2">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", recommended ? "bg-primary-subtle text-primary" : "bg-surface-muted text-muted")}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-semibold text-strong">{title}</span>
        <Badge tone={badgeTone} uppercase className="ml-auto">{badge}</Badge>
      </div>
      <p className="text-[13px] leading-relaxed text-text">{body}</p>
      <span className={cn("mt-1 text-[13px] font-medium", recommended ? "text-primary" : "text-strong")}>{cta} →</span>
    </button>
  );
}

/** Plan tab — how the build works + the two starting points. */
function BuildPlan() {
  const addToast = useStore((s) => s.addToast);
  const campaigns = useStore((s) => s.campaigns);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-strong">Build a campaign</h2>
        <p className="text-sm text-muted">Pick a starting point — or let AI assemble your next outreach sequence.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs text-text">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-semibold text-primary">{i + 1}</span>
                {s}
              </span>
              {i < STEPS.length - 1 && <span className="text-border">—</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <BuildCard
            icon={Sparkles}
            title="Build with AI"
            badge="Recommended"
            badgeTone="recommended"
            recommended
            body="Describe your segment, channels, tone and goal — Campaign Agent assembles the sequence and accounts for you."
            cta="Start with AI"
            onClick={() => addToast("Launching AI builder…")}
          />
          <BuildCard
            icon={SlidersHorizontal}
            title="Build manually"
            badge="Full control"
            badgeTone="fullControl"
            body="Configure every touch yourself — name, channels, copy and cadence — without AI generation."
            cta="Open manual builder"
            onClick={() => addToast("Opening manual builder…")}
          />
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2">Across all campaigns</p>
        <StatTiles campaigns={campaigns} />
      </div>
    </div>
  );
}

export function CampaignBuild({ sheets }: { sheets?: React.ReactNode }) {
  const campaigns = useStore((s) => s.campaigns);
  const addToast = useStore((s) => s.addToast);
  const setStep = useStore((s) => s.setStep);
  const command = useStore((s) => s.command);
  const [tab, setTab] = useState<"list" | "plan">("list");
  const [cmd, setCmd] = useState("");

  const submitCmd = () => {
    if (!cmd.trim()) return;
    command(cmd.trim(), "Assembling the campaign…", "Campaign");
    setCmd("");
  };

  const canvas = (
    <div>
      {/* Tab bar — same structure as the other steps */}
      <div className="sticky top-0 z-10 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="flex items-center gap-1 px-4">
          <TabBtn active={tab === "list"} onClick={() => setTab("list")} icon={Megaphone}>
            List of campaigns
            <span className="ml-1.5 rounded-full bg-surface-muted px-1.5 text-[10px] tabular-nums text-muted">{campaigns.length}</span>
          </TabBtn>
          <TabBtn active={tab === "plan"} onClick={() => setTab("plan")} icon={FileText}>
            Plan
          </TabBtn>
        </div>
      </div>

      <div className="p-5">
        {tab === "list" ? <CampaignsTable campaigns={campaigns} onOpen={() => setStep(5)} /> : <BuildPlan />}
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center gap-3 border-t border-border bg-surface px-3 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 focus-within:border-primary-border focus-within:bg-surface">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitCmd()}
          placeholder="Build with AI — e.g. 'LinkedIn + Email, consultative tone, goal: book a 20-min call'"
          className="min-w-0 flex-1 bg-transparent text-sm text-strong outline-none placeholder:text-muted"
        />
        <button
          onClick={submitCmd}
          disabled={!cmd.trim()}
          aria-label="Build with AI"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      <Button variant="primary" className="shrink-0" onClick={() => { addToast("Campaign launched", "success"); setStep(5); }}>
        Launch campaign
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="relative h-full">
      <WorkbookShell sheets={sheets} canvas={canvas} footer={footer} />
      <FloatingQueue ready={personalisationQueueReady} />
    </div>
  );
}
