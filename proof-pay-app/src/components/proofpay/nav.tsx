"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Nav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent text-sm font-semibold">
            P
          </span>
          <span className="font-semibold tracking-tight">ProofPay</span>
          <span className="chip ml-2">devnet</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-textMuted">
          <Link href="/merchant" className="hover:text-text transition">
            Merchant
          </Link>
          <Link href="/checkout" className="hover:text-text transition">
            Checkout
          </Link>
          <a
            href="https://github.com/"
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
