import Link from "next/link";
import { Nav } from "@/components/proofpay/nav";
import { Spotlight } from "@/components/ui/spotlight";

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

        <span className="chip mb-6">solana · usdc · attestation layer</span>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter leading-[1.05] text-balance">
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
          <span>ProofPay · portable on-chain reputation for Solana commerce.</span>
          <span>Powered by SAS-adjacent attestations on Solana devnet.</span>
        </div>
      </footer>
    </main>
  );
}
