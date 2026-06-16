import type { Lead } from "@/lib/types";
import type { EditRequest, PlanState, Version } from "./types";

export const INDUSTRY_NAMES = ["Telecom", "Fintech", "Healthcare IT", "Healthcare", "SaaS", "Manufacturing", "Oil & Gas", "Retail", "Insurance"];

/** Parse a headcount value out of free text — replaces, never appends. */
export function parseHeadcount(note: string): string | null {
  const t = note.toLowerCase().replace(/,/g, "");
  const range = t.match(/(\d+)\s*(?:-|–|to)\s*(\d+)/);
  if (range) return `${range[1]}–${range[2]}`;
  const plus = t.match(/(\d+)\s*\+/) || t.match(/(?:over|above|more than|at least|min(?:imum)?)\s*(\d+)/);
  if (plus) return `${plus[1]}+`;
  const upto = t.match(/(?:up to|under|below|less than|max(?:imum)?|≤|<=?)\s*(\d+)/);
  if (upto) return `up to ${upto[1]}`;
  const to = t.match(/\bto\s+(\d+)/);
  if (to) return `201–${to[1]}`;
  const single = t.match(/(\d+)/);
  if (single) return single[1];
  return null;
}

/** Apply queued edits to a base version, deterministically transforming list + plan. */
export function applyEdits(base: Version, edits: EditRequest[], n: number, allItems: Lead[]): Version {
  const byId = (id: string) => allItems.find((l) => l.id === id);
  let itemIds = [...base.itemIds];
  const plan: PlanState = {
    brief: base.plan.brief,
    filters: base.plan.filters.map((f) => ({ ...f })),
    steps: [...base.plan.steps],
  };
  const filter = (label: string) => plan.filters.find((f) => f.label.toLowerCase() === label.toLowerCase());
  const changelog: string[] = [];

  for (const { target, note } of edits) {
    const t = note.toLowerCase();
    const tgt = target.toLowerCase();
    let mutated = false;

    // List — routing / ordering, keyed off the note
    if (/(drop|hide|remove).*nurture/.test(t)) {
      const before = itemIds.length;
      itemIds = itemIds.filter((id) => byId(id)?.routingBadge.toUpperCase() !== "NURTURE");
      if (itemIds.length !== before) mutated = true;
    }
    if (/only.*priority/.test(t)) {
      const keep = t.includes("engage") ? ["PRIORITY", "ENGAGE"] : ["PRIORITY"];
      itemIds = itemIds.filter((id) => keep.includes(byId(id)?.routingBadge.toUpperCase() ?? ""));
      mutated = true;
    }
    if (/sort.*intent/.test(t)) {
      itemIds = [...itemIds].sort((a, b) => (byId(b)?.scorecard.intent ?? 0) - (byId(a)?.scorecard.intent ?? 0));
      mutated = true;
    }

    // Headcount filter — replace value (by target or by mention)
    if (tgt.includes("headcount") || t.includes("headcount") || t.includes("employees") || t.includes("company size")) {
      const val = parseHeadcount(note);
      const f = filter("Headcount");
      if (val && f) {
        f.value = val;
        mutated = true;
      }
    }

    // Industry filter — add / drop a named industry (works from any target)
    if (!mutated) {
      const indName = INDUSTRY_NAMES.find((i) => t.includes(i.toLowerCase()));
      const verb = /\b(add|include)\b/.test(t) ? "add" : /\b(drop|remove|exclude)\b/.test(t) ? "drop" : null;
      const f = filter("Industry");
      if (indName && verb && f) {
        const parts = f.value.split(",").map((s) => s.trim()).filter(Boolean);
        if (verb === "add") {
          if (!parts.some((p) => p.toLowerCase() === indName.toLowerCase())) parts.push(indName);
        } else {
          const i = parts.findIndex((p) => p.toLowerCase() === indName.toLowerCase());
          if (i >= 0) parts.splice(i, 1);
        }
        f.value = parts.join(", ") || "—";
        mutated = true;
      }
    }

    // Any other filter-targeted edit — add / drop / replace its value
    if (!mutated && tgt.startsWith("filter:")) {
      const label = target.slice(target.indexOf(":") + 1).trim();
      const f = filter(label);
      if (f) {
        const add = note.match(/^(?:add|include|append)\s+(.*)/i);
        const drop = note.match(/^(?:drop|remove|exclude)\s+(.*)/i);
        const parts = f.value.split(",").map((s) => s.trim()).filter(Boolean);
        if (add) {
          const val = add[1].trim().replace(/\s+companies?$/i, "");
          if (!parts.some((p) => p.toLowerCase() === val.toLowerCase())) parts.push(val);
          f.value = parts.join(", ");
        } else if (drop) {
          const val = drop[1].trim().replace(/\s+companies?$/i, "");
          f.value = parts.filter((p) => p.toLowerCase() !== val.toLowerCase()).join(", ") || "—";
        } else {
          f.value = note;
        }
        mutated = true;
      }
    }

    if (!mutated) plan.steps.push(note);
    changelog.push(note);
  }

  return { id: `v${n}`, n, changelog: changelog.length ? changelog : ["Re-ran with no changes"], itemIds, plan };
}
