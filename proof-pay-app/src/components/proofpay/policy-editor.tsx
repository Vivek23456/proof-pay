"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_POLICY_RULES } from "@/lib/config";
import { formatBps } from "@/lib/format";
import { useProofPayProgram } from "@/lib/anchor";
import { merchantRegistryPda } from "@/lib/pda";

export interface DraftRule {
  minAttestations: number;
  discountBps: number;
  validUntil: number; // unix seconds; 0 = never
}

const DEFAULT_RULE: DraftRule = { minAttestations: 3, discountBps: 1000, validUntil: 0 };

export function PolicyEditor() {
  const [rules, setRules] = useState<DraftRule[]>([DEFAULT_RULE]);
  const [busy, setBusy] = useState(false);
  const { publicKey } = useWallet();
  const { program } = useProofPayProgram();

  function updateRule(i: number, patch: Partial<DraftRule>) {
    setRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRule() {
    if (rules.length >= MAX_POLICY_RULES) return;
    setRules((r) => [...r, DEFAULT_RULE]);
  }

  function removeRule(i: number) {
    setRules((r) => r.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!publicKey || !program) {
      toast.error("Connect a wallet first");
      return;
    }
    setBusy(true);
    try {
      const [registry] = merchantRegistryPda(publicKey);
      const onChainRules = rules.map((r) => ({
        minAttestations: r.minAttestations,
        discountBps: r.discountBps,
        validUntil: new BN(r.validUntil),
      }));

      const sig = await program.methods
        .setPolicy(onChainRules)
        .accounts({
          authority: publicKey,
          registry,
        })
        .rpc();

      toast.success("Policy saved", {
        description: `Signature: ${sig.slice(0, 12)}…`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Loyalty policy</h2>
          <p className="text-sm text-textMuted mt-1">
            Up to {MAX_POLICY_RULES} rules. The customer gets the best-matching discount.
          </p>
        </div>
        <Button variant="ghost" onClick={addRule} disabled={rules.length >= MAX_POLICY_RULES}>
          Add rule
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        {rules.length === 0 && (
          <p className="text-sm text-textMuted italic">
            No policy yet. Your customers will pay full price. Add a rule to start rewarding
            cross-merchant reputation.
          </p>
        )}

        {rules.map((r, i) => (
          <div key={i} className="card-raised flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-1">
              <label className="block text-xs uppercase tracking-wide text-textMuted">
                After this many attestations
              </label>
              <Input
                type="number"
                min={0}
                max={255}
                value={r.minAttestations}
                onChange={(e) =>
                  updateRule(i, { minAttestations: Number(e.target.value || 0) })
                }
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="block text-xs uppercase tracking-wide text-textMuted">
                Discount (basis points)
              </label>
              <Input
                type="number"
                min={0}
                max={9000}
                value={r.discountBps}
                onChange={(e) =>
                  updateRule(i, { discountBps: Number(e.target.value || 0) })
                }
              />
              <span className="text-xs text-textMuted">≈ {formatBps(r.discountBps)} off</span>
            </div>
            <Button variant="danger" onClick={() => removeRule(i)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-textMuted">
          Saved as <span className="font-mono text-text">MerchantRegistry.policy</span> on
          chain. Re-saving overwrites all rules.
        </p>
        <Button onClick={handleSave} isLoading={busy}>
          Save policy
        </Button>
      </div>
    </section>
  );
}
