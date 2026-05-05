"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Check, Copy, Plus, QrCode, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseUsdc, formatUsdc } from "@/lib/format";
import {
  appendPendingLink,
  buildPaymentUrl,
  newPendingLink,
  newReferenceKey,
} from "@/lib/payment-link";

interface Props {
  /** Bumped after a successful link creation so siblings (e.g. PaymentWatcher) can refresh. */
  onCreated?: () => void;
}

interface GeneratedLink {
  url: string;
  qrDataUrl: string;
  amountAtomic: bigint;
  productName?: string;
  reference: string;
}

export function PaymentLinkBuilder({ onCreated }: Props) {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState("10");
  const [productName, setProductName] = useState("");
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState<GeneratedLink | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!publicKey) {
      toast.error("Connect wallet first");
      return;
    }

    let amountAtomic: bigint;
    try {
      amountAtomic = parseUsdc(amount);
      if (amountAtomic === 0n) throw new Error("Amount must be > 0");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid amount");
      return;
    }

    setCreating(true);
    try {
      const reference = newReferenceKey();
      const url = buildPaymentUrl({
        origin: window.location.origin,
        merchant: publicKey,
        amountUsdcAtomic: amountAtomic,
        reference,
        productName: productName.trim() || undefined,
      });
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 1,
        color: { dark: "#0b0d12", light: "#ffffff" },
      });

      appendPendingLink(
        publicKey,
        newPendingLink({
          reference,
          merchant: publicKey,
          amountUsdcAtomic: amountAtomic,
          productName: productName.trim() || undefined,
        }),
      );

      setLink({
        url,
        qrDataUrl,
        amountAtomic,
        productName: productName.trim() || undefined,
        reference: reference.toBase58(),
      });
      onCreated?.();
      toast.success("Payment link created");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create link", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setCreating(false);
    }
  }

  async function copyUrl() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  function reset() {
    setLink(null);
    setCopied(false);
  }

  return (
    <section className="card">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-accent" />
        <h2 className="text-lg font-semibold">Create payment link</h2>
      </div>
      <p className="text-sm text-textMuted mt-1">
        Generates a fixed-amount QR. The customer can&apos;t edit what they pay —
        the amount is bound to the link.
      </p>

      {!link ? (
        <div className="mt-5 grid gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted mb-1">
              Product / order name (optional)
            </label>
            <Input
              placeholder="Latte 12oz"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              maxLength={64}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted mb-1">
              Amount (USDC)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Button onClick={handleCreate} isLoading={creating} className="mt-2">
            <Plus className="h-4 w-4" />
            Generate link
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={link.qrDataUrl}
              alt="Payment QR"
              width={240}
              height={240}
              className="rounded-md block"
            />
          </div>

          <div className="text-center">
            <div className="text-textMuted text-xs uppercase tracking-wide">
              {link.productName ?? "Payment"}
            </div>
            <div className="text-2xl font-semibold mt-1">
              {formatUsdc(link.amountAtomic)}
            </div>
          </div>

          <button
            type="button"
            onClick={copyUrl}
            className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surfaceRaised/40 px-3 py-2 text-xs hover:bg-surfaceRaised transition"
          >
            <span className="font-mono truncate flex-1 text-left">{link.url}</span>
            <span className="flex items-center gap-1 shrink-0 text-textMuted">
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </span>
          </button>

          <Button variant="ghost" onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4" />
            Create another
          </Button>
        </div>
      )}
    </section>
  );
}
