"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, GitBranch, Pencil, Plus, Wand2, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { EditRequest, Editor, Version } from "./types";

/** Context-aware quick edits offered for the clicked column / filter / step / axis. */
export function suggestionsFor(target: string): string[] {
  const t = target.toLowerCase();
  if (t === "brief") return ["Focus on account expansion", "Prioritize renewals", "Owned accounts only"];
  if (t.startsWith("filter: role")) return ["Add Director of Product", "Include VP Product", "Exclude Associate PMs"];
  if (t.startsWith("filter: geo")) return ["Add Boston", "Include New Jersey", "Allow remote"];
  if (t.startsWith("filter: industry")) return ["Add Telecom companies", "Drop Telecom", "Add Fintech"];
  if (t.startsWith("filter: headcount")) return ["Widen headcount to 1000", "Narrow to 250–500", "Only 500+"];
  if (t.startsWith("step")) return ["Re-rank by intent", "Skip enrichment", "Add a dedupe step"];
  if (t.includes("headcount")) return ["Widen headcount to 1000", "Only 500–1000", "Sort high → low"];
  if (t.includes("industry")) return ["Add Fintech", "Drop Telecom", "Tech/SaaS only"];
  if (t.includes("location")) return ["Add San Francisco", "US East Coast only", "Include remote"];
  if (t.includes("title")) return ["Include Senior PMs", "Add Group PM", "Exclude Associate PMs"];
  // Scoring / qualification axes
  if (t.includes("intent")) return ["Weight intent higher", "Require recent intent", "Ignore intent"];
  if (t.includes("icp")) return ["Tighten ICP fit", "Loosen ICP fit", "Weight ICP higher"];
  if (t.includes("engagement")) return ["Weight engagement higher", "Require 1+ touch"];
  if (t.includes("recency")) return ["Only last 30 days", "Ignore recency"];
  if (t.includes("firmographic")) return ["Weight firmographics higher", "Require revenue data"];
  if (t.includes("routing") || t.includes("threshold") || t.includes("score")) return ["Raise PRIORITY threshold", "Lower NURTURE cutoff", "Only PRIORITY + ENGAGE"];
  if (t.includes("signal")) return ["Only PRIORITY + ENGAGE", "Drop NURTURE under 35", "Weight intent higher"];
  if (t.includes("company")) return ["Public companies only", "Funded in last 2y", "Has an active contract"];
  if (t.includes("name")) return ["Remove duplicates", "Add a verified-email column"];
  return ["Be more specific", "Broaden the criteria", "Sort by best fit"];
}

/** Trigger that opens the anchored edit popover; shows a count badge once edits are queued. */
export function AskEdit({ count, onPick }: { count: number; onPick: (rect: DOMRect) => void }) {
  const open = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onPick(e.currentTarget.getBoundingClientRect());
  };
  if (count > 0) {
    return (
      <button
        onClick={open}
        className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-1.5 py-0.5 text-[11px] font-semibold text-primary"
        title={`${count} edit${count > 1 ? "s" : ""} queued`}
      >
        <Pencil className="h-3 w-3" /> {count}
      </button>
    );
  }
  return (
    <button
      onClick={open}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-primary opacity-0 transition-opacity hover:bg-primary-subtle group-hover:opacity-100"
    >
      <Pencil className="h-3 w-3" /> Edit
    </button>
  );
}

/** Popover anchored to the clicked element — the contextual editor. */
export function EditPopover({
  editor,
  queued,
  onAdd,
  onRemove,
  onClose,
}: {
  editor: Editor;
  queued: EditRequest[];
  onAdd: (note: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const suggestions = suggestionsFor(editor.target);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.max(12, Math.min(editor.rect.left, vw - 340));
  const placeAbove = editor.rect.bottom > vh - 300;
  const top = placeAbove ? Math.max(12, editor.rect.top - 300) : editor.rect.bottom + 8;

  const submit = () => {
    if (!note.trim()) return;
    onAdd(note.trim());
    setNote("");
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 flex w-80 flex-col gap-2.5 rounded-xl border border-border bg-surface p-3 shadow-xl" style={{ top, left }}>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-subtle text-primary">
            <Wand2 className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] font-semibold text-strong">Describe edit</span>
          <span className="truncate rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-muted">{editor.target}</span>
          <button onClick={onClose} className="ml-auto text-muted hover:text-strong" aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {queued.length > 0 && (
          <div className="space-y-1">
            {queued.map((q) => (
              <div key={q.id} className="flex items-center gap-1.5 rounded-md bg-primary-subtle px-2 py-1 text-[12px] text-primary">
                <Check className="h-3 w-3 shrink-0" />
                <span className="flex-1 truncate">{q.note}</span>
                <button onClick={() => onRemove(q.id)} className="hover:text-primary-hover" aria-label="Remove edit">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Describe the edit…"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-strong outline-none focus:border-primary-border placeholder:text-muted"
          />
          <Button size="sm" variant="primary" onClick={submit} disabled={!note.trim()} aria-label="Add edit">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div>
          <p className="eyebrow mb-1.5">Suggested edits</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onAdd(s)}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] text-text transition-colors hover:border-primary-border hover:bg-primary-subtle hover:text-primary"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onClose} className="self-end text-[12px] font-medium text-muted hover:text-strong">
          Done
        </button>
      </div>
    </>
  );
}

/** Version selector — the current/newest version is always pre-selected. */
export function VersionDropdown({
  versions,
  activeVersion,
  onSelect,
}: {
  versions: Version[];
  activeVersion: Version;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-strong hover:bg-surface-muted"
      >
        <GitBranch className="h-3 w-3 text-muted" /> v{activeVersion.n}
        {versions.length > 1 && <span className="font-normal text-muted">of {versions.length}</span>}
        <ChevronDown className={cn("h-3 w-3 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-60 rounded-xl border border-border bg-surface p-1 shadow-lg">
            {[...versions].reverse().map((v) => {
              const active = v.id === activeVersion.id;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    onSelect(v.id);
                    setOpen(false);
                  }}
                  className={cn("flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left", active ? "bg-primary-subtle" : "hover:bg-surface-muted")}
                >
                  <GitBranch className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-muted")} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("flex items-center gap-1.5 text-xs font-medium", active ? "text-primary" : "text-strong")}>
                      v{v.n}
                      {v.n === versions.length && <span className="rounded-full bg-primary-subtle px-1.5 text-[10px] text-primary">Latest</span>}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {v.changelog[0]}
                      {v.changelog.length > 1 ? ` +${v.changelog.length - 1} more` : ""}
                    </span>
                  </span>
                  {active && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
