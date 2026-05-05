"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  XCircle,
} from "lucide-react";

import { USDC_MINT } from "@/lib/config";
import { formatUsdc, shortAddress } from "@/lib/format";
import {
  PendingLink,
  findReferenceSignature,
  readPendingLinks,
  removePendingLink,
  updatePendingLink,
  verifyPayment,
} from "@/lib/payment-link";

const POLL_INTERVAL_MS = 7_000;

interface Props {
  refreshKey?: number;
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  return `${hr}h ago`;
}

function StatusBadge({ status }: { status: PendingLink["status"] }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success text-xs px-2 py-0.5">
        <CheckCircle2 className="h-3 w-3" /> Paid
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 text-danger text-xs px-2 py-0.5">
        <XCircle className="h-3 w-3" /> Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning text-xs px-2 py-0.5">
      <Clock className="h-3 w-3 animate-pulse" /> Waiting
    </span>
  );
}

export function PaymentWatcher({ refreshKey }: Props) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [links, setLinks] = useState<PendingLink[]>([]);

  const reload = useCallback(() => {
    if (!publicKey) {
      setLinks([]);
      return;
    }
    setLinks(readPendingLinks(publicKey));
  }, [publicKey]);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  // Poll every POLL_INTERVAL_MS for new on-chain payments matching pending refs.
  useEffect(() => {
    if (!publicKey) return;
    const merchantPk = publicKey;
    const treasuryAta = getAssociatedTokenAddressSync(USDC_MINT, merchantPk);
    let cancelled = false;

    async function tick() {
      const current = readPendingLinks(merchantPk);
      let mutated = false;

      for (const link of current) {
        if (link.status !== "pending") continue;
        if (Date.now() > link.expiresAt) {
          updatePendingLink(merchantPk, link.reference, { status: "expired" });
          mutated = true;
          continue;
        }
        try {
          const ref = new PublicKey(link.reference);
          const sig = await findReferenceSignature(connection, ref);
          if (!sig) continue;
          const ok = await verifyPayment(
            connection,
            sig,
            treasuryAta,
            BigInt(link.amount),
          );
          if (ok) {
            updatePendingLink(merchantPk, link.reference, {
              status: "paid",
              signature: sig,
            });
            mutated = true;
          }
        } catch {
          // RPC blip — skip this round.
        }
      }

      if (!cancelled && mutated) {
        setLinks(readPendingLinks(merchantPk));
      }
    }

    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [connection, publicKey, refreshKey]);

  if (!publicKey) return null;

  if (links.length === 0) {
    return (
      <section className="card">
        <h3 className="font-semibold">Pending payments</h3>
        <p className="text-sm text-textMuted mt-1">
          Generate a payment link above. Live status will appear here.
        </p>
      </section>
    );
  }

  function dismiss(reference: string) {
    if (!publicKey) return;
    removePendingLink(publicKey, reference);
    reload();
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pending payments</h3>
        <span className="text-xs text-textMuted">
          {links.filter((l) => l.status === "pending").length} waiting · polling
          every {POLL_INTERVAL_MS / 1000}s
        </span>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {links.map((link) => (
          <li
            key={link.reference}
            className="py-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {link.productName ?? "Payment"}
                </span>
                <StatusBadge status={link.status} />
              </div>
              <div className="mt-1 text-xs text-textMuted flex items-center gap-2 flex-wrap">
                <span className="font-mono">
                  {formatUsdc(BigInt(link.amount))}
                </span>
                <span>·</span>
                <span className="font-mono">
                  ref {shortAddress(link.reference, 4)}
                </span>
                <span>·</span>
                <span>{relativeTime(link.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {link.status === "paid" && link.signature && (
                <a
                  href={`https://explorer.solana.com/tx/${link.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  title="View on Solana Explorer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Tx
                </a>
              )}
              <button
                type="button"
                onClick={() => dismiss(link.reference)}
                className="text-textMuted hover:text-danger transition p-1"
                title="Dismiss"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
