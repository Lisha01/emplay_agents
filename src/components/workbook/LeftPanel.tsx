"use client";

import { useState } from "react";
import { Layers, MessagesSquare } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { PlanRail } from "./PlanRail";
import { ChatPanel } from "./ChatPanel";
import { cn } from "@/lib/utils";

/**
 * Left section of the workspace: tabbed between the pipeline (Sheets/Stages) and Chat.
 * Generic — both personas pass their own `sheets`, `chat`, and counts. Defaults bind to
 * the demand-gen pipeline + chat so existing call sites are unchanged.
 */
export function LeftPanel({
  sheets,
  chat,
  chatCount,
  sheetsLabel = "Sheets",
}: {
  sheets?: React.ReactNode;
  chat?: React.ReactNode;
  chatCount?: number;
  sheetsLabel?: string;
}) {
  const [tab, setTab] = useState<"sheets" | "chat">("sheets");
  const dgCount = useStore((s) => s.chat.length);
  const count = chatCount ?? dgCount;

  const tabs = [
    { id: "sheets" as const, label: sheetsLabel, icon: Layers },
    { id: "chat" as const, label: "Chat", icon: MessagesSquare, count },
  ];

  return (
    <aside className="flex w-[20vw] min-w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex border-b border-border px-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 py-3 text-[13px] font-medium transition-colors",
              tab === t.id ? "text-primary" : "text-muted hover:text-strong",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {"count" in t && t.count ? (
              <span className="rounded-full bg-surface-muted px-1.5 text-[10px] tabular-nums text-muted">{t.count}</span>
            ) : null}
            {tab === t.id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "sheets" ? sheets ?? <PlanRail /> : chat ?? <ChatPanel />}
      </div>
    </aside>
  );
}
