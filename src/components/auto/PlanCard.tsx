"use client";

import { useState } from "react";
import { ArrowRight, ArrowUp, Sparkles } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import type { Channel } from "@/lib/types";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { Button } from "@/components/ui/Button";
import { PlanSheetRail } from "./PlanSheetRail";
import { PlanView } from "./PlanView";

/**
 * Step 2 — Plan (the contract). Renders the shared, fully-editable {@link PlanView}
 * (funnel overview, clarify Q&A, sequence, cadence, sources, escalation rules) under
 * a sticky footer for natural-language edits and "Approve & run". After approval the
 * autonomous run shows the same PlanView read-only, so the rep sees the exact plan
 * they signed off on — questions and answers included.
 */
export function PlanCard() {
  const plan = useStore((s) => s.plan);
  const patchPlan = useStore((s) => s.patchPlan);
  const approveAndRun = useStore((s) => s.approveAndRun);
  const command = useStore((s) => s.command);
  const [edit, setEdit] = useState("");
  if (!plan) return null;

  // Natural-language edits dropped in the footer box. A few intents are applied
  // deterministically; anything else is captured as an escalation rule.
  const applyEdit = () => {
    const text = edit.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const capMatch = lower.match(/(\d{1,3})\s*%?/);
    const variantMatch = lower.match(/(\d{1,2})\s*(?:a\/b|ab|variant)/);
    let ack = "Applied to the plan.";

    if (/(cap|discount)/.test(lower) && capMatch) {
      const v = Math.max(0, Math.min(100, Number(capMatch[1])));
      patchPlan({
        recommendation: {
          ...plan.recommendation,
          discount: { ...plan.recommendation.discount, maxPct: v, appliedPct: Math.min(plan.recommendation.discount.appliedPct, v) },
        },
      });
      ack = `Capped discount at ${v}%.`;
    } else if (variantMatch) {
      const v = Math.max(1, Math.min(6, Number(variantMatch[1])));
      patchPlan({ recommendation: { ...plan.recommendation, abVariants: v } });
      ack = `Set A/B variants to ${v}.`;
    } else if (/whatsapp/.test(lower) && !plan.sequence.some((s) => s.channel === "whatsapp")) {
      const sequence = [...plan.sequence, { channel: "whatsapp" as Channel, label: "WhatsApp", touches: 3, window: "Day 0 → Day 8" }];
      patchPlan({ sequence, channels: sequence.map((s) => s.channel) });
      ack = "Added a WhatsApp channel.";
    } else {
      patchPlan({ escalationRules: [...plan.escalationRules, text] });
      ack = "Added it as an escalation rule.";
    }
    command(text, ack, "Plan");
    setEdit("");
  };

  const footer = (
    <div className="flex items-center gap-3 border-t border-border bg-surface px-3 py-3">
      {/* Far left — drop natural-language edits to the plan */}
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 transition-colors hover:border-primary-border hover:bg-surface focus-within:border-primary focus-within:bg-surface">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <input
          value={edit}
          onChange={(e) => setEdit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyEdit()}
          placeholder="Drop edits to the plan — e.g. 'cap discount at 15%', 'add WhatsApp', 'review first batch'"
          className="min-w-0 flex-1 bg-transparent text-sm text-strong outline-none placeholder:text-muted"
        />
        <button
          onClick={applyEdit}
          disabled={!edit.trim()}
          aria-label="Apply edit"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      {/* Right — apply the dropped edits, then approve & run */}
      <Button variant="outline" className="shrink-0" onClick={applyEdit} disabled={!edit.trim()}>
        Apply changes
      </Button>
      <Button variant="primary" className="shrink-0" onClick={approveAndRun} disabled={plan.sequence.length === 0}>
        Approve &amp; run
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return <WorkbookShell sheets={<PlanSheetRail />} canvas={<PlanView />} footer={footer} />;
}
