"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  type PublicKey,
} from "@solana/web3.js";
import { Check, Coins, Copy, Droplets, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Smaller asks succeed far more often on the public devnet faucet.
const PRIMARY_AMOUNT_SOL = 0.5;
const FALLBACK_AMOUNT_SOL = 0.25;

const PUBLIC_DEVNET_RPC = "https://api.devnet.solana.com";

const CIRCLE_FAUCET_URL = "https://faucet.circle.com/";

const WEB_FAUCETS: { label: string; href: (pk: string) => string }[] = [
  {
    label: "faucet.solana.com",
    href: (pk) => `https://faucet.solana.com/?address=${pk}&amount=1`,
  },
  {
    label: "QuickNode faucet",
    href: () => "https://faucet.quicknode.com/solana/devnet",
  },
  {
    label: "Helius faucet",
    href: () => "https://www.helius.dev/faucet",
  },
];

async function tryAirdrop(
  conn: Connection,
  to: PublicKey,
  sol: number,
): Promise<string> {
  const sig = await conn.requestAirdrop(to, sol * LAMPORTS_PER_SOL);
  const latest = await conn.getLatestBlockhash();
  await conn.confirmTransaction(
    { signature: sig, ...latest },
    "confirmed",
  );
  return sig;
}

export function FaucetCard() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFallbacks, setShowFallbacks] = useState(false);

  async function handleSolAirdrop() {
    if (!connected || !publicKey) {
      toast.error("Connect a wallet first");
      return;
    }
    setBusy(true);
    setShowFallbacks(false);

    // Public devnet RPC is the actual faucet source. If the dApp is on a
    // different RPC (Helius/Triton/etc.), try it first then fall back to it.
    const onPublicRpc = connection.rpcEndpoint.includes("api.devnet.solana.com");
    const publicConn = onPublicRpc
      ? connection
      : new Connection(PUBLIC_DEVNET_RPC, "confirmed");

    const attempts: Array<{ conn: Connection; sol: number; label: string }> = onPublicRpc
      ? [
          { conn: publicConn, sol: PRIMARY_AMOUNT_SOL, label: "0.5 SOL" },
          { conn: publicConn, sol: FALLBACK_AMOUNT_SOL, label: "0.25 SOL" },
        ]
      : [
          { conn: connection, sol: PRIMARY_AMOUNT_SOL, label: "0.5 SOL via dApp RPC" },
          { conn: publicConn, sol: PRIMARY_AMOUNT_SOL, label: "0.5 SOL via public RPC" },
          { conn: publicConn, sol: FALLBACK_AMOUNT_SOL, label: "0.25 SOL via public RPC" },
        ];

    let lastErr: unknown = null;
    for (const a of attempts) {
      try {
        const sig = await tryAirdrop(a.conn, publicKey, a.sol);
        toast.success(`${a.sol} SOL airdropped`, {
          description: `Sig ${sig.slice(0, 12)}…`,
        });
        setBusy(false);
        return;
      } catch (err) {
        lastErr = err;
      }
    }

    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    setShowFallbacks(true);
    toast.error("Devnet faucet is dry right now", {
      description:
        msg.toLowerCase().includes("429") || msg.toLowerCase().includes("rate")
          ? "Rate-limited. Try a web faucet below."
          : "Public devnet airdrop refused. Try a web faucet below.",
    });
    setBusy(false);
  }

  async function copyAddress() {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy address");
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <Droplets className="h-4 w-4 text-accent" />
        <h3 className="font-semibold">Devnet faucets</h3>
      </div>
      <p className="text-xs text-textMuted mt-1">
        Top up test funds before you transact. Devnet only.
      </p>

      <div className="mt-4 space-y-2">
        <Button
          onClick={handleSolAirdrop}
          isLoading={busy}
          variant="ghost"
          className="w-full justify-between"
          disabled={!connected}
        >
          <span className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Airdrop {PRIMARY_AMOUNT_SOL} SOL
          </span>
          <span className="text-xs text-textMuted">for gas</span>
        </Button>

        <a
          href={CIRCLE_FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-between rounded-xl border border-border bg-transparent px-4 py-2 text-sm font-medium text-text transition hover:bg-surfaceRaised"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Get devnet USDC
          </span>
          <span className="text-xs text-textMuted">faucet.circle.com</span>
        </a>
      </div>

      {connected && publicKey && (
        <button
          type="button"
          onClick={copyAddress}
          className="mt-3 inline-flex w-full items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-xs text-textMuted hover:text-text hover:border-accent/50 transition"
        >
          <span className="font-mono truncate max-w-[180px]">
            {publicKey.toBase58()}
          </span>
          <span className="flex items-center gap-1">
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </span>
        </button>
      )}

      {showFallbacks && publicKey && (
        <div className="mt-4 rounded-xl border border-border bg-surfaceRaised/40 p-3">
          <p className="text-xs text-textMuted mb-2">
            On-chain airdrop refused. Paste your wallet into one of these:
          </p>
          <ul className="space-y-1.5">
            {WEB_FAUCETS.map((f) => (
              <li key={f.label}>
                <a
                  href={f.href(publicKey.toBase58())}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {f.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!connected && (
        <p className="mt-3 text-xs text-textMuted">
          Connect your wallet to request a SOL airdrop.
        </p>
      )}
    </div>
  );
}
