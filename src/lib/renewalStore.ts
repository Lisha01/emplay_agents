"use client";

// Renewal-scoped state, kept in its own Zustand store so the demand-gen store is
// never touched. Toasts reuse the existing global store's `addToast` (read-only use
// of an existing action — no modification). Mock-only; no network, no localStorage.

import { create } from "zustand";
import { useStore } from "./store";
import type { ChatMessage } from "./types";
import type { RenewalAccount, RenewalApproval, RenewalActionId, RenewalPlay, RenewalTab } from "./renewalTypes";
import { renewalAccounts, renewalAlerts, seedApprovals, RENEWED_THIS_MONTH } from "./renewalData";
import { accountFacts } from "./renewalFacts";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
let ruleSeq = 100;
let chatSeq = 0;
// Runtime-only (user interaction, never SSR) so there's no hydration mismatch.
const timeLabel = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const firstName = (n?: string) => n?.split(" ")[0] ?? "there";
const callScriptFor = (a: RenewalAccount) =>
  `Objective — defend ${a.customer}'s renewal on value, not price.\n` +
  `• Open: acknowledge ${a.contacts[0]?.name ?? "the contact"} and the ${a.daysToExpiry}-day window.\n` +
  `• Anchor on outcomes and service performance; reference ${a.performanceNote}.\n` +
  `• Land the recommended ${a.offer.appliedPct}% as the reason to stay.\n` +
  `• Close: agree the next step before ${a.contractEnd}.`;
const emailDraftFor = (a: RenewalAccount) =>
  `Subject: Your ${a.customer} renewal — a plan before ${a.contractEnd}\n\n` +
  `Hi ${firstName(a.contacts[0]?.name)},\n\n` +
  `Ahead of your renewal in ${a.daysToExpiry} days, we've put together a plan that protects your ` +
  `service and reflects a ${a.offer.appliedPct}% adjustment. Happy to walk through it this week.\n\n` +
  `Best,\nAanya`;

/** Default the play's actions from the recommended move (pre-selected, opt-out — §14.4). */
const defaultActions = (a: RenewalAccount): RenewalActionId[] =>
  a.recommendedMove.action === "confirm" ? ["offer"] : ["offer", "call", "email"];

interface RenewalState {
  accounts: RenewalAccount[];
  approvals: RenewalApproval[];
  alerts: typeof renewalAlerts;
  activeAccountId: string | null;
  activeTab: RenewalTab;
  offeredAccountIds: string[]; // "saving offered" this cycle
  renewedAccountIds: string[]; // confirmed renewals (in-book)
  renewedThisMonth: number; // dashboard metric (seed + confirmed)
  savedRules: { id: string; text: string }[]; // learning loop

  // Account-workspace play pipeline (PRD §6.2)
  currentStage: number; // Brief(1) → Plan(2) → Recommendation(3) → Build(4) → Approval(5)
  maxStageReached: number;
  chat: ChatMessage[]; // the co-pilot pane (per session)
  play: RenewalPlay | null; // the play being assembled for the active account

  openAccount: (id: string, tab?: RenewalTab) => void;
  closeAccount: () => void;
  setTab: (tab: RenewalTab) => void;
  setStage: (step: number) => void;
  addChat: (role: "user" | "agent", text: string, scope?: string) => void;
  command: (text: string, ack: string, scope?: string) => void;
  setOfferPct: (accountId: string, pct: number) => void;
  snapToCap: (accountId: string) => void;
  escalateOffer: (accountId: string, pct: number) => void;
  makeOffer: (accountId: string) => void;
  confirmRenewal: (accountId: string) => void;
  saveRule: (text: string) => void;
  // play lifecycle
  togglePlayAction: (id: RenewalActionId) => void;
  setBillingResolved: (resolved: boolean) => void;
  regenerateArtifacts: () => void;
  submitPlay: () => void;
}

const toast = (message: string, tone?: "default" | "success") => useStore.getState().addToast(message, tone);

export const useRenewalStore = create<RenewalState>((set, get) => ({
  accounts: clone(renewalAccounts),
  approvals: clone(seedApprovals),
  alerts: clone(renewalAlerts),
  activeAccountId: null,
  activeTab: "summary",
  offeredAccountIds: [],
  renewedAccountIds: [],
  renewedThisMonth: RENEWED_THIS_MONTH,
  savedRules: [],
  currentStage: 1,
  maxStageReached: 1,
  chat: [],
  play: null,

  openAccount: (id, tab) => {
    const a = get().accounts.find((x) => x.id === id);
    set({
      activeAccountId: id,
      activeTab: tab ?? "summary",
      currentStage: 1,
      // Brief, Recommendation and Campaign are prepared up front — the seller can step
      // through all three on open; Approval unlocks once they launch the campaign.
      maxStageReached: 3,
      chat: [],
      play: a
        ? { accountId: id, chosenActions: defaultActions(a), billingResolved: !a.billingDiscrepancy, state: "draft", staleArtifacts: false }
        : null,
    });
  },
  closeAccount: () => set({ activeAccountId: null, play: null }),
  setTab: (activeTab) => set({ activeTab }),

  setStage: (step) =>
    set((s) => ({ currentStage: step, maxStageReached: Math.max(s.maxStageReached, step) })),

  addChat: (role, text, scope) =>
    set((s) => ({ chat: [...s.chat, { id: `rc-${++chatSeq}`, role, text, scope, at: timeLabel() }] })),

  command: (text, ack, scope) => {
    get().addChat("user", text, scope);
    get().addChat("agent", ack, scope);
    toast(ack);
  },

  setOfferPct: (accountId, pct) =>
    set((s) => ({
      // Changing the canonical discount invalidates any generated artifacts (SoT-3).
      play: s.play && s.play.accountId === accountId ? { ...s.play, staleArtifacts: true } : s.play,
      accounts: s.accounts.map((a) =>
        a.id !== accountId
          ? a
          : { ...a, offer: { ...a.offer, appliedPct: Math.round(Math.max(a.offer.minPct, Math.min(a.offer.maxPct, pct))) } },
      ),
    })),

  snapToCap: (accountId) => {
    const a = get().accounts.find((x) => x.id === accountId);
    if (a) get().setOfferPct(accountId, a.offer.capPct);
  },

  escalateOffer: (accountId, pct) =>
    set((s) => {
      const a = s.accounts.find((x) => x.id === accountId);
      if (!a) return {};
      const id = `rapp-${accountId}`;
      if (s.approvals.some((r) => r.id === id)) {
        toast(`${a.customer} is already in Approvals`);
        return {};
      }
      toast(`Escalated — ${pct}% is over your ${a.offer.capPct}% cap`);
      return {
        approvals: [
          { id, accountId, customer: a.customer, requestedPct: pct, capPct: a.offer.capPct, reason: `Discount of ${pct}% breaches the ${a.offer.capPct}% protected-margin cap.` },
          ...s.approvals,
        ],
      };
    }),

  makeOffer: (accountId) => {
    const a = get().accounts.find((x) => x.id === accountId);
    if (!a) return;
    set((s) => ({ offeredAccountIds: s.offeredAccountIds.includes(accountId) ? s.offeredAccountIds : [...s.offeredAccountIds, accountId] }));
    toast(`Offer prepared for ${a.customer}`, "success");
  },

  confirmRenewal: (accountId) => {
    const a = get().accounts.find((x) => x.id === accountId);
    if (!a) return;
    set((s) =>
      s.renewedAccountIds.includes(accountId)
        ? {}
        : { renewedAccountIds: [...s.renewedAccountIds, accountId], renewedThisMonth: s.renewedThisMonth + 1 },
    );
    toast(`${a.customer} confirmed for auto-renewal`, "success");
  },

  saveRule: (text) => {
    set((s) => ({ savedRules: [...s.savedRules, { id: `rrule-${++ruleSeq}`, text }] }));
    toast("Saved as a rule for similar accounts", "success");
  },

  togglePlayAction: (id) =>
    set((s) => {
      if (!s.play) return {};
      const has = s.play.chosenActions.includes(id);
      const chosenActions = has ? s.play.chosenActions.filter((x) => x !== id) : [...s.play.chosenActions, id];
      return { play: { ...s.play, chosenActions } };
    }),

  setBillingResolved: (resolved) =>
    set((s) => (s.play ? { play: { ...s.play, billingResolved: resolved } } : {})),

  regenerateArtifacts: () =>
    set((s) => {
      const a = s.accounts.find((x) => x.id === s.play?.accountId);
      if (!s.play || !a) return {};
      return {
        play: {
          ...s.play,
          staleArtifacts: false,
          callScript: s.play.chosenActions.includes("call") ? callScriptFor(a) : undefined,
          emailDraft: s.play.chosenActions.includes("email") ? emailDraftFor(a) : undefined,
        },
      };
    }),

  submitPlay: () => {
    const { play, accounts } = get();
    const a = accounts.find((x) => x.id === play?.accountId);
    if (!play || !a) return;
    const facts = accountFacts(a);
    if (facts.guardrail.withinPolicy) {
      set((s) => ({ play: s.play ? { ...s.play, state: "sent" } : s.play }));
      get().makeOffer(a.id);
      toast(`Play sent to ${a.customer}`, "success");
    } else {
      get().escalateOffer(a.id, facts.discountPct);
      set((s) => ({ play: s.play ? { ...s.play, state: "in_review" } : s.play }));
    }
  },
}));
