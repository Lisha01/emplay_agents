"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MessageSquareText, Play, Plus, Tag } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { Badge, routingTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const SEGMENTS = [
  { id: "seg-expansion", name: "Expansion — Tech/SaaS NYC", count: 18, tag: "Account expansion" },
  { id: "seg-renewal", name: "Renewals — Q3 install base", count: 11, tag: "Renewal" },
  { id: "seg-icp", name: "ICP — Telecom 201–500", count: 24, tag: "Lead acquisition" },
];

/** Persistent account hub, independent of any run (spec §6.6). */
export default function AccountsPage() {
  const accounts = useStore((s) => s.accounts);
  const enterAt = useStore((s) => s.enterAt);
  const openAccount = useStore((s) => s.openAccountInWorkbook);
  const setAutoRun = useStore((s) => s.setAutoRun);
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-1 flex items-center gap-2">
          <h1 className="text-xl font-semibold text-strong">Leads</h1>
          <Button variant="primary" className="ml-auto" onClick={() => router.push("/")}>
            <Plus className="h-4 w-4" /> Create new
          </Button>
        </div>
        <p className="mb-5 text-sm text-muted">Saved lists and segments, maintained separately from any single run.</p>

        {/* Saved segments */}
        <p className="eyebrow mb-2">Saved segments</p>
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              onClick={() => { setAutoRun(false); enterAt(2); router.push("/workbook"); }}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary-border hover:bg-primary-subtle/20"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted"><Tag className="h-3 w-3" /> {seg.tag}</span>
              <span className="font-semibold text-strong">{seg.name}</span>
              <span className="text-sm text-muted">{seg.count} accounts</span>
              <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-primary"><Play className="h-3 w-3" /> Start a run from this list</span>
            </button>
          ))}
        </div>

        {/* Accounts table */}
        <div className="mb-2 flex items-center gap-2">
          <p className="eyebrow">All leads · {accounts.length}</p>
          {selected.length > 0 && (
            <Button size="sm" variant="primary" className="ml-auto" onClick={() => { setAutoRun(false); enterAt(3); router.push("/workbook"); }}>
              <MessageSquareText className="h-3.5 w-3.5" /> Personalize {selected.length} selected
            </Button>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left">
                <th className="w-10 px-4 py-2.5" />
                {["Account", "Industry", "Location", "Employees", "Routing", ""].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(a.id)}
                      onChange={() => toggle(a.id)}
                      className="accent-[var(--primary)]"
                      aria-label={`Select ${a.name}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2 font-medium text-strong">
                      <Building2 className="h-3.5 w-3.5 text-muted" /> {a.name}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-text">{a.firmographics.industry}</td>
                  <td className="px-3 py-3 text-muted">{a.location}</td>
                  <td className="px-3 py-3 tabular-nums text-muted">{a.firmographics.employees}</td>
                  <td className="px-3 py-3"><Badge tone={routingTone(a.routingBadge)} uppercase>{a.routingBadge}</Badge></td>
                  <td className="px-3 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setAutoRun(false); openAccount(a.id, 3); router.push("/workbook"); }}>
                      Open <MessageSquareText className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
