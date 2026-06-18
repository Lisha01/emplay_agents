# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The import above is load-bearing: this repo runs **Next.js 16** and **React 19**, whose
> App Router APIs, file conventions, and config differ from older versions. Read the relevant
> guide in `node_modules/next/dist/docs/` before writing framework code — do not rely on memory.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint (flat config, eslint.config.mjs)
npx tsc --noEmit # typecheck (strict mode; tsconfig has noEmit)
```

There is **no test suite** configured — don't invent test commands. Verify changes by running
the dev server and exercising the UI.

## What this is

A **front-end-only prototype** of Emplay's unified demand-generation workspace. There is **no
backend, no network, no persistence** — all data is mock and lives in memory. A "run" mutates
the store over scripted `setTimeout` timers to *look* live. Treat every number, name, and
activity line as demo fixtures (many are verbatim from a design spec; code comments reference
spec sections like `§6`).

## Architecture

**Stack:** Next.js 16 App Router · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Zustand · Phosphor icons. Path alias `@/*` → `./src/*`.

**Single source of truth — `src/lib/store.ts`:** one Zustand store holds *all* app state and
*all* mutations (selections, the auto-mode flow, campaigns, sequences, toasts, chat). Components
are thin; they read slices via `useStore((s) => ...)` and call actions. There is no other state
container. `freshData()` deep-clones seed data so `resetDemo()` is clean; `nextId()` generates
ids; time labels are computed at runtime only (never during SSR) to avoid hydration mismatch.

**The five agents are the spine.** `src/lib/agents.ts` defines them as ordered plan-rail steps
(`AgentStep` = `1|2|3|4|5`): Lead Research → Lead Qualification → Recommendation → Campaign
Build → Campaign Monitor. This ordering recurs everywhere (the rail, `currentStep`,
`advanceRun`, route deep-links).

**Two ways to drive the funnel:**
- **Autonomous / auto mode** (plan-first): Clarify → Plan → Run → "Needs your attention". The
  scripted spine lives in `src/lib/autoMode.ts` (`CLARIFY_QUESTIONS`, `derivePlan`,
  `buildRunStages`, `runAttentionItems`, the deterministic margin model). Rendered by
  `src/components/auto/AutoMode.tsx`. Active when `autoRunActive` is true.
- **Manual stepping** (assist/augment): `src/app/workbook/page.tsx` switches on `currentStep`
  to render one agent component at a time from `src/components/agents/`.

**Routes** (`src/app/`): `/` Home triage (Today/Leads/Campaign/Pipeline tabs) · `/workbook`
the five-agent canvas · `/accounts` · `/campaigns`. Cards and rows across the app deep-link
into the Workbook at a specific step with an account loaded (`openAccountInWorkbook`, `enterAt`).

**Shells:** `AppShell` (layout.tsx) = slim `IconRail` + main + `Toaster`, wraps every route.
`WorkbookShell` = header · `LeftPanel`/PlanRail · Canvas · ContextPanel · `CommandBar`; the
shell stays put while work moves through it.

**Component layers** under `src/components/`: `ui/` (primitives) · `layout/` (app frame) ·
`auto/` (plan-first flow) · `agents/` (the five step screens) · `workbook/` (shell + panels) ·
`workbench/` (sequence/touch editing) · `campaigns/`.

**Types:** `src/lib/types.ts` is the data model (mirrors spec §9). `src/lib/mockData.ts` is the
seed. Read these first when touching data shapes.

## Conventions

- **Never hard-code colors.** All colors are CSS variables defined once in
  `src/app/globals.css` and exposed as Tailwind tokens via `@theme inline` (Tailwind v4 is
  CSS-first — there is **no `tailwind.config`**). Use semantic classes like `text-strong`,
  `bg-primary-subtle`, `border-border`. Brand is Emplay violet; font is Poppins.
- **Icons come only from `src/components/ui/icons.ts`** — it re-exports Phosphor icons under
  stable names (and a `LucideIcon` type alias). Import from there, never from
  `@phosphor-icons/react` directly, so a swap stays in one place.
- Merge classes with `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge).
- Most components are client components (`"use client"`) because they bind to the store.
- Respect reduced motion: `prefersReducedMotion()` exists so auto-mode can jump states instead
  of animating.
