"use client";

import { useState } from "react";
import { ArrowUp, Sparkles } from "@/components/ui/icons";
import type { ChatMessage } from "@/lib/types";

/**
 * Generic conversation pane (shared by Demand-Gen and Renewal). Presentational only:
 * the host passes the message list + an onSend handler. Optional suggested-prompt chips
 * seed the empty state.
 */
export function ChatPane({
  messages,
  onSend,
  placeholder = "Message the agent…",
  emptyTitle = "Conversation history",
  suggestions,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  placeholder?: string;
  emptyTitle?: string;
  suggestions?: string[];
}) {
  const [value, setValue] = useState("");
  const send = (text?: string) => {
    const t = (text ?? value).trim();
    if (!t) return;
    onSend(t);
    setValue("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <p className="eyebrow px-1">{emptyTitle}</p>
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex flex-col items-end gap-0.5">
              <div className="max-w-[88%] rounded-2xl rounded-br-sm bg-primary-subtle px-3 py-2 text-[13px] text-strong">{m.text}</div>
              <span className="px-1 text-[10px] text-muted">{m.scope ? `${m.scope} · ${m.at}` : m.at}</span>
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col gap-0.5">
                <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-border-subtle bg-surface px-3 py-2 text-[13px] text-text">{m.text}</div>
                <span className="px-1 text-[10px] text-muted">{m.scope ? `${m.scope} · ${m.at}` : m.at}</span>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="border-t border-border p-2">
        {messages.length === 0 && suggestions && suggestions.length > 0 && (
          <div className="mb-2 flex flex-col gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-left text-[13px] text-text transition-colors hover:border-primary-border hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-2.5 py-1.5 transition-colors hover:border-primary-border hover:bg-surface focus-within:border-primary focus-within:bg-surface">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-strong outline-none placeholder:text-muted"
          />
          <button
            onClick={() => send()}
            disabled={!value.trim()}
            aria-label="Send message"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
