import { BadgeCheck } from "lucide-react";

export default function Loading() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center gap-6 py-24">
      {/* Animated logo: pulsing aura ring around the brand mark. */}
      <div className="relative">
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-accent/40 blur-xl animate-pulse-soft"
        />
        <span
          aria-hidden
          className="absolute -inset-2 rounded-2xl border border-accent/40 animate-ping"
        />
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/40 shadow-[0_0_32px_-4px_rgba(124,92,255,0.85)]">
          <BadgeCheck className="h-7 w-7 text-white" strokeWidth={2.25} />
        </span>
      </div>

      {/* Three-dot loading indicator with staggered bounce. */}
      <div className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft"
          style={{ animationDelay: "300ms" }}
        />
      </div>

      <p className="text-sm text-textMuted">Loading ProofPay…</p>
    </div>
  );
}
