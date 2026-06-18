"use client";

import { useStore } from "@/lib/store";
import { ChatPane } from "./ChatPane";

/**
 * Persistent conversation history for the Workbook session — thin demand-gen binding
 * over the shared {@link ChatPane}: feeds the demand-gen `chat` log and logs replies.
 */
export function ChatPanel() {
  const chat = useStore((s) => s.chat);
  const addChat = useStore((s) => s.addChat);

  const send = (text: string) => {
    addChat("user", text);
    addChat("agent", "Got it — I'll factor that in.");
  };

  return <ChatPane messages={chat} onSend={send} />;
}
