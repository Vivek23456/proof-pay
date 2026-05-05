"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

interface Props {
  attestationCount: bigint | null;
}

function AnimatedCount({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 1, stiffness: 75, damping: 16 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString(),
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export function TrustScoreCard({ attestationCount }: Props) {
  if (attestationCount === null) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-1">Your trust score</h3>
        <p className="text-sm text-textMuted">
          Connect a wallet to see your portable reputation.
        </p>
      </div>
    );
  }

  const count = Number(attestationCount);

  return (
    <CardContainer containerClassName="!py-0">
      <CardBody className="relative w-full rounded-2xl border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(124,92,255,0.45)_0%,rgba(124,92,255,0.08)_45%,rgba(17,21,28,0.9)_100%)] p-6 shadow-[0_20px_60px_-20px_rgba(124,92,255,0.55)] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-accent/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-success/20 blur-3xl"
        />

        <CardItem
          translateZ={20}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Trust score</span>
        </CardItem>

        <CardItem
          translateZ={60}
          className="mt-4 flex items-baseline gap-2 text-white"
        >
          <span className="text-5xl font-semibold leading-none tracking-tight tabular-nums">
            <AnimatedCount value={count} />
          </span>
          <span className="text-sm text-white/70">
            attestation{count === 1 ? "" : "s"}
          </span>
        </CardItem>

        <CardItem
          translateZ={30}
          className="mt-2 text-xs text-white/60"
        >
          across all merchants on Solana
        </CardItem>

        <CardItem
          translateZ={40}
          className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 backdrop-blur"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Reputation travels with <em className="not-italic font-semibold">you</em>.
          Every Solana merchant who opts in honors it.
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}
