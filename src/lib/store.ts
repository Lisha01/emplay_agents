"use client";

import { create } from "zustand";
import type {
  ActionType,
  AgentStep,
  AutoPhase,
  Campaign,
  Channel,
  ChatMessage,
  ClarifyAnswers,
  Lead,
  Mode,
  Plan,
  Rule,
  RunAttentionItem,
  Scenario,
  Touch,
} from "./types";
import * as seed from "./mockData";
import { derivePlan, runAttentionItems } from "./autoMode";

let idCounter = 1000;
const nextId = (p: string) => `${p}-${++idCounter}`;
// Runtime-only (called on user interaction, never during SSR) so no hydration mismatch.
const timeLabel = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Human label for a next-best action type (toasts, chat, chips). */
export const actionLabel = (a: ActionType): string =>
  ({
    call: "Call",
    campaign_ab: "Campaign · A/B",
    discount_bundle: "Discount / bundle",
    assign_partner: "Assign to partner",
    new_opportunity: "New opportunity",
  })[a];

const seedChat = (): ChatMessage[] => [
  { id: "msg-1", role: "user", text: seed.ORIGIN_BRIEF, at: "9:00 AM" },
  {
    id: "msg-2",
    role: "agent",
    text: `Found ${seed.leads.length} Product Managers across Tech/SaaS + Telecom in New York.`,
    at: "9:00 AM",
  },
];

export interface Toast {
  id: string;
  message: string;
  tone?: "default" | "success";
}

interface State {
  // shell / run config
  mode: Mode;
  scenario: Scenario;
  currentStep: AgentStep;
  maxStepReached: AgentStep;
  brief: string;
  generating: boolean;
  planFirst: boolean; // Auto-mode option: review the plan before generating the list
  autoRunActive: boolean; // Auto mode is running the full pipeline autonomously

  // auto ("autonomous") mode — plan-first flow (Clarify → Plan → Run → Attention)
  autoPhase: AutoPhase;
  clarifyAnswers: ClarifyAnswers;
  plan: Plan | null;
  runAttention: RunAttentionItem[];

  // data (cloned from seed so resetDemo is clean)
  leads: Lead[];
  accounts: typeof seed.accounts;
  contacts: typeof seed.contacts;
  sequences: typeof seed.sequences;
  campaigns: Campaign[];
  todos: typeof seed.todos;
  notifications: typeof seed.notifications;
  attentionItems: typeof seed.attentionItems;

  // recommendation stage (this prompt) — segments, rules, suggestions, margins
  segments: typeof seed.segments;
  recommendationRules: Rule[];
  ruleSuggestions: Rule[];
  marginInputs: typeof seed.marginInputs;

  // selections / focus
  researchSelection: string[]; // lead ids selected in Research
  qualifiedLeadIds: string[]; // pushed into Qualification
  qualSelection: string[]; // selected in Qualification to recommend
  expandedLeadId: string | null;
  personalizeAccountIds: string[]; // pushed into the Recommendation/outreach path
  activeAccountId: string | null;
  focusedContactId: string | null;
  activeSegmentId: string | null; // segment in focus on the Recommendation screen
  segmentActionOverride: Record<string, ActionType>; // rep-switched action per segment

  chat: ChatMessage[];
  toasts: Toast[];

  // actions
  setMode: (m: Mode) => void;
  setScenario: (s: Scenario) => void;
  setPlanFirst: (v: boolean) => void;
  setAutoRun: (v: boolean) => void;

  // auto-mode actions
  startAuto: (brief: string) => void;
  setClarifyAnswer: (segmentId: string, choiceId: string, multi?: boolean) => void;
  buildPlan: () => void;
  updatePlanAssumption: (segmentId: string, choiceId: string) => void;
  patchPlan: (patch: Partial<Plan>) => void;
  approveAndRun: () => void;
  advanceRun: (step: AgentStep) => void;
  completeRun: () => void;
  addTodos: (labels: string[]) => void;
  setStep: (s: AgentStep) => void;
  startRun: (brief: string) => void;
  enterAt: (step: AgentStep) => void;
  openAccountInWorkbook: (accountId: string, step: AgentStep) => void;

  toggleResearchSelect: (id: string) => void;
  setResearchSelection: (ids: string[]) => void;
  pushToQualification: () => void;

  toggleExpand: (id: string) => void;
  toggleQueue: (id: string) => void;
  removeLead: (id: string) => void;
  toggleQualSelect: (id: string) => void;
  setQualSelection: (ids: string[]) => void;
  pushToRecommendation: () => void;

  // recommendation-stage actions
  setActiveSegment: (id: string) => void;
  setSegmentAction: (segmentId: string, action: ActionType) => void;
  setSegmentDiscount: (segmentId: string, appliedPct: number) => void;
  saveRule: (rule: Omit<Rule, "id">) => void;
  applyRuleSuggestion: (suggestionId: string) => void;
  escalateOverCap: (segmentId: string, requestedPct: number) => void;

  setFocusedContact: (id: string) => void;
  updateTouch: (accountId: string, channel: Channel, touchId: string, patch: Partial<Touch>) => void;
  approveTouch: (accountId: string, channel: Channel, touchId: string) => void;
  deleteTouch: (accountId: string, channel: Channel, touchId: string) => void;
  tightenAllDMs: (accountId: string) => void;
  sendToCampaigns: (accountId: string) => void;
  deleteCampaign: (id: string) => void;
  clearCampaigns: () => void;

  toggleTodo: (id: string) => void;
  addChat: (role: ChatMessage["role"], text: string, scope?: string) => void;
  command: (text: string, ack: string, scope?: string) => void;
  addToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  resetDemo: () => void;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const freshData = () => ({
  leads: clone(seed.leads),
  accounts: clone(seed.accounts),
  contacts: clone(seed.contacts),
  sequences: clone(seed.sequences),
  campaigns: clone(seed.campaigns),
  todos: clone(seed.todos),
  notifications: clone(seed.notifications),
  attentionItems: clone(seed.attentionItems),
  segments: clone(seed.segments),
  recommendationRules: clone(seed.recommendationRules),
  ruleSuggestions: clone(seed.ruleSuggestions),
  marginInputs: clone(seed.marginInputs),
});

export const useStore = create<State>((set, get) => ({
  mode: "autonomous",
  scenario: "expansion",
  currentStep: 1,
  maxStepReached: 1,
  brief: seed.ORIGIN_BRIEF,
  generating: false,
  planFirst: false,
  autoRunActive: false,
  autoPhase: "clarify",
  clarifyAnswers: {},
  plan: null,
  runAttention: [],
  ...freshData(),

  researchSelection: [],
  qualifiedLeadIds: [],
  qualSelection: [],
  expandedLeadId: "lead-chris",
  personalizeAccountIds: [],
  activeAccountId: null,
  focusedContactId: null,
  activeSegmentId: null,
  segmentActionOverride: {},
  chat: seedChat(),
  toasts: [],

  setMode: (mode) => set({ mode }),
  setScenario: (scenario) => set({ scenario }),
  setPlanFirst: (planFirst) => set({ planFirst }),
  setAutoRun: (autoRunActive) => set({ autoRunActive }),

  // ── Auto mode (plan-first) ────────────────────────────────────────────────
  startAuto: (brief) => {
    set({
      mode: "autonomous",
      autoRunActive: true,
      autoPhase: "clarify",
      brief,
      clarifyAnswers: {}, // nothing pre-selected — the rep makes every choice
      plan: null,
      runAttention: [],
      generating: false,
      currentStep: 1,
      maxStepReached: 1,
      researchSelection: [],
      qualifiedLeadIds: [],
      qualSelection: [],
      personalizeAccountIds: [],
      activeAccountId: null,
    });
    get().addChat("user", brief, "Auto");
  },

  setClarifyAnswer: (segmentId, choiceId, multi) =>
    set((s) => {
      const prev = s.clarifyAnswers[segmentId] ?? [];
      const next = multi
        ? prev.includes(choiceId)
          ? prev.filter((x) => x !== choiceId)
          : [...prev, choiceId]
        : [choiceId];
      return { clarifyAnswers: { ...s.clarifyAnswers, [segmentId]: next } };
    }),

  buildPlan: () => set((s) => ({ plan: derivePlan(s.clarifyAnswers), autoPhase: "plan" })),

  updatePlanAssumption: (segmentId, choiceId) =>
    set((s) => {
      const clarifyAnswers = { ...s.clarifyAnswers, [segmentId]: [choiceId] };
      const fresh = derivePlan(clarifyAnswers);
      // Re-derive only the answer-driven fields; keep the rep's direct edits to
      // sources, sequence, cadence, and escalation rules.
      const plan: Plan = s.plan
        ? {
            ...s.plan,
            resolvedTargeting: fresh.resolvedTargeting,
            hook: fresh.hook,
            projectedAccounts: fresh.projectedAccounts,
            projectedContacts: fresh.projectedContacts,
            assumptions: fresh.assumptions,
          }
        : fresh;
      return { clarifyAnswers, plan };
    }),

  patchPlan: (patch) => set((s) => ({ plan: s.plan ? { ...s.plan, ...patch } : s.plan })),

  approveAndRun: () => {
    set((s) => ({
      plan: s.plan ? { ...s.plan, status: "approved" } : s.plan,
      autoPhase: "run",
      currentStep: 1,
      maxStepReached: 1,
      qualifiedLeadIds: [],
      qualSelection: [],
      personalizeAccountIds: [],
    }));
    get().addChat("user", "Approve & run", "Auto");
    get().addChat("agent", "Approved — running the full funnel autonomously.", "Auto");
  },

  // Check a stage off the plan rail and populate it with verbatim §6 data so it
  // reads as real when the rep opens it later.
  advanceRun: (step) =>
    set((s) => {
      const base = {
        currentStep: step,
        maxStepReached: Math.max(s.maxStepReached, step) as AgentStep,
      };
      switch (step) {
        case 1:
          return { ...base, qualifiedLeadIds: s.leads.map((l) => l.id) };
        case 2:
          return {
            ...base,
            qualSelection: ["lead-chris", "lead-akshay"],
            expandedLeadId: "lead-chris",
          };
        case 3: {
          // Auto-apply the recommended discount for the discount segment, clamped to the cap.
          const cap = s.plan?.recommendation.discount.maxPct ?? 15;
          return {
            ...base,
            personalizeAccountIds: ["acc-softheon"],
            activeAccountId: "acc-softheon",
            activeSegmentId: "seg-saas",
            segments: s.segments.map((seg) =>
              seg.id === "seg-saas" && seg.discount
                ? { ...seg, discount: { ...seg.discount, appliedPct: Math.min(seg.discount.appliedPct, cap) } }
                : seg,
            ),
          };
        }
        default:
          return base; // 4 (campaign seeded) · 5 (monitor)
      }
    }),

  completeRun: () => {
    // The run stays on screen; the final step's output surfaces the to-dos.
    set({ runAttention: runAttentionItems() });
    get().addChat("agent", "Run complete — 3 items need your attention.", "Auto");
  },
  addTodos: (labels) =>
    set((s) => ({ todos: [...s.todos, ...labels.map((label) => ({ id: nextId("todo"), label, done: false }))] })),
  setStep: (currentStep) =>
    set((s) => ({ currentStep, maxStepReached: Math.max(s.maxStepReached, currentStep) as AgentStep })),

  startRun: (brief) => {
    // A fresh list request resets the pipeline so only Lead Research shows in the rail.
    set({
      brief,
      generating: true,
      currentStep: 1,
      maxStepReached: 1,
      researchSelection: [],
      qualifiedLeadIds: [],
      qualSelection: [],
      personalizeAccountIds: [],
      activeAccountId: null,
    });
    get().addChat("user", brief, "Lead Research");
    setTimeout(() => {
      set({ generating: false });
      get().addChat("agent", `Found ${get().leads.length} leads matching the brief.`, "Lead Research");
    }, 1100);
  },

  enterAt: (step) => {
    if (step === 2) {
      // "I have a qualified list" — drop straight into Qualification with all leads
      set((s) => ({
        currentStep: 2,
        maxStepReached: Math.max(s.maxStepReached, 2) as AgentStep,
        qualifiedLeadIds: s.leads.map((l) => l.id),
        expandedLeadId: "lead-chris",
      }));
    } else if (step === 3) {
      // "I have target accounts" — drop into Recommendation on the SaaS segment
      set((s) => ({
        currentStep: 3,
        maxStepReached: Math.max(s.maxStepReached, 3) as AgentStep,
        personalizeAccountIds: ["acc-softheon"],
        activeAccountId: "acc-softheon",
        activeSegmentId: "seg-saas",
      }));
    } else {
      get().setStep(step);
    }
  },

  openAccountInWorkbook: (accountId, step) =>
    set((s) => ({
      currentStep: step,
      maxStepReached: Math.max(s.maxStepReached, step) as AgentStep,
      activeAccountId: accountId,
      personalizeAccountIds: s.personalizeAccountIds.includes(accountId)
        ? s.personalizeAccountIds
        : [...s.personalizeAccountIds, accountId],
      focusedContactId:
        s.contacts.find((c) => c.accountId === accountId && c.focused)?.id ??
        s.contacts.find((c) => c.accountId === accountId)?.id ??
        null,
      // If we're dropping into Recommendation, focus the segment that holds the account.
      activeSegmentId:
        step === 3
          ? s.segments.find((seg) => seg.accountIds.includes(accountId))?.id ?? s.activeSegmentId
          : s.activeSegmentId,
    })),

  toggleResearchSelect: (id) =>
    set((s) => ({
      researchSelection: s.researchSelection.includes(id)
        ? s.researchSelection.filter((x) => x !== id)
        : [...s.researchSelection, id],
    })),
  setResearchSelection: (researchSelection) => set({ researchSelection }),

  pushToQualification: () => {
    const { researchSelection, leads } = get();
    const ids = researchSelection.length ? researchSelection : leads.map((l) => l.id);
    set((s) => ({
      qualifiedLeadIds: ids,
      currentStep: 2,
      maxStepReached: Math.max(s.maxStepReached, 2) as AgentStep,
      expandedLeadId: ids.includes("lead-chris") ? "lead-chris" : ids[0] ?? null,
    }));
    get().addChat("user", `Qualify ${ids.length} selected lead${ids.length === 1 ? "" : "s"}`, "Lead Research");
    get().addChat("agent", `Pushed ${ids.length} lead${ids.length === 1 ? "" : "s"} to Qualification.`, "Qualification");
    get().addToast(`${ids.length} lead${ids.length === 1 ? "" : "s"} pushed to Qualification`, "success");
  },

  toggleExpand: (id) => set((s) => ({ expandedLeadId: s.expandedLeadId === id ? null : id })),

  toggleQueue: (id) =>
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, queued: !l.queued } : l)) })),

  removeLead: (id) =>
    set((s) => ({
      leads: s.leads.filter((l) => l.id !== id),
      qualifiedLeadIds: s.qualifiedLeadIds.filter((x) => x !== id),
      qualSelection: s.qualSelection.filter((x) => x !== id),
      expandedLeadId: s.expandedLeadId === id ? null : s.expandedLeadId,
    })),

  toggleQualSelect: (id) =>
    set((s) => ({
      qualSelection: s.qualSelection.includes(id)
        ? s.qualSelection.filter((x) => x !== id)
        : [...s.qualSelection, id],
    })),
  setQualSelection: (qualSelection) => set({ qualSelection }),

  pushToRecommendation: () => {
    const { qualSelection, leads, segments } = get();
    const selected = qualSelection.length ? qualSelection : ["lead-chris"];
    const accountIds = Array.from(
      new Set(selected.map((id) => leads.find((l) => l.id === id)?.accountId).filter(Boolean) as string[]),
    );
    const targets = accountIds.length ? accountIds : ["acc-softheon"];
    // Land on the segment that contains the first pushed account (else the first segment).
    const activeSegmentId =
      segments.find((seg) => seg.accountIds.some((a) => targets.includes(a)))?.id ?? segments[0]?.id ?? null;
    set((s) => ({
      personalizeAccountIds: targets,
      activeAccountId: targets[0],
      activeSegmentId,
      currentStep: 3,
      maxStepReached: Math.max(s.maxStepReached, 3) as AgentStep,
    }));
    get().addChat("user", `Recommend next-best actions for ${targets.length} account${targets.length === 1 ? "" : "s"}`, "Qualification");
    get().addChat("agent", `Bundled ${targets.length} account${targets.length === 1 ? "" : "s"} into segments and surfaced next-bests.`, "Recommendation");
    get().addToast(`${targets.length} account${targets.length === 1 ? "" : "s"} pushed to Recommendation`, "success");
  },

  // ── Recommendation stage ────────────────────────────────────────────────────
  setActiveSegment: (id) => set({ activeSegmentId: id }),

  setSegmentAction: (segmentId, action) => {
    set((s) => ({ segmentActionOverride: { ...s.segmentActionOverride, [segmentId]: action } }));
    const seg = get().segments.find((x) => x.id === segmentId);
    if (seg) get().addToast(`${seg.name} → ${actionLabel(action)}`);
  },

  setSegmentDiscount: (segmentId, appliedPct) =>
    set((s) => ({
      segments: s.segments.map((seg) =>
        seg.id !== segmentId || !seg.discount
          ? seg
          : {
              ...seg,
              discount: {
                ...seg.discount,
                appliedPct: Math.round(
                  Math.max(seg.discount.minPct, Math.min(seg.discount.maxPct, appliedPct)),
                ),
              },
            },
      ),
    })),

  saveRule: (rule) =>
    set((s) => ({ recommendationRules: [...s.recommendationRules, { ...rule, id: nextId("rule") }] })),

  applyRuleSuggestion: (suggestionId) =>
    set((s) => {
      const sug = s.ruleSuggestions.find((x) => x.id === suggestionId);
      if (!sug) return {};
      get().addToast("Suggestion applied as a rule", "success");
      return {
        ruleSuggestions: s.ruleSuggestions.filter((x) => x.id !== suggestionId),
        recommendationRules: [...s.recommendationRules, { ...sug, source: "analytics" as const }],
      };
    }),

  escalateOverCap: (segmentId, requestedPct) =>
    set((s) => {
      const seg = s.segments.find((x) => x.id === segmentId);
      const cap = s.plan?.recommendation.discount.maxPct ?? 15;
      const id = `rat-overcap-${segmentId}`;
      if (s.runAttention.some((r) => r.id === id)) return {};
      const item: RunAttentionItem = {
        id,
        title: `${seg?.name ?? "Segment"} wants ${requestedPct}% — beyond your ${cap}% cap`,
        detail: "The requested discount clears your cap. Approve it, or counter within the cap.",
        accountId: seg?.accountIds[0],
        step: 3,
        priority: "now",
        actions: [{ label: `Approve ${requestedPct}%`, primary: true }, { label: "Counter" }],
      };
      get().addToast(`Escalated — ${requestedPct}% is beyond your ${cap}% cap`);
      return { runAttention: [item, ...s.runAttention] };
    }),

  setFocusedContact: (id) =>
    set((s) => ({
      focusedContactId: id,
      contacts: s.contacts.map((c) => ({ ...c, focused: c.id === id ? true : c.accountId === s.activeAccountId ? false : c.focused })),
    })),

  updateTouch: (accountId, channel, touchId, patch) =>
    set((s) => ({
      sequences: s.sequences.map((seq) =>
        seq.accountId !== accountId
          ? seq
          : {
              ...seq,
              byChannel: {
                ...seq.byChannel,
                [channel]: seq.byChannel[channel] && {
                  ...seq.byChannel[channel]!,
                  touches: seq.byChannel[channel]!.touches.map((t) =>
                    t.id === touchId ? { ...t, ...patch } : t,
                  ),
                },
              },
            },
      ),
    })),

  approveTouch: (accountId, channel, touchId) =>
    get().updateTouch(accountId, channel, touchId, { state: "approved" }),

  deleteTouch: (accountId, channel, touchId) =>
    set((s) => ({
      sequences: s.sequences.map((seq) =>
        seq.accountId !== accountId
          ? seq
          : {
              ...seq,
              byChannel: {
                ...seq.byChannel,
                [channel]: seq.byChannel[channel] && {
                  ...seq.byChannel[channel]!,
                  touches: seq.byChannel[channel]!.touches.filter((t) => t.id !== touchId),
                },
              },
            },
      ),
    })),

  tightenAllDMs: (accountId) => {
    set((s) => ({
      sequences: s.sequences.map((seq) =>
        seq.accountId !== accountId
          ? seq
          : {
              ...seq,
              byChannel: Object.fromEntries(
                Object.entries(seq.byChannel).map(([ch, cs]) => [
                  ch,
                  cs && { ...cs, touches: cs.touches.map((t) => ({ ...t, state: "approved" as const })) },
                ]),
              ),
            },
      ),
    }));
    const acc = get().accounts.find((a) => a.id === accountId);
    get().addChat("user", "Tighten all DMs", acc?.name);
    get().addChat("agent", "Tightened and approved all DMs.", acc?.name);
    get().addToast("All DMs tightened and approved", "success");
  },

  sendToCampaigns: (accountId) => {
    const acc = get().accounts.find((a) => a.id === accountId);
    if (!acc) return;
    const existing = get().campaigns.find((c) => c.name.startsWith(acc.name));
    if (!existing) {
      const camp: Campaign = {
        id: nextId("camp"),
        name: `${acc.name} — Personalised Outreach`,
        build: "personalisation",
        segment: get().brief,
        status: "running",
        channels: ["linkedin", "email"],
        accounts: acc.contactIds.length,
        sent: acc.contactIds.length,
        replied: 0,
        meetings: 0,
        updated: "just now",
      };
      set((s) => ({ campaigns: [camp, ...s.campaigns] }));
    }
    set((s) => ({ currentStep: 4, maxStepReached: Math.max(s.maxStepReached, 4) as AgentStep }));
    get().addChat("user", "Send to Campaigns", acc.name);
    get().addChat("agent", `Launched "${acc.name} — Personalised Outreach" to Campaigns.`, acc.name);
    get().addToast(`${acc.name} launched to Campaigns`, "success");
  },

  deleteCampaign: (id) => {
    set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }));
    get().addToast("Campaign deleted", "success");
  },
  clearCampaigns: () => {
    set({ campaigns: [] });
    get().addToast("All campaigns deleted", "success");
  },

  toggleTodo: (id) =>
    set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),

  addChat: (role, text, scope) =>
    set((s) => ({ chat: [...s.chat, { id: nextId("msg"), role, text, scope, at: timeLabel() }] })),

  command: (text, ack, scope) => {
    get().addChat("user", text, scope);
    get().addChat("agent", ack, scope);
    get().addToast(ack);
  },

  addToast: (message, tone = "default") => {
    const id = nextId("toast");
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  resetDemo: () =>
    set({
      mode: "autonomous",
      scenario: "expansion",
      currentStep: 1,
      maxStepReached: 1,
      brief: seed.ORIGIN_BRIEF,
      generating: false,
      planFirst: false,
      autoRunActive: false,
      autoPhase: "clarify",
      clarifyAnswers: {},
      plan: null,
      runAttention: [],
      ...freshData(),
      researchSelection: [],
      qualifiedLeadIds: [],
      qualSelection: [],
      expandedLeadId: "lead-chris",
      personalizeAccountIds: [],
      activeAccountId: null,
      focusedContactId: null,
      activeSegmentId: null,
      segmentActionOverride: {},
      chat: seedChat(),
      toasts: [],
    }),
}));
