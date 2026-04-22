"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProofPayProgram } from "@/lib/anchor";
import { USDC_MINT } from "@/lib/config";
import { merchantRegistryPda } from "@/lib/pda";

export function OnboardPanel() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program, provider } = useProofPayProgram();

  async function handleRegister() {
    if (!name.trim()) {
      toast.error("Merchant name is required");
      return;
    }
    if (!publicKey || !program || !provider) {
      toast.error("Connect a wallet first");
      return;
    }

    setBusy(true);
    try {
      const [registry] = merchantRegistryPda(publicKey);
      const treasuryAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);

      const tx = new Transaction();
      const ataInfo = await connection.getAccountInfo(treasuryAta);
      if (!ataInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            treasuryAta,
            publicKey,
            USDC_MINT,
          ),
        );
      }

      const registerIx = await program.methods
        .registerMerchant(name)
        .accounts({
          authority: publicKey,
          registry,
          usdcMint: USDC_MINT,
          treasuryAta,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      tx.add(registerIx);

      const sig = await provider.sendAndConfirm(tx);
      toast.success("Merchant registered", {
        description: `Signature: ${sig.slice(0, 12)}…`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Register failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card max-w-xl">
      <h2 className="text-lg font-semibold">Register your storefront</h2>
      <p className="text-sm text-textMuted mt-1">
        Creates a <span className="font-mono text-text">MerchantRegistry</span> PDA seeded
        by your wallet. You can edit your policy immediately after.
      </p>

      <div className="mt-5 space-y-3">
        <label className="block text-xs uppercase tracking-wide text-textMuted">
          Merchant name
        </label>
        <Input
          placeholder="Cafe Solana"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={48}
        />

        <Button onClick={handleRegister} isLoading={busy} className="mt-2">
          Register merchant
        </Button>
      </div>
    </section>
  );
}
