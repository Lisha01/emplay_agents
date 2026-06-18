"use client";

import { useMemo, useState } from "react";
import { ArrowUp, Sparkles } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { useRenewalStore } from "@/lib/renewalStore";
import { gbpCompact } from "@/lib/renewalData";
import { PostureChip } from "./RenewalUI";

/**
 * Persistent command bar for the renewal workspace. Typing `#` opens an account
 * picker (autocomplete over the book); anything else is an ask-anything prompt
 * (mock — acknowledged via toast). Mirrors the demand-gen CommandBar pattern.
 */
export function RenewalCommandBar({ placeholder = "Ask anything, or type # to open an account." }: { placeholder?: string }) {
  const accounts = useRenewalStore((s) => s.accounts);
  const openAccount = useRenewalStore((s) => s.openAccount);
  const addToast = useStore((s) => s.addToast);
  const [value, setValue] = useState("");

  const picking = value.trimStart().startsWith("#");
  const query = picking ? value.trimStart().slice(1).trim().toLowerCase() : "";

  const matches = useMemo(
    () => (picking ? accounts.filter((a) => !query || a.customer.toLowerCase().includes(query) || a.segment.toLowerCase().includes(query)) : []),
    [picking, query, accounts],
  );

  const open = (id: string) => {
    openAccount(id);
    setValue("");
  };

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    if (picking) {
      if (matches[0]) open(matches[0].id);
      return;
    }
    addToast("Looking into that…");
    setValue("");
  };

  return (
    <div className="border-t border-border bg-surface px-4 py-3">
      <div className="relative mx-auto max-w-4xl">
        {/* `#` account picker */}
        {picking && (
          <div className="absolute bottom-full mb-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <p className="border-b border-border-subtle px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted">
              Open an account {matches.length > 0 && `· ${matches.length}`}
            </p>
            {matches.length === 0 ? (
              <p className="px-3 py-3 text-[13px] text-muted">No accounts match “{query}”.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto py-1">
                {matches.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => open(a.id)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-muted"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-strong">{a.customer}</span>
                      <span className="block truncate text-xs text-muted">{a.segment} · {gbpCompact(a.value)}/yr · {a.daysToExpiry}d</span>
                    </span>
                    <PostureChip posture={a.posture} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 transition-colors hover:border-primary-border hover:bg-surface focus-within:border-primary focus-within:bg-surface">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-strong outline-none placeholder:text-muted"
          />
          <button
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Send"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
