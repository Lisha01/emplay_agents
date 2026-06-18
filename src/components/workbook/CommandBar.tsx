"use client";

import { useState } from "react";
import { ArrowUp, Sparkles } from "@/components/ui/icons";

/**
 * Persistent bottom natural-language input that drives/refines the current step.
 * Placeholder is step-aware and it always shows the current scope (spec §7).
 */
export function CommandBar({
  placeholder,
  scope,
  onSubmit,
}: {
  placeholder: string;
  scope?: string;
  onSubmit?: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) return;
    onSubmit?.(value.trim());
    setValue("");
  };

  return (
    <div className="border-t border-border bg-surface px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 transition-colors hover:border-primary-border hover:bg-surface focus-within:border-primary focus-within:bg-surface">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        {scope && (
          <span className="shrink-0 rounded-md bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
            {scope}
          </span>
        )}
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
  );
}
