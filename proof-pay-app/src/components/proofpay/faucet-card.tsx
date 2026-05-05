"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Coins, Droplets, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const SOL_AIRDROP_AMOUNT = 1;
const CIRCLE_FAUCET_URL = "https://faucet.circle.com/";

export function FaucetCard() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [busy, setBusy] = useState(false);

  async function handleSolAirdrop() {
    if (!connected || !publicKey) {
      toast.error("Connect a wallet first");
      return;
    }
    setBusy(true);
    try {
      const sig = await connection.requestAirdrop(
        publicKey,
        SOL_AIRDROP_AMOUNT * LAMPORTS_PER_SOL,
      );
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: sig, ...latest },
        "confirmed",
      );
      toast.success(`${SOL_AIRDROP_AMOUNT} SOL airdropped`, {
        description: `Sig ${sig.slice(0, 12)}…`,
      });
    } catch (err) {
      // The public devnet faucet is heavily rate-limited; surface a fallback.
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Devnet faucet is busy", {
        description:
          msg.includes("429") || msg.toLowerCase().includes("rate")
            ? "Try faucet.solana.com instead."
            : msg,
        action: {
          label: "Open faucet",
          onClick: () => window.open("https://faucet.solana.com/", "_blank"),
        },
      });
    } finally {
      setBusy(false);
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
            Airdrop {SOL_AIRDROP_AMOUNT} SOL
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

      {!connected && (
        <p className="mt-3 text-xs text-textMuted">
          Connect your wallet to request a SOL airdrop.
        </p>
      )}
    </div>
  );
}
