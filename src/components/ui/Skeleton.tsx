import { cn } from "@/lib/utils";

/** Generating/loading shimmer (spec §10 — restrained animation). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="ml-auto h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
