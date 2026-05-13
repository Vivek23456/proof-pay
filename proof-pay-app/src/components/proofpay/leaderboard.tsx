"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { customerCounterPda } from "@/lib/pda";
import { shortAddress, formatUsdc } from "@/lib/format";
import type { TxRow } from "./tx-list";

interface LeaderboardEntry {
  customer: string;
  attestationCount: number;
  totalSpend: bigint;
  lastSeen: number;
}

interface Props {
  merchantRegistry: PublicKey | null;
  txRows?: TxRow[];
}

export function Leaderboard({ merchantRegistry, txRows = [] }: Props) {
  const { connection } = useConnection();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const buildLeaderboard = useCallback(async () => {
    if (!merchantRegistry || txRows.length === 0) return;
    setLoading(true);

    try {
      const map = new Map<string, { totalSpend: bigint; lastSeen: number }>();
      for (const row of txRows) {
        const prev = map.get(row.customer) ?? { totalSpend: 0n, lastSeen: 0 };
        map.set(row.customer, {
          totalSpend: prev.totalSpend + row.amount,
          lastSeen: Math.max(prev.lastSeen, row.timestamp),
        });
      }

      const customers = Array.from(map.keys());
      const results: LeaderboardEntry[] = await Promise.all(
        customers.map(async (customer) => {
          try {
            const pk = new PublicKey(customer);
            const [counterPda] = customerCounterPda(pk);
            const info = await connection.getAccountInfo(counterPda);
            let count = 0;
            if (info && info.data.length >= 16) {
              count = Number(info.data.readBigUInt64LE(8));
            }
            const agg = map.get(customer)!;
            return {
              customer,
              attestationCount: count,
              totalSpend: agg.totalSpend,
              lastSeen: agg.lastSeen,
            };
          } catch {
            const agg = map.get(customer)!;
            return {
              customer,
              attestationCount: 0,
              totalSpend: agg.totalSpend,
              lastSeen: agg.lastSeen,
            };
          }
        })
      );

      results.sort((a, b) =>
        b.attestationCount !== a.attestationCount
          ? b.attestationCount - a.attestationCount
          : b.totalSpend > a.totalSpend ? 1 : -1
      );

      setEntries(results);
    } finally {
      setLoading(false);
    }
  }, [connection, merchantRegistry, txRows]);

  useEffect(() => {
    buildLeaderboard();
  }, [buildLeaderboard]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Customer leaderboard</h2>
        <span className="chip text-xs">By attestations</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-md bg-surface animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-textMuted italic mt-2">
          No customers yet. Leaderboard populates after first payment.
        </p>
      ) : (
        <div className="space-y-2 mt-2">
          {entries.map((entry, idx) => (
            <div
              key={entry.customer}
              className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-7 text-center">
                  {medals[idx] ?? `#${idx + 1}`}
                </span>
                <div>
                  <p className="font-mono text-sm font-medium">
                    {shortAddress(entry.customer, 6)}
                  </p>
                  <p className="text-xs text-textMuted">
                    Last seen:{" "}
                    {entry.lastSeen
                      ? new Date(entry.lastSeen * 1000).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-accent">
                  {entry.attestationCount}{" "}
                  <span className="text-xs text-textMuted font-normal">
                    attest{entry.attestationCount !== 1 ? "s" : ""}
                  </span>
                </p>
                <p className="text-xs text-textMuted">
                  {formatUsdc(entry.totalSpend)} spent
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}