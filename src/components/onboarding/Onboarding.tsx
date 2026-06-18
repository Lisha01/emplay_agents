"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Sparkles } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { PERSONAS } from "@/lib/personas";
import type { Persona } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { IntegrationsStep } from "./IntegrationsStep";

type Step = 1 | 2;
const STEPS = [
  { n: 1 as Step, label: "Use case" },
  { n: 2 as Step, label: "Integrations" },
];

/** Two-step indicator across the top of the onboarding overlay. */
function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] font-medium transition-colors",
                active ? "bg-primary-subtle text-primary" : done ? "text-strong" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  active ? "bg-primary text-primary-fg" : done ? "bg-success text-surface" : "bg-surface-muted text-muted",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : s.n}
              </span>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-8 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

/** Step 1 — pick the primary use case (workspace persona). */
function PersonaStep({ selected, onSelect }: { selected: Persona | null; onSelect: (p: Persona) => void }) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      {PERSONAS.map((p) => {
        const Icon = p.icon;
        const isSel = selected === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-pressed={isSel}
            className={cn(
              "group flex flex-col rounded-2xl border bg-surface p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
              isSel ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary-border",
            )}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-strong">{p.name}</h2>
                  {!p.available && (
                    <span className="rounded-full bg-warning-bg px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-warning">Soon</span>
                  )}
                </div>
                <p className="truncate text-[13px] text-muted">{p.tagline}</p>
              </div>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isSel ? "border-primary bg-primary text-primary-fg" : "border-border text-transparent",
                )}
              >
                <Check className="h-3 w-3" />
              </span>
            </div>

            <p className="text-[13px] leading-relaxed text-text">{p.description}</p>

            <ul className="mt-4 space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-muted">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

/**
 * First-run onboarding wizard. Step 1 picks the primary use case (workspace
 * persona); Step 2 connects integrations. The persona isn't committed to the store
 * until "Finish" — so the overlay (gated on `persona === null`) stays up across both
 * steps. Rendered above every route by {@link OnboardingGate}.
 */
export function Onboarding() {
  const setPersona = useStore((s) => s.setPersona);
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<Persona | null>(null);

  // Commit the chosen persona and land on Home — the first stop in the platform.
  const finish = () => {
    if (!selected) return;
    setPersona(selected);
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-surface via-canvas to-primary-subtle">
      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-10">
          {/* Brand + stepper */}
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl shadow-sm">
              <Image src="/emplay-logo.jpeg" alt="Emplay" width={48} height={48} className="h-12 w-12 object-contain" priority />
            </span>
            <Stepper step={step} />
          </div>

          {/* Step heading */}
          <div className="mb-6 text-center">
            {step === 1 ? (
              <>
                <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Welcome to Emplay
                </p>
                <h1 className="text-2xl font-semibold text-strong">What do you want to focus on?</h1>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
                  Pick your primary use case and we&rsquo;ll tailor the workspace to it. You can switch
                  anytime from the rail on the left.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-strong">Connect your tools</h1>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
                  Wire up the systems your workspace pulls from. Connect a few now or skip and add them
                  later — you can manage these anytime in Settings.
                </p>
              </>
            )}
          </div>

          {step === 1 ? (
            <PersonaStep selected={selected} onSelect={setSelected} />
          ) : (
            <IntegrationsStep />
          )}
        </div>
      </div>

      {/* Sticky footer actions */}
      <div className="border-t border-border bg-surface px-6 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          {step === 2 && (
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
          )}
          <span className="ml-auto" />
          {step === 1 ? (
            <Button variant="primary" disabled={!selected} onClick={() => setStep(2)}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={finish}>
                Skip for now
              </Button>
              <Button variant="primary" onClick={finish}>
                Finish setup
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shows the onboarding overlay until a persona is chosen. */
export function OnboardingGate() {
  const persona = useStore((s) => s.persona);
  if (persona) return null;
  return <Onboarding />;
}
