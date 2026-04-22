import Link from "next/link";
import { Nav } from "@/components/proofpay/nav";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Nav />

      <section className="container py-20 max-w-4xl">
        <span className="chip mb-6">solana · usdc · attestation layer</span>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
          Your Solana purchase history is{" "}
          <span className="text-accent">yours</span>, not each merchant&apos;s database.
        </h1>
        <p className="mt-6 text-lg text-textMuted max-w-2xl">
          Pay any Solana merchant in USDC. Earn a portable on-chain attestation. The next
          merchant who opts in can see your track record — and price accordingly. No
          per-brand loyalty accounts.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/checkout" className="btn-primary">
            Try the demo checkout →
          </Link>
          <Link href="/merchant" className="btn-ghost">
            I&apos;m a merchant
          </Link>
        </div>
      </section>

      <section className="container pb-20 grid gap-6 md:grid-cols-3">
        <div className="card">
          <div className="text-accent text-sm font-medium mb-2">1 · Pay</div>
          <p className="text-textMuted text-sm">
            Customer scans a Solana Pay QR and pays USDC. Same transaction that moves the
            money also mints an attestation.
          </p>
        </div>
        <div className="card">
          <div className="text-accent text-sm font-medium mb-2">2 · Earn</div>
          <p className="text-textMuted text-sm">
            Attestations live on-chain, readable by any future merchant. Customer owns the
            credential, not the merchant&apos;s loyalty DB.
          </p>
        </div>
        <div className="card">
          <div className="text-accent text-sm font-medium mb-2">3 · Redeem</div>
          <p className="text-textMuted text-sm">
            Every merchant sets up to three policy rules. The second purchase at a new
            merchant auto-applies the best-matching discount before you sign.
          </p>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container py-8 flex items-center justify-between text-xs text-textMuted">
          <span>
            Built for the{" "}
            <a
              className="underline decoration-dotted"
              href="https://www.colosseum.com/frontier"
              target="_blank"
              rel="noreferrer"
            >
              Solana Frontier Hackathon 2026
            </a>
            .
          </span>
          <span>Powered by SAS-adjacent attestations on Solana devnet.</span>
        </div>
      </footer>
    </main>
  );
}
