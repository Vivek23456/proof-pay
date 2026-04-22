import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container max-w-lg py-24">
      <div className="card text-center space-y-3">
        <h2 className="text-xl font-semibold">Not found</h2>
        <p className="text-sm text-textMuted">That page doesn&apos;t exist on ProofPay.</p>
        <Link href="/" className="btn-ghost inline-flex mx-auto">
          Back home
        </Link>
      </div>
    </main>
  );
}
