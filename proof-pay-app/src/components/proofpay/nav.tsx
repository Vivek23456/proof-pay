"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { BadgeCheck } from "lucide-react";

export function Nav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="relative z-10 border-b border-border/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/40 shadow-[0_0_24px_-6px_rgba(124,92,255,0.65)] transition group-hover:shadow-[0_0_32px_-4px_rgba(124,92,255,0.85)]">
            <BadgeCheck className="h-5 w-5 text-white" strokeWidth={2.25} />
          </span>
          <span className="font-semibold tracking-tight">ProofPay</span>
          <span className="chip ml-2 hidden sm:inline-flex gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            devnet
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-textMuted">
          <Link href="/merchant" className="hover:text-text transition">
            Merchant
          </Link>
          <Link href="/checkout" className="hover:text-text transition">
            Checkout
          </Link>
          <a
            href="https://github.com/Vivek23456/proof-pay"
            target="_blank"
            rel="noreferrer"
            className="hover:text-text transition"
          >
            GitHub
          </a>
        </nav>

        {mounted ? (
          <WalletMultiButton
            style={{
              background: "#7c5cff",
              borderRadius: 12,
              height: 38,
              lineHeight: "38px",
            }}
          />
        ) : (
          <div
            aria-hidden
            className="h-[38px] w-[170px] rounded-xl bg-accent/20"
          />
        )}
      </div>
    </header>
  );
}
