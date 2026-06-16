import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes, resolving conflicts (e.g. "px-2" + "px-4" -> "px-4"). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** True when the user asked for reduced motion — auto-mode jumps states instead of animating. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
