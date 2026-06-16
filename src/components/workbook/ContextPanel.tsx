"use client";

import { useState } from "react";
import { ExternalLink, Zap, Target, MapPin, Mail, Phone, Link2, MessageCircle, Clock } from "@/components/ui/icons";
import type { Account, Contact, ResearchCard } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_META: Record<ResearchCard["kind"], { tone: string; icon: typeof Zap }> = {
  TRIGGER: { tone: "text-accent", icon: Zap },
  "BUYING SIGNAL": { tone: "text-primary", icon: Target },
  CONTEXT: { tone: "text-info", icon: MapPin },
};

function Card({ card }: { card: ResearchCard }) {
  const meta = KIND_META[card.kind];
  const Icon = meta.icon;
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-3">
      <div className={cn("mb-1.5 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide", meta.tone)}>
        <Icon className="h-3.5 w-3.5" />
        {card.kind}
      </div>
      <p className="text-[13px] font-semibold text-strong">{card.title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-text">{card.body}</p>
      <button className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-info hover:underline">
        {card.source}
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}

/** Right-hand "why" panel, tabbed (spec §6.3, Image 2). Always reflects the focused item. */
export function ContextPanel({
  account,
  contacts,
  focusedContactId,
}: {
  account: Account;
  contacts: Contact[];
  focusedContactId: string | null;
}) {
  const tabs = [
    { id: "research", label: "Research", count: account.research.length },
    { id: "contacts", label: "Contacts", count: contacts.length },
    { id: "activity", label: "Activity", count: 2 },
    { id: "chat", label: "Chat", count: 0 },
  ] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("research");

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-border px-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-2.5 py-3 text-[13px] font-medium transition-colors",
              tab === t.id ? "text-primary" : "text-muted hover:text-strong",
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className="rounded-full bg-surface-muted px-1.5 text-[10px] tabular-nums text-muted">
                {t.count}
              </span>
            )}
            {tab === t.id && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {tab === "research" && account.research.map((c, i) => <Card key={i} card={c} />)}

        {tab === "contacts" &&
          contacts.map((c) => (
            <div key={c.id} className="rounded-xl border border-border-subtle bg-surface p-3">
              <p className="text-[13px] font-semibold text-strong">{c.name}</p>
              <p className="text-xs text-muted">{c.title}</p>
              <div className="mt-2 space-y-1 text-xs text-text">
                <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted" /> {c.name.split(" ")[0].toLowerCase()}@{account.name.toLowerCase()}.com</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted" /> +1 ***-***-****</p>
                <p className="flex items-center gap-1.5 text-info"><Link2 className="h-3 w-3" /> LinkedIn profile</p>
              </div>
              {c.id === focusedContactId && (
                <span className="mt-2 inline-block rounded-full bg-accent-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  Focused
                </span>
              )}
            </div>
          ))}

        {tab === "activity" && (
          <div className="space-y-2.5">
            {[
              { icon: Clock, text: "Auto-qualified · 30m ago", sub: "Enriched via Prospeo" },
              { icon: Target, text: "Trigger fired · Software Development signal", sub: "Internal qualification" },
            ].map((a, i) => (
              <div key={i} className="flex gap-2.5 rounded-xl border border-border-subtle bg-surface p-3">
                <a.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="text-[13px] text-strong">{a.text}</p>
                  <p className="text-xs text-muted">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "chat" && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted">
            <MessageCircle className="h-6 w-6" />
            <p className="text-[13px]">Ask the agent anything about this account in the command bar below.</p>
          </div>
        )}
      </div>
    </div>
  );
}
