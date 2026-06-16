"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Megaphone, Crosshair, Settings, LayoutGrid, LogOut, type LucideIcon } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type NavItem = { label: string; icon: LucideIcon; href?: string; soon?: boolean };
const items: NavItem[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Leads", icon: Users, href: "/accounts" },
  { label: "Campaign", icon: Megaphone, href: "/campaigns" },
  { label: "Rules", icon: Crosshair, soon: true },
  { label: "Dashboard", icon: LayoutGrid, soon: true },
  { label: "Settings", icon: Settings, soon: true },
];

/** Full-height left nav — icon + label sections, brand at top, account at the foot. */
export function IconRail() {
  const pathname = usePathname();
  const addToast = useStore((s) => s.addToast);

  return (
    <nav className="flex w-20 shrink-0 flex-col items-center border-r border-border bg-surface py-4">
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

      {/* Foot — sign out + account */}
      <div className="mt-auto flex flex-col items-center gap-3 pt-3">
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
