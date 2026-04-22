"use client";

import { PublicKey } from "@solana/web3.js";
import { formatBps, formatUsdc, shortAddress } from "@/lib/format";

interface TxRow {
  signature: string;
  customer: string;
  amount: bigint;
  discountBps: number;
  timestamp: number;
}

interface Props {
  merchantRegistry: PublicKey | null;
}

// MVP placeholder: the real implementation calls `getSignaturesForAddress(registry)`
// + `getTransaction()` and decodes `PaymentRecorded` events from the inner instructions.
// Wiring that is a 25-line Phase 2b follow-up once the IDL is generated.
const PLACEHOLDER_ROWS: TxRow[] = [];

export function TxList({ merchantRegistry }: Props) {
  const rows = PLACEHOLDER_ROWS;

  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent payments</h2>
        <span className="chip">
          {merchantRegistry ? shortAddress(merchantRegistry.toBase58(), 4) : "—"}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-textMuted italic">
          No payments yet. Share your checkout link or QR to accept your first USDC
          payment — the first attestation mints in the same transaction.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-textMuted">
                <th className="py-2">Customer</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Discount</th>
                <th className="py-2">When</th>
                <th className="py-2">Tx</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.signature} className="border-t border-border">
                  <td className="py-2 font-mono">{shortAddress(row.customer)}</td>
                  <td className="py-2">{formatUsdc(row.amount)}</td>
                  <td className="py-2">{formatBps(row.discountBps)}</td>
                  <td className="py-2 text-textMuted">
                    {new Date(row.timestamp * 1000).toLocaleString()}
                  </td>
                  <td className="py-2">
                    <a
                      href={`https://explorer.solana.com/tx/${row.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline decoration-dotted"
                    >
                      {shortAddress(row.signature)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
