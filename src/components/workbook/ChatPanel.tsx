"use client";

import { useState } from "react";
import { ArrowUp, Sparkles } from "@/components/ui/icons";
import { useStore } from "@/lib/store";

/**
 * Persistent conversation history for the whole Workbook session — every brief, refine,
 * edit request, version, and push made in the right section is logged here. A chat box
 * at the bottom lets the rep message the agent directly.
 */
export function ChatPanel() {
  const chat = useStore((s) => s.chat);
  const addChat = useStore((s) => s.addChat);
  const [value, setValue] = useState("");

  const send = () => {
    const text = value.trim();
    if (!text) return;
    addChat("user", text);
    addChat("agent", "Got it — I'll factor that in.");
    setValue("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <p className="eyebrow px-1">Conversation history</p>
        {chat.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex flex-col items-end gap-0.5">
              <div className="max-w-[88%] rounded-2xl rounded-br-sm bg-primary-subtle px-3 py-2 text-[13px] text-strong">
                {m.text}
              </div>
              <span className="px-1 text-[10px] text-muted">
                {m.scope ? `${m.scope} · ${m.at}` : m.at}
              </span>
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col gap-0.5">
                <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-border-subtle bg-surface px-3 py-2 text-[13px] text-text">
                  {m.text}
                </div>
                <span className="px-1 text-[10px] text-muted">{m.scope ? `${m.scope} · ${m.at}` : m.at}</span>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="border-t border-border p-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-2.5 py-1.5 focus-within:border-primary-border focus-within:bg-surface">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message the agent…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-strong outline-none placeholder:text-muted"
          />
          <button
            onClick={send}
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
