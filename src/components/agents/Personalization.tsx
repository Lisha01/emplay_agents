"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Link2,
  Mail,
  MessageSquarePlus,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
  Wand2,
} from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import type { Channel, Touch } from "@/lib/types";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { ContextPanel } from "@/components/workbook/ContextPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const CHANNEL_META: Record<Channel, { label: string; icon: typeof Mail }> = {
  linkedin: { label: "LinkedIn", icon: Link2 },
  email: { label: "Email", icon: Mail },
  whatsapp: { label: "WhatsApp", icon: MessageSquarePlus },
};

function TouchCard({ touch, accountId }: { touch: Touch; accountId: string }) {
  const updateTouch = useStore((s) => s.updateTouch);
  const approveTouch = useStore((s) => s.approveTouch);
  const deleteTouch = useStore((s) => s.deleteTouch);
  const addToast = useStore((s) => s.addToast);
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-semibold text-text">Day {touch.day}</span>
        <span className="text-[13px] font-medium text-strong">{touch.type}</span>
        <Badge tone={touch.state === "approved" ? "approved" : "draft"} className="ml-1">
          {touch.state === "approved" ? "Approved" : "Draft"}
        </Badge>
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn title="Approve" onClick={() => approveTouch(accountId, touch.channel, touch.id)}>
            <Check className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Edit" onClick={() => setEditing((v) => !v)}>
            <Pencil className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Regenerate" onClick={() => addToast("Regenerating touch…")}>
            <RefreshCw className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Delete" onClick={() => deleteTouch(accountId, touch.channel, touch.id)} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      {editing ? (
        <textarea
          value={touch.body}
          onChange={(e) => updateTouch(accountId, touch.channel, touch.id, { body: e.target.value })}
          rows={4}
          className="w-full resize-y rounded-lg border border-primary-border bg-surface p-2 text-[13px] text-text outline-none"
        />
      ) : (
        <p className="whitespace-pre-line text-[13px] leading-relaxed text-text">{touch.body}</p>
      )}

      {touch.type === "Connection note" && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs text-muted">Send invite:</span>
          {(["with-note", "without-note"] as const).map((m) => (
            <button
              key={m}
              onClick={() => updateTouch(accountId, touch.channel, touch.id, { inviteMode: m })}
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                touch.inviteMode === m ? "bg-primary-subtle text-primary" : "bg-surface-muted text-muted hover:text-strong",
              )}
            >
              {m === "with-note" ? "With note" : "Without note"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, title, onClick, danger }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted",
        danger ? "hover:text-danger" : "hover:text-strong",
      )}
    >
      {children}
    </button>
  );
}

export function Personalization() {
  const accountId = useStore((s) => s.activeAccountId) ?? "acc-softheon";
  const account = useStore((s) => s.accounts.find((a) => a.id === accountId));
  const contacts = useStore((s) => s.contacts.filter((c) => c.accountId === accountId));
  const sequence = useStore((s) => s.sequences.find((seq) => seq.accountId === accountId));
  const focusedContactId = useStore((s) => s.focusedContactId);
  const setFocusedContact = useStore((s) => s.setFocusedContact);
  const tightenAllDMs = useStore((s) => s.tightenAllDMs);
  const sendToCampaigns = useStore((s) => s.sendToCampaigns);
  const addToast = useStore((s) => s.addToast);
  const command = useStore((s) => s.command);
  const [openChannels, setOpenChannels] = useState<Record<string, boolean>>({ linkedin: true, email: true });

  const focusedContact = contacts.find((c) => c.id === focusedContactId) ?? contacts[0];

  if (!account) {
    return (
      <WorkbookShell
        canvas={<div className="p-8"><EmptyState icon={Sparkles} title="No account in focus" body="Push accounts from Qualification to start personalizing." /></div>}
        commandPlaceholder="Ask the agent to refine drafts…"
      />
    );
  }

  const channelEntries = sequence ? (Object.entries(sequence.byChannel) as [Channel, NonNullable<typeof sequence.byChannel[Channel]>][]) : [];

  const canvas = (
    <div className="p-5 pb-24">
      {/* Account header */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-strong">{account.name}</h2>
        <span className="text-sm text-muted">{account.location}</span>
        <Badge tone="nurture" className="ml-1">{account.routingBadge}</Badge>
        <span className="ml-auto text-xs text-muted">{contacts.length} contacts · {focusedContact?.progress ?? "0/8"}</span>
      </div>

      {/* Contacts strip */}
      <p className="eyebrow mb-2">Contacts in this account · {contacts.length}</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {contacts.map((c) => (
          <button
            key={c.id}
            onClick={() => setFocusedContact(c.id)}
            className={cn(
              "flex min-w-44 flex-col gap-1 rounded-xl border bg-surface px-3 py-2 text-left transition-colors",
              c.id === focusedContact?.id ? "border-primary-border ring-1 ring-primary-border" : "border-border hover:bg-surface-muted",
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-strong">{c.name}</span>
              {c.id === focusedContact?.id && (
                <span className="rounded-full bg-accent-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">Focused</span>
              )}
            </span>
            <span className="text-xs text-muted">{c.title}</span>
            <span className="flex items-center gap-2 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1 text-success"><Check className="h-3 w-3" /> Researched</span>
              · {c.progress}
            </span>
          </button>
        ))}
        <button
          onClick={() => addToast("Add contact (stub)")}
          className="flex min-w-32 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-[13px] text-muted hover:border-primary-border hover:text-primary"
        >
          <UserPlus className="h-4 w-4" /> Add contact
        </button>
      </div>

      {/* Channel sections */}
      {channelEntries.length === 0 ? (
        <EmptyState icon={Wand2} title="No sequence drafted yet" body="Use the command bar to generate a sequence for this account." />
      ) : (
        <div className="space-y-4">
          {channelEntries.map(([channel, cs]) => {
            const meta = CHANNEL_META[channel];
            const open = openChannels[channel] ?? true;
            return (
              <div key={channel} className="overflow-hidden rounded-xl border border-border bg-surface-muted/30">
                <button
                  onClick={() => setOpenChannels((s) => ({ ...s, [channel]: !open }))}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left"
                >
                  <meta.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-strong">{meta.label}</span>
                  <span className="text-xs text-muted">— {cs.touches.length} touches · {cs.window}</span>
                  <ChevronDown className={cn("ml-auto h-4 w-4 text-muted transition-transform", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="space-y-2 px-3 pb-3">
                    {cs.touches.map((t) => (
                      <TouchCard key={t.id} touch={t} accountId={account.id} />
                    ))}
                    <button
                      onClick={() => addToast(`Add ${meta.label} touch (stub)`)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-[13px] text-muted hover:border-primary-border hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add {meta.label} touch
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => tightenAllDMs(account.id)}>
          <Wand2 className="h-3.5 w-3.5" /> Tighten all DMs
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addToast("WhatsApp channel added (stub)")}>
          <MessageSquarePlus className="h-3.5 w-3.5" /> Add WhatsApp channel
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addToast("Regenerating from new research…")}>
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate from new research
        </Button>
      </div>
    </div>
  );

  const aside = <ContextPanel account={account} contacts={contacts} focusedContactId={focusedContact?.id ?? null} />;

  return (
    <div className="relative h-full">
      <WorkbookShell
        canvas={canvas}
        aside={aside}
        commandPlaceholder="Ask the agent to refine, add context, change tone — e.g. 'rewrite Day 6 with the Q3 OPEX data'"
        commandScope={`${account.name} · ${focusedContact?.name.split(" ")[0] ?? ""}`}
        onCommand={(v) => command(v, "Refining the drafts…", `${account.name} · ${focusedContact?.name.split(" ")[0] ?? ""}`)}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center">
        <Button variant="primary" className="pointer-events-auto shadow-lg" onClick={() => sendToCampaigns(account.id)}>
          <Send className="h-4 w-4" /> Send to Campaigns
        </Button>
      </div>
    </div>
  );
}
