"use client";

import { useMemo } from "react";
import { formatUsdc } from "@/lib/format";
import type { TxRow } from "./tx-list";

interface Props {
  txRows: TxRow[];
}

export function MerchantHistory({ txRows }: Props) {
  const stats = useMemo(() => {
    if (txRows.length === 0) return null;

    const uniqueCustomers = new Set(txRows.map((r) => r.customer)).size;
    const totalVolume = txRows.reduce((s, r) => s + r.amount, 0n);
    const discountedTxs = txRows.filter((r) => r.discountBps > 0);
    const totalDiscountGiven = discountedTxs.reduce(
      (s, r) => s + (r.amount * BigInt(r.discountBps)) / 10000n,
      0n
    );
    const avgDiscountBps =
      discountedTxs.length > 0
        ? Math.round(
            discountedTxs.reduce((s, r) => s + r.discountBps, 0) /
              discountedTxs.length
          )
        : 0;

    const countMap = new Map<string, number>();
    for (const r of txRows) countMap.set(r.customer, (countMap.get(r.customer) ?? 0) + 1);
    const repeatCustomers = [...countMap.values()].filter((c) => c > 1).length;

    const now = Math.floor(Date.now() / 1000);
    const dayBuckets: Record<string, bigint> = {};
    for (let d = 6; d >= 0; d--) {
      const label = new Date((now - d * 86400) * 1000).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      });
      dayBuckets[label] = 0n;
    }
    for (const row of txRows) {
      const label = new Date(row.timestamp * 1000).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      });
      if (label in dayBuckets) {
        dayBuckets[label] += row.amount;
      }
    }

    return {
      uniqueCustomers,
      totalVolume,
      discountedTxs: discountedTxs.length,
      totalDiscountGiven,
      avgDiscountBps,
      repeatCustomers,
      dayBuckets,
    };
  }, [txRows]);

  if (!stats) {
    return (
      <section className="card">
        <h2 className="text-lg font-semibold mb-2">Merchant analytics</h2>
        <p className="text-sm text-textMuted italic">
          Analytics appear after first payment.
        </p>
      </section>
    );
  }

  const statCards = [
    { label: "Total volume", value: formatUsdc(stats.totalVolume) },
    { label: "Unique customers", value: stats.uniqueCustomers.toString() },
    { label: "Repeat customers", value: stats.repeatCustomers.toString() },
    { label: "Payments with discount", value: stats.discountedTxs.toString() },
    { label: "Total discount given", value: formatUsdc(stats.totalDiscountGiven) },
    {
      label: "Avg discount",
      value:
        stats.avgDiscountBps > 0
          ? `${(stats.avgDiscountBps / 100).toFixed(1)}%`
          : "—",
    },
  ];

  const bucketEntries = Object.entries(stats.dayBuckets);
  const maxVal = bucketEntries.reduce(
    (m, [, v]) => (v > m ? v : m),
    1n
  );

  return (
    <section className="card space-y-6">
      <h2 className="text-lg font-semibold">Merchant analytics</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="stat">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value text-base">{s.value}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs text-textMuted mb-3 uppercase tracking-wider">
          7-day volume (USDC)
        </p>
        <div className="flex items-end gap-2 h-24">
          {bucketEntries.map(([label, val]) => {
            const pct = maxVal > 0n ? Number((val * 100n) / maxVal) : 0;
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative" style={{ height: "72px" }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-accent/70 transition-all duration-500"
                    style={{ height: `${Math.max(pct, val > 0n ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-textMuted leading-none">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}