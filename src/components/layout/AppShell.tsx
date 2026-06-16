import { IconRail } from "./IconRail";
import { Toaster } from "@/components/ui/Toaster";

/** Top-level frame: slim icon rail + the active destination (spec §4). */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-text">
      <IconRail />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <Toaster />
    </div>
  );
}
