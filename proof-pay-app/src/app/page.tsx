"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/proofpay/nav";
import { Spotlight } from "@/components/ui/spotlight";

const FEATURE_CARDS = [
  {
    step: "1 · Pay",
    body:
      "Customer scans a Solana Pay QR and pays USDC. Same transaction that moves the money also mints an attestation.",
  },
  {
    step: "2 · Earn",
    body:
      "Attestations live on-chain, readable by any future merchant. Customer owns the credential, not the merchant's loyalty DB.",
  },
  {
    step: "3 · Redeem",
    body:
      "Every merchant sets up to three policy rules. The second purchase at a new merchant auto-applies the best-matching discount before you sign.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <Nav />

      <section className="relative container py-20 max-w-4xl">
        <Spotlight
          className="-top-40 left-0 md:-top-20 md:left-60"
          fill="#7c5cff"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(600px circle at 30% 20%, rgba(124, 92, 255, 0.55) 0%, transparent 60%), radial-gradient(420px circle at 80% 40%, rgba(62, 207, 142, 0.35) 0%, transparent 60%)",
          }}
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.span
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="chip mb-6 inline-flex"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span>solana · usdc · attestation layer</span>
          </motion.span>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-semibold tracking-tighter leading-[1.05] text-balance"
          >
            Your Solana purchase history is{" "}
            <span className="text-accent">yours</span>, not each merchant&apos;s database.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-6 text-lg text-textMuted max-w-2xl"
          >
            Pay any Solana merchant in USDC. Earn a portable on-chain attestation. The next
            merchant who opts in can see your track record — and price accordingly. No
            per-brand loyalty accounts.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href="/checkout"
              className="btn-primary group shadow-[0_8px_24px_-12px_rgba(124,92,255,0.6)] hover:shadow-[0_12px_32px_-12px_rgba(124,92,255,0.85)] transition-shadow"
            >
              Try the demo checkout
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/merchant" className="btn-ghost">
              I&apos;m a merchant
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <motion.section
        className="container pb-20 grid gap-6 md:grid-cols-3"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        {FEATURE_CARDS.map((card) => (
          <motion.div
            key={card.step}
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            whileHover={{ y: -4 }}
            className="card transition-shadow hover:shadow-[0_24px_60px_-32px_rgba(124,92,255,0.45)]"
          >
            <div className="text-accent text-sm font-medium mb-2">{card.step}</div>
            <p className="text-textMuted text-sm">{card.body}</p>
          </motion.div>
        ))}
      </motion.section>

      <footer className="border-t border-border">
        <div className="container py-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-textMuted">
          <span>ProofPay · portable on-chain reputation for Solana commerce.</span>
          <span>Powered by SAS-adjacent attestations on Solana devnet.</span>
        </div>
      </footer>
    </main>
  );
}
