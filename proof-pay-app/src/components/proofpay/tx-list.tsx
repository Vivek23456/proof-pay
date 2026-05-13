"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey, Connection } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { formatBps, formatUsdc, shortAddress } from "@/lib/format";
import { PROGRAM_ID } from "@/lib/config";

export interface TxRow {
  signature: string;
  customer: string;
  amount: bigint;
  discountBps: number;
  timestamp: number;
}

interface Props {
  merchantRegistry: PublicKey | null;
  onDataLoaded?: (rows: TxRow[]) => void;
}

const PAY_AND_ATTEST_DISC = Buffer.from([0x6e, 0x9a, 0xb5, 0x6e, 0x5b, 0x4f, 0x3c, 0x2a]);

async function fetchTxRows(
  connection: Connection,
  registryPk: PublicKey,
  limit = 50
): Promise<TxRow[]> {
  const sigs = await connection.getSignaturesForAddress(registryPk, { limit });
  if (!sigs.length) return [];

  const txs = await connection.getTransactions(
    sigs.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0, commitment: "confirmed" }
  );

  const rows: TxRow[] = [];

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const sig = sigs[i];
    if (!tx || tx.meta?.err) continue;

    const blockTime = sig.blockTime ?? tx.blockTime ?? 0;
    const msg = tx.transaction.message;
    const accountKeys = "staticAccountKeys" in msg
      ? msg.staticAccountKeys
      : (msg as { accountKeys: PublicKey[] }).accountKeys;

    for (const ix of msg.compiledInstructions ?? (msg as unknown as { instructions: { programIdIndex: number; data: Uint8Array; accountKeyIndexes: number[] }[] }).instructions ?? []) {
      const progKey = accountKeys[ix.programIdIndex];
      if (!progKey || progKey.toBase58() !== PROGRAM_ID.toBase58()) continue;

      const data = Buffer.from(ix.data);
      if (data.length < 8) continue;
      if (!data.subarray(0, 8).equals(PAY_AND_ATTEST_DISC)) continue;

      const amountRaw = data.length >= 16 ? data.readBigUInt64LE(8) : 0n;
      const customerIndex = ix.accountKeyIndexes?.[0] ?? 0;
      const customerKey = accountKeys[customerIndex];

      let discountBps = 0;
      if (tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
        const pre = tx.meta.preTokenBalances.find((b) => b.accountIndex === customerIndex);
        const post = tx.meta.postTokenBalances.find((b) => b.accountIndex === customerIndex);
        if (pre && post) {
          const paid = BigInt(pre.uiTokenAmount.amount) - BigInt(post.uiTokenAmount.amount);
          if (amountRaw > 0n && paid < amountRaw) {
            discountBps = Number(((amountRaw - paid) * 10000n) / amountRaw);
          }
        }
      }

      rows.push({
        signature: sig.signature,
        customer: customerKey?.toBase58() ?? "unknown",
        amount: amountRaw,
        discountBps,
        timestamp: blockTime,
      });
      break;
    }
  }

  return rows;
}

export function TxList({ merchantRegistry, onDataLoaded }: Props) {
  const { connection } = useConnection();
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantRegistry) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTxRows(connection, merchantRegistry);
      setRows(data);
      onDataLoaded?.(data);
    } catch (e) {
      setError("Could not load transactions. Try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [connection, merchantRegistry, onDataLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent payments</h2>
        <div className="flex items-center gap-3">
          {merchantRegistry && (
            <span className="chip font-mono text-xs">
              {shortAddress(merchantRegistry.toBase58(), 4)}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="text-xs text-accent underline decoration-dotted disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-3">{error}</p>
      )}

      {loading && rows.length === 0 ? (
        <div className="space-y-2 mt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-surface animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-sm text-textMuted italic">
          No payments yet. Share your checkout link to accept your first USDC payment.
        </p>
      ) : (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <span className="chip text-xs">
              {rows.length} payment{rows.length !== 1 ? "s" : ""}
            </span>
            <span className="chip text-xs">
              Total: {formatUsdc(rows.reduce((s, r) => s + r.amount, 0n))}
            </span>
            <span className="chip text-xs">
              Discounts given: {rows.filter((r) => r.discountBps > 0).length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-textMuted border-b border-border">
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Discount</th>
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2">Tx</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.signature} className="border-t border-border hover:bg-surface/50 transition-colors">
                    <td className="py-2 pr-4 font-mono">{shortAddress(row.customer)}</td>
                    <td className="py-2 pr-4">{formatUsdc(row.amount)}</td>
                    <td className="py-2 pr-4">
                      {row.discountBps > 0 ? (
                        <span className="text-success font-medium">{formatBps(row.discountBps)}</span>
                      ) : (
                        <span className="text-textMuted">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-textMuted text-xs">
                      {row.timestamp
                        ? new Date(row.timestamp * 1000).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2">
                        <a
                        href={`https://explorer.solana.com/tx/${row.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent underline decoration-dotted text-xs"
                        >
                        {shortAddress(row.signature, 4)}↗
                        </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}