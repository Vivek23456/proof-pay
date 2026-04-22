"use client";

interface Props {
  attestationCount: bigint | null;
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
    <div className="card">
      <h3 className="font-semibold mb-3">Your trust score</h3>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-semibold text-accent">{count}</span>
        <span className="text-sm text-textMuted">
          attestation{count === 1 ? "" : "s"} across all merchants
        </span>
      </div>
      <p className="text-xs text-textMuted mt-3">
        Reputation travels with <em>you</em>. Every Solana merchant who opts in can honor
        it.
      </p>
    </div>
  );
}
