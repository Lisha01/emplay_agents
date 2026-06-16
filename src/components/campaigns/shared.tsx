"use client";

import { Link2, Mail, MessageSquare, Send, Reply, CalendarCheck, Target, UserPlus, Sparkles, SlidersHorizontal, type LucideIcon } from "@/components/ui/icons";
import type { BuildType, Campaign, Channel, CampaignStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";

export const CHANNEL_ICON: Record<Channel, typeof Mail> = {
  linkedin: Link2,
  email: Mail,
  whatsapp: MessageSquare,
};
const CHANNEL_LABEL: Record<Channel, string> = { linkedin: "LinkedIn", email: "Email", whatsapp: "WhatsApp" };

const STATUS_TONE: Record<CampaignStatus, "running" | "paused" | "completed"> = {
  running: "running",
  paused: "paused",
  completed: "completed",
};

const BUILD_TONE = { ai: "ai", manual: "manual", personalisation: "personalisation" } as const;
const BUILD_LABEL = { ai: "AI builder", manual: "Manual", personalisation: "Personalisation" } as const;
const BUILD_ICON: Record<BuildType, LucideIcon> = { ai: Sparkles, manual: SlidersHorizontal, personalisation: UserPlus };

/** Build-type tag — bordered pill with icon (Personalisation · AI builder · Manual). */
export function BuildTag({ build }: { build: BuildType }) {
  const Icon = BUILD_ICON[build];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted">
      <Icon className="h-3 w-3" /> {BUILD_LABEL[build]}
    </span>
  );
}

export function computeStats(campaigns: Campaign[]) {
  return {
    total: campaigns.length,
    running: campaigns.filter((c) => c.status === "running").length,
    sent: campaigns.reduce((a, c) => a + c.sent, 0),
    replied: campaigns.reduce((a, c) => a + c.replied, 0),
    meetings: campaigns.reduce((a, c) => a + c.meetings, 0),
  };
}

export function StatTiles({ campaigns }: { campaigns: Campaign[] }) {
  const s = computeStats(campaigns);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatTile label="Total" value={s.total} icon={Target} />
      <StatTile label="Running" value={s.running} icon={Send} tone="success" />
      <StatTile label="Sent" value={s.sent} icon={Mail} tone="info" />
      <StatTile label="Replied" value={s.replied} icon={Reply} tone="primary" />
      <StatTile label="Meetings" value={s.meetings} icon={CalendarCheck} tone="warning" />
    </div>
  );
}

export function ChannelChips({ channels }: { channels: Channel[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((ch) => {
        const Icon = CHANNEL_ICON[ch];
        return (
          <span key={ch} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text">
            <Icon className="h-3.5 w-3.5 text-info" /> {CHANNEL_LABEL[ch]}
          </span>
        );
      })}
    </div>
  );
}

export { STATUS_TONE, BUILD_TONE, BUILD_LABEL };
export { Badge };
