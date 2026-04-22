"use client";

import { formatBps, formatUsdc, shortAddress } from "@/lib/format";

interface Props {
  merchantName: string;
  amount: bigint;
  discountBps: number;
  signature: string;
}

export function ReceiptView({ merchantName, amount, discountBps, signature }: Props) {
  return (
    <div className="card-raised">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Receipt</h3>
        <span className="chip text-success border-success/40">Paid</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-textMuted">Merchant</dt>
        <dd className="text-right">{merchantName}</dd>
        <dt className="text-textMuted">Amount</dt>
        <dd className="text-right">{formatUsdc(amount)}</dd>
        <dt className="text-textMuted">Discount applied</dt>
        <dd className="text-right">{formatBps(discountBps)}</dd>
        <dt className="text-textMuted">Signature</dt>
        <dd className="text-right font-mono">
          {signature === "simulated" ? (
            <span className="text-warning">simulated</span>
          ) : (
            <a
              href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
              className="text-accent underline decoration-dotted"
              target="_blank"
              rel="noreferrer"
            >
              {shortAddress(signature, 6)}
            </a>
          )}
        </dd>
      </dl>
      <p className="mt-3 text-xs text-textMuted">
        Attestation issued. The next merchant who trusts your history sees this purchase.
      </p>
    </div>
  );
}
