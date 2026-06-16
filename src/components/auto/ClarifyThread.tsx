"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessageSquareDashed, Sparkles } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { CLARIFY_QUESTIONS } from "@/lib/autoMode";
import { WorkbookShell } from "@/components/workbook/WorkbookShell";
import { Button } from "@/components/ui/Button";
import { prefersReducedMotion } from "@/lib/utils";
import { ChoiceChips } from "./ChoiceChips";
import { PlanSheetRail } from "./PlanSheetRail";

/**
 * Step 1 — Clarify. The agent asks a small set of questions as tappable chips
 * (no free text); everything else is assumed silently from config. Answering all
 * segments of a question advances the thread; the last one builds the Plan.
 */
export function ClarifyThread() {
  const brief = useStore((s) => s.brief);
  const answers = useStore((s) => s.clarifyAnswers);
  const setAnswer = useStore((s) => s.setClarifyAnswer);
  const buildPlan = useStore((s) => s.buildPlan);
  const addChat = useStore((s) => s.addChat);

  const [index, setIndex] = useState(0);
  // Questions the user has actually tapped — so a smart-default-filled question
  // (e.g. customer scope) isn't auto-skipped before they confirm it.
  const [touched, setTouched] = useState<string[]>([]);
  const acked = useRef<Set<string>>(new Set());

  const isAnswered = (qi: number) =>
    CLARIFY_QUESTIONS[qi].segments.every((seg) => (answers[seg.id]?.length ?? 0) > 0);

  // The user's chosen chips for a question, as a readable line for the chat history.
  const answerSummary = (q: (typeof CLARIFY_QUESTIONS)[number]) =>
    q.segments
      .map((seg) =>
        (answers[seg.id] ?? [])
          .map((id) => seg.options.find((o) => o.id === id)?.label)
          .filter(Boolean)
          .join(", "),
      )
      .filter(Boolean)
      .join(" · ");

  // Advance once the active question is confirmed + fully answered. The Plan is NOT
  // built automatically — the user generates it from the sticky footer button.
  // The question, the chosen answer, and the ack are recorded to the chat history.
  useEffect(() => {
    if (index >= CLARIFY_QUESTIONS.length) return;
    const q = CLARIFY_QUESTIONS[index];
    if (!touched.includes(q.id) || !isAnswered(index) || acked.current.has(q.id)) return;
    acked.current.add(q.id);
    const advance = () => {
      addChat("agent", q.question, "Auto");
      addChat("user", answerSummary(q), "Auto");
      addChat("agent", q.ack, "Auto");
      setIndex((i) => i + 1);
    };
    const t = setTimeout(advance, prefersReducedMotion() ? 0 : 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, index, touched]);

  const allDone = index >= CLARIFY_QUESTIONS.length;

  // When a new question appears, scroll the canvas to the bottom so it's in view.
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "end",
    });
  }, [index]);

  const shown = Math.min(index, CLARIFY_QUESTIONS.length - 1);
  const progress = Math.min(index + 1, CLARIFY_QUESTIONS.length);

  const canvas = (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-semibold text-strong">A few quick questions</h2>
        <span className="ml-auto rounded-full bg-surface-muted px-2.5 py-0.5 text-xs tabular-nums text-muted">
          {progress} of {CLARIFY_QUESTIONS.length}
        </span>
      </div>
      <p className="mb-6 text-sm text-muted">
        Just a few — everything else comes from your settings. Once you&rsquo;ve answered, generate the
        plan and review it before anything runs.
      </p>

      {/* The originating brief */}
      <div className="mb-5 flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-fg">
          {brief}
        </p>
      </div>

      <div className="space-y-6">
        {CLARIFY_QUESTIONS.slice(0, shown + 1).map((q, qi) => {
          const active = qi === index;
          return (
            <div key={q.id} className="flex gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1 space-y-3 rounded-2xl rounded-tl-sm border border-border bg-surface p-4">
                <p className="text-sm text-strong">{q.question}</p>
                {q.segments.map((seg) => (
                  <div key={seg.id} className="space-y-1.5">
                    {seg.label && <p className="eyebrow">{seg.label}</p>}
                    <ChoiceChips
                      options={seg.options}
                      selected={answers[seg.id] ?? []}
                      locked={!active}
                      onSelect={(id) => {
                        setAnswer(seg.id, id, seg.multi);
                        setTouched((t) => (t.includes(q.id) ? t : [...t, q.id]));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} aria-hidden className="h-px" />
    </div>
  );

  const footer = (
    <div className="flex items-center gap-3 border-t border-border bg-surface px-4 py-3">
      <MessageSquareDashed className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-[13px] text-muted">
        {allDone
          ? "All questions answered — everything else is assumed from config."
          : `Answer the questions to continue · ${progress} of ${CLARIFY_QUESTIONS.length}`}
      </span>
      <Button variant="primary" className="ml-auto" onClick={buildPlan} disabled={!allDone}>
        Generate plan
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return <WorkbookShell sheets={<PlanSheetRail />} canvas={canvas} footer={footer} />;
}
