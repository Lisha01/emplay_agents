"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Megaphone,
  Crosshair,
  Settings,
  LayoutGrid,
  LogOut,
  Check,
  type LucideIcon,
} from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { PERSONAS, personaMeta } from "@/lib/personas";
import type { Persona } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = { label: string; icon: LucideIcon; href?: string; soon?: boolean };

// Each persona gets its own nav. Demand Gen is fully built; Renewal's destinations
// land later, so they read as "Soon" alongside its Home.
const NAV_BY_PERSONA: Record<Persona, NavItem[]> = {
  demandgen: [
    { label: "Home", icon: Home, href: "/" },
    { label: "Leads", icon: Users, href: "/accounts" },
    { label: "Campaign", icon: Megaphone, href: "/campaigns" },
    { label: "Rules", icon: Crosshair, soon: true },
    { label: "Dashboard", icon: LayoutGrid, soon: true },
    { label: "Settings", icon: Settings, soon: true },
  ],
  renewal: [
    { label: "Home", icon: Home, href: "/" },
    { label: "Rules", icon: Crosshair, soon: true },
    { label: "Dashboard", icon: LayoutGrid, soon: true },
    { label: "Settings", icon: Settings, soon: true },
  ],
};

/** Full-height left nav — icon + label sections, brand at top, persona switcher at the foot. */
export function IconRail() {
  const pathname = usePathname();
  const router = useRouter();
  const addToast = useStore((s) => s.addToast);
  const persona = useStore((s) => s.persona);
  const setPersona = useStore((s) => s.setPersona);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const items = NAV_BY_PERSONA[persona ?? "demandgen"];
  const current = personaMeta(persona ?? "demandgen");
  const CurrentIcon = current.icon;

  const switchTo = (p: Persona) => {
    setSwitcherOpen(false);
    if (p === persona) return;
    setPersona(p);
    router.push("/");
  };

  return (
    <nav className="relative flex w-20 shrink-0 flex-col items-center border-r border-border bg-surface py-4">
      {/* Brand mark — Emplay logo */}
      <Link href="/" className="mb-4 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl" aria-label="Emplay home">
        <Image src="/emplay-logo.jpeg" alt="Emplay" width={40} height={40} className="h-10 w-10 object-contain" priority />
      </Link>

      <div className="flex w-full flex-1 flex-col items-stretch gap-1 px-2">
        {items.map((it) => {
          const active = it.href ? (it.href === "/" ? pathname === "/" : pathname.startsWith(it.href)) : false;
          const Icon = it.icon;
          const inner = (
            <span
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 transition-colors",
                it.soon ? "text-muted opacity-50" : active ? "text-primary" : "text-muted hover:text-strong",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-primary-subtle" : !it.soon && "group-hover:bg-surface-muted",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-medium">{it.label}</span>
              {it.soon && (
                <span className="rounded-full bg-warning-bg px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide text-warning">Soon</span>
              )}
            </span>
          );
          if (it.soon) {
            return (
              <div key={it.label} aria-disabled="true" title="Coming soon" className="cursor-not-allowed select-none">
                {inner}
              </div>
            );
          }
          return (
            <Link key={it.label} href={it.href!} aria-label={it.label} aria-current={active ? "page" : undefined} className="group">
              {inner}
            </Link>
          );
        })}
      </div>

      {/* Foot — persona switcher · sign out · account */}
      <div className="mt-auto flex w-full flex-col items-center gap-3 px-2 pt-3">
        <div className="relative w-full">
          <button
            onClick={() => setSwitcherOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={switcherOpen}
            title={`Workspace: ${current.name} · switch`}
            className={cn(
              "flex w-full flex-col items-center gap-1 rounded-xl py-1.5 text-muted transition-colors hover:text-strong",
              switcherOpen && "text-primary",
            )}
          >
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-colors", switcherOpen ? "bg-primary-subtle text-primary" : "bg-surface-muted")}>
              <CurrentIcon className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-medium">Workspace</span>
          </button>

          {switcherOpen && (
            <>
              {/* click-away backdrop */}
              <div className="fixed inset-0 z-30" onClick={() => setSwitcherOpen(false)} aria-hidden />
              {/* popover */}
              <div
                role="menu"
                className="absolute bottom-0 left-[calc(100%+0.5rem)] z-40 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
              >
                <p className="border-b border-border-subtle px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted">
                  Switch workspace
                </p>
                {PERSONAS.map((p) => {
                  const Icon = p.icon;
                  const isCurrent = p.id === (persona ?? "demandgen");
                  return (
                    <button
                      key={p.id}
                      role="menuitemradio"
                      aria-checked={isCurrent}
                      onClick={() => switchTo(p.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted",
                        isCurrent && "bg-primary-subtle/40",
                      )}
                    >
                      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", isCurrent ? "bg-primary text-primary-fg" : "bg-surface-muted text-primary")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-strong">{p.name}</span>
                          {!p.available && (
                            <span className="rounded-full bg-warning-bg px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-warning">Soon</span>
                          )}
                        </span>
                        <span className="block text-xs text-muted">{p.tagline}</span>
                      </span>
                      {isCurrent && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => addToast("Signed out (demo)")}
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-muted hover:text-strong"
        >
          <LogOut className="h-5 w-5" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">AU</span>
      </div>
    </nav>
  );
}
