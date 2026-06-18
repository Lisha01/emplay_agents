"use client";

import { useRef, useState } from "react";
import { ArrowRight, Eye, FileText, GitBranch, ListChecks, Plus, Sparkles, X } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import type { Lead } from "@/lib/types";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { EditPopover, VersionDropdown } from "./editing";
import { DiffBanner, LeadsDiff, PlanDiff } from "./diff";
import { PlanTab } from "./plan";
import { applyEdits } from "./transforms";
import type { EditRequest, Editor, ListCtx, PlanLabels, PlanState, Version } from "./types";

export interface WorkbenchProps {
  scope: string; // chat scope, e.g. "Lead Research"
  listLabel: string;
  planLabel: string;
  planLabels: PlanLabels;
  allItems: Lead[];
  initialItemIds: string[];
  initialPlan: PlanState;
  listSuggestions: string[];
  footerPlaceholder: string;
  primaryLabel: string; // "Qualify" / "Personalize"
  selection: string[];
  toggleSelect: (id: string) => void;
  setSelection: (ids: string[]) => void;
  onPrimary: () => void;
  generating?: boolean;
  initialTab?: "list" | "plan";
  renderList: (ctx: ListCtx) => React.ReactNode;
  /** Override the Sheets rail (e.g. the auto-run Plan + steps rail) — full assist UX otherwise. */
  sheets?: React.ReactNode;
  /** Extra content rendered at the top of the plan tab (e.g. the auto-run activity log). */
  planExtra?: React.ReactNode;
}

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof ListChecks; children: React.ReactNode }) {
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

export function Workbench(props: WorkbenchProps) {
  const {
    scope, listLabel, planLabel, planLabels, allItems, initialItemIds, initialPlan,
    listSuggestions, footerPlaceholder, primaryLabel, selection, toggleSelect, setSelection,
    onPrimary, generating = false, initialTab = "list", renderList, sheets, planExtra,
  } = props;
  const addChat = useStore((s) => s.addChat);
  const addToast = useStore((s) => s.addToast);

  const [tab, setTab] = useState<"list" | "plan">(initialTab);
  const [versions, setVersions] = useState<Version[]>(() => [
    { id: "v1", n: 1, changelog: ["Initial version"], itemIds: initialItemIds, plan: initialPlan },
  ]);
  const [activeVersionId, setActiveVersionId] = useState("v1");
  const [pending, setPending] = useState<EditRequest[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [footerNote, setFooterNote] = useState("");
  const [notesFocused, setNotesFocused] = useState(false);
  const [viewingDiff, setViewingDiff] = useState(false);
  const editId = useRef(0);

  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[0];
  const prevVersion = versions.find((v) => v.n === activeVersion.n - 1) ?? null;
  const visibleItems = activeVersion.itemIds.map((id) => allItems.find((l) => l.id === id)).filter(Boolean) as Lead[];
  const allSelected = selection.length === visibleItems.length && visibleItems.length > 0;
  const inDiff = viewingDiff && !!prevVersion;

  const openEditor = (target: string, rect: DOMRect) => setEditor({ target, rect });
  const countFor = (target: string) => pending.filter((e) => e.target === target).length;
  const queuedFor = (target: string) => pending.filter((e) => e.target === target);

  const addEditFor = (target: string, note: string) => {
    const n = note.trim();
    if (!n) return;
    editId.current += 1;
    setPending((p) => [...p, { id: `e-${editId.current}`, target, note: n }]);
    addChat("user", `Edit · ${target}: ${n}`, scope);
  };
  const removePending = (id: string) => setPending((p) => p.filter((e) => e.id !== id));
  const addNoteAsEdit = () => {
    if (!footerNote.trim()) return;
    addEditFor("Note", footerNote);
    setFooterNote("");
  };

  const applyChanges = () => {
    const edits: EditRequest[] = [
      ...pending.map((e) => ({ id: e.id, target: e.target, note: e.note })),
      ...(footerNote.trim() ? [{ id: "footer", target: "Note", note: footerNote.trim() }] : []),
    ];
    if (edits.length === 0) return;
    const n = versions.length + 1;
    const v = applyEdits(activeVersion, edits, n, allItems);
    setVersions((vs) => [...vs, v]);
    setActiveVersionId(v.id);
    setSelection([]);
    if (footerNote.trim()) addChat("user", footerNote.trim(), scope);
    addChat("agent", `Applied edits — created v${n} (list + plan updated).`, scope);
    setPending([]);
    setFooterNote("");
    setEditor(null);
    addToast(`Applied edits — created v${n}`, "success");
  };

  const hasChanges = pending.length > 0 || footerNote.trim().length > 0;
  const editCount = pending.length + (footerNote.trim() ? 1 : 0);

  const listCtx: ListCtx = {
    items: visibleItems,
    selection,
    toggle: toggleSelect,
    setSelection,
    onAsk: openEditor,
    countFor,
    generating,
  };
  void allSelected; // available to renderers via ctx selection if needed

  const canvas = (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="flex items-center gap-1 px-4">
          <TabBtn active={tab === "list"} onClick={() => setTab("list")} icon={ListChecks}>
            {listLabel}
            <span className="ml-1.5 rounded-full bg-surface-muted px-1.5 text-[10px] tabular-nums text-muted">{visibleItems.length}</span>
          </TabBtn>
          <TabBtn active={tab === "plan"} onClick={() => setTab("plan")} icon={FileText}>
            {planLabel}
          </TabBtn>

          <div className="ml-auto flex items-center gap-2 py-2">
            <span className="eyebrow">Version</span>
            <VersionDropdown versions={versions} activeVersion={activeVersion} onSelect={setActiveVersionId} />
            {activeVersion.n > 1 && (
              <Button size="sm" variant="ghostPrimary" onClick={() => setViewingDiff((v) => !v)}>
                <Eye className="h-3.5 w-3.5" /> {viewingDiff ? "Exit" : "View edits"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {inDiff && prevVersion ? (
          <>
            <DiffBanner prev={prevVersion} curr={activeVersion} />
            {tab === "list" ? (
              <LeadsDiff prev={prevVersion} curr={activeVersion} allItems={allItems} />
            ) : (
              <PlanDiff prev={prevVersion.plan} curr={activeVersion.plan} labels={planLabels} />
            )}
          </>
        ) : (
          <>
            {tab === "list" && activeVersion.n > 1 && (
              <div className="mb-3 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-[13px]">
                <span className="font-medium text-strong">v{activeVersion.n} edits:</span>{" "}
                <span className="text-muted">{activeVersion.changelog.join(" · ")}</span>
              </div>
            )}
            {tab === "list" ? (
              renderList(listCtx)
            ) : (
              <>
                {planExtra}
                <PlanTab plan={activeVersion.plan} labels={planLabels} onAsk={openEditor} countFor={countFor} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  const footer = inDiff ? (
    <div className="flex items-center gap-3 border-t border-border bg-surface px-4 py-3 text-[13px] text-muted">
      <Eye className="h-4 w-4" /> Read-only — viewing edits in v{activeVersion.n}.
      <span className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" /> removed</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> added</span>
      </span>
      <Button variant="primary" className="ml-auto" onClick={() => setViewingDiff(false)}>Back to editing</Button>
    </div>
  ) : (
    <div className="border-t border-border bg-surface px-4 py-3">
      {pending.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="eyebrow mr-1">Queued edits · {pending.length}</span>
          {pending.map((e) => (
            <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2 py-0.5 text-xs text-primary">
              <span className="font-medium">{e.target}</span>: {e.note}
              <button onClick={() => removePending(e.id)} className="hover:text-primary-hover" aria-label="Remove edit">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          {notesFocused && (
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-border bg-surface p-2 shadow-lg">
              <p className="eyebrow mb-1.5 px-1">Suggested edits</p>
              <div className="flex flex-wrap gap-1.5">
                {listSuggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addEditFor("Note", s)}
                    className="rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] text-text transition-colors hover:border-primary-border hover:bg-primary-subtle hover:text-primary"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 transition-colors hover:border-primary-border hover:bg-surface focus-within:border-primary focus-within:bg-surface">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <input
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              onFocus={() => setNotesFocused(true)}
              onBlur={() => setNotesFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && addNoteAsEdit()}
              placeholder={footerPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-strong outline-none placeholder:text-muted"
            />
            {footerNote.trim() && (
              <button
                onClick={addNoteAsEdit}
                title="Add edit"
                aria-label="Add edit"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg transition-colors hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={applyChanges} disabled={!hasChanges}>
          <GitBranch className="h-4 w-4" /> Apply edits{editCount ? ` (${editCount})` : ""}
        </Button>
        <Button variant={hasChanges ? "secondary" : "primary"} onClick={onPrimary} disabled={hasChanges || selection.length === 0}>
          {primaryLabel} {selection.length ? `${selection.length} ` : ""}selected
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const popover =
    editor && !inDiff ? (
      <EditPopover
        editor={editor}
        queued={queuedFor(editor.target)}
        onAdd={(note) => addEditFor(editor.target, note)}
        onRemove={removePending}
        onClose={() => setEditor(null)}
      />
    ) : null;

  return (
    <>
      <WorkbookShell sheets={sheets} canvas={canvas} footer={footer} />
      {popover}
    </>
  );
}
