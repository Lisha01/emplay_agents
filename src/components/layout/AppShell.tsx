"use client";

import { useStore } from "@/lib/store";
import { IconRail } from "./IconRail";
import { Toaster } from "@/components/ui/Toaster";
import { OnboardingGate } from "@/components/onboarding/Onboarding";

/** Top-level frame: slim icon rail + the active destination (spec §4). The
 *  `data-persona` attribute scopes the brand palette — renewal renders blue,
 *  demand-gen renders violet (see globals.css). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const persona = useStore((s) => s.persona);
  return (
    <div data-persona={persona ?? "demandgen"} className="flex h-screen overflow-hidden bg-canvas text-text">
      <IconRail />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <Toaster />
      <OnboardingGate />
    </div>
  );
}
