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
  const { publicKey, sendTransaction } = useWallet();
  const { program } = useProofPayProgram();

  async function handleRegister() {
    if (!name.trim()) {
      toast.error("Merchant name is required");
      return;
    }
    if (!publicKey || !program) {
      toast.error("Connect a wallet first");
      return;
    }

    setBusy(true);
    try {
      const [registry] = merchantRegistryPda(publicKey);
      const treasuryAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);

      // Step 1: Create ATA if needed — separate tx
      const ataInfo = await connection.getAccountInfo(treasuryAta);
      if (!ataInfo) {
        const ataTx = new Transaction();
        ataTx.feePayer = publicKey;
        const ataLatest = await connection.getLatestBlockhash("finalized"); // ← finalized for longer validity
        ataTx.recentBlockhash = ataLatest.blockhash;

        ataTx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            treasuryAta,
            publicKey,
            USDC_MINT,
          ),
        );

        const ataSig = await sendTransaction(ataTx, connection, {
          skipPreflight: false,
          maxRetries: 5,                                                     // ← retry on devnet slowness
        });
        await connection.confirmTransaction(
          {
            signature: ataSig,
            blockhash: ataLatest.blockhash,
            lastValidBlockHeight: ataLatest.lastValidBlockHeight,
          },
          "confirmed",
        );
      }

      // Step 2: Register merchant — separate tx
      const tx = new Transaction();
      tx.feePayer = publicKey;
      const latest = await connection.getLatestBlockhash("finalized");      // ← finalized for longer validity
      tx.recentBlockhash = latest.blockhash;

      const registerIx = await program.methods
        .registerMerchant(name.trim())
        .accounts({
          authority: publicKey,
          registry,
          usdcMint: USDC_MINT,
          treasuryAta,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      tx.add(registerIx);

      const sig = await sendTransaction(tx, connection, {
        skipPreflight: false,
        maxRetries: 5,                                                       // ← retry on devnet slowness
      });
      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        "confirmed",
      );

      toast.success("Merchant registered", {
        description: `Signature: ${sig.slice(0, 12)}…`,
      });
    } catch (err) {
      console.error(err);
      if (err instanceof Error && 'logs' in err) {
        console.error("Program logs:", (err as any).logs);
      }
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