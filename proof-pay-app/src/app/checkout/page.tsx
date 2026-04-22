"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { toast } from "sonner";

import { Nav } from "@/components/proofpay/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  attestationPda,
  customerCounterPda,
  merchantRegistryPda,
} from "@/lib/pda";
import { formatBps, formatUsdc, parseUsdc, shortAddress } from "@/lib/format";
import { TrustScoreCard } from "@/components/proofpay/trust-score-card";
import { ReceiptView } from "@/components/proofpay/receipt-view";
import { useProofPayProgram } from "@/lib/anchor";

interface OnChainRule {
  minAttestations: number;
  discountBps: number;
  validUntil: bigint;
}

interface MerchantSnapshot {
  authority: PublicKey;
  treasuryAta: PublicKey;
  usdcMint: PublicKey;
  policyCount: number;
  rules: OnChainRule[];
  name: string;
}

interface CheckoutQuote {
  fullAmount: bigint;
  discountBps: number;
  netAmount: bigint;
  bestRule: OnChainRule | null;
}

function bestDiscountBps(
  rules: OnChainRule[],
  attestationCount: bigint,
  nowSeconds: bigint,
): { bps: number; rule: OnChainRule | null } {
  let best = 0;
  let bestRule: OnChainRule | null = null;
  for (const r of rules) {
    const matchesCount = attestationCount >= BigInt(r.minAttestations);
    const validNow = r.validUntil === 0n || r.validUntil >= nowSeconds;
    if (matchesCount && validNow && r.discountBps > best) {
      best = r.discountBps;
      bestRule = r;
    }
  }
  return { bps: best, rule: bestRule };
}

function CheckoutInner() {
  const params = useSearchParams();
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const { program, provider } = useProofPayProgram();

  const [merchantInput, setMerchantInput] = useState(params.get("merchant") ?? "");
  const [amountInput, setAmountInput] = useState(params.get("amount") ?? "10");
  const [attestationCount, setAttestationCount] = useState<bigint | null>(null);
  const [merchant, setMerchant] = useState<MerchantSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    amount: bigint;
    discountBps: number;
    signature: string;
  } | null>(null);

  const merchantAuthority = useMemo(() => {
    try {
      return new PublicKey(merchantInput);
    } catch {
      return null;
    }
  }, [merchantInput]);

  const parsedAmount = useMemo(() => {
    try {
      return parseUsdc(amountInput || "0");
    } catch {
      return 0n;
    }
  }, [amountInput]);

  // Fetch + decode the customer's CustomerCounter using Anchor.
  useEffect(() => {
    if (!publicKey || !program) {
      setAttestationCount(null);
      return;
    }
    const [counterPda] = customerCounterPda(publicKey);
    let cancelled = false;
    (async () => {
      try {
        const acct = await (program.account as Record<string, { fetchNullable: (pk: PublicKey) => Promise<{ attestationCount: BN } | null> }>)
          .customerCounter.fetchNullable(counterPda);
        if (cancelled) return;
        setAttestationCount(acct ? BigInt(acct.attestationCount.toString()) : 0n);
      } catch {
        if (!cancelled) setAttestationCount(0n);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey, program]);

  // Fetch + decode the merchant registry once a valid authority is entered.
  useEffect(() => {
    if (!merchantAuthority || !program) {
      setMerchant(null);
      return;
    }
    const [registryPda] = merchantRegistryPda(merchantAuthority);
    let cancelled = false;
    (async () => {
      try {
        const reg = await (program.account as Record<string, { fetchNullable: (pk: PublicKey) => Promise<MerchantRegistryRaw | null> }>)
          .merchantRegistry.fetchNullable(registryPda);
        if (cancelled) return;
        if (!reg) {
          setMerchant(null);
          return;
        }
        const rules: OnChainRule[] = Array.from({ length: reg.policyCount }).map((_, i) => ({
          minAttestations: reg.policy[i].minAttestations,
          discountBps: reg.policy[i].discountBps,
          validUntil: BigInt(reg.policy[i].validUntil.toString()),
        }));
        setMerchant({
          authority: reg.authority,
          treasuryAta: reg.treasuryAta,
          usdcMint: reg.usdcMint,
          policyCount: reg.policyCount,
          rules,
          name: reg.name,
        });
      } catch {
        if (!cancelled) setMerchant(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [merchantAuthority, program]);

  const quote: CheckoutQuote = useMemo(() => {
    if (!merchant || attestationCount === null) {
      return { fullAmount: parsedAmount, discountBps: 0, netAmount: parsedAmount, bestRule: null };
    }
    const now = BigInt(Math.floor(Date.now() / 1000));
    const { bps, rule } = bestDiscountBps(merchant.rules, attestationCount, now);
    const discount = (parsedAmount * BigInt(bps)) / 10_000n;
    return {
      fullAmount: parsedAmount,
      discountBps: bps,
      netAmount: parsedAmount - discount,
      bestRule: rule,
    };
  }, [merchant, attestationCount, parsedAmount]);

  async function handlePay() {
    if (!merchantAuthority) {
      toast.error("Invalid merchant address");
      return;
    }
    if (parsedAmount === 0n) {
      toast.error("Amount must be > 0");
      return;
    }
    if (!connected || !publicKey || !program || !provider) {
      toast.error("Connect a wallet first");
      return;
    }
    if (!merchant) {
      toast.error("Merchant registry not found");
      return;
    }

    setBusy(true);
    try {
      const [registry] = merchantRegistryPda(merchantAuthority);
      const [counterPda] = customerCounterPda(publicKey);

      const counterAcct = await (program.account as Record<string, { fetchNullable: (pk: PublicKey) => Promise<{ attestationCount: BN } | null> }>)
        .customerCounter.fetchNullable(counterPda);
      const currentNonce = counterAcct
        ? BigInt(counterAcct.attestationCount.toString())
        : 0n;

      const [attestation] = attestationPda(publicKey, registry, currentNonce);
      const customerAta = getAssociatedTokenAddressSync(merchant.usdcMint, publicKey);

      const tx = new Transaction();
      const customerAtaInfo = await connection.getAccountInfo(customerAta);
      if (!customerAtaInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            customerAta,
            publicKey,
            merchant.usdcMint,
          ),
        );
      }

      const payIx = await program.methods
        .payAndAttest(new BN(parsedAmount.toString()))
        .accounts({
          customer: publicKey,
          registry,
          authority: merchant.authority,
          merchantAuthority: merchant.authority,
          usdcMint: merchant.usdcMint,
          customerAta,
          treasuryAta: merchant.treasuryAta,
          customerCounter: counterPda,
          attestation,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();
      tx.add(payIx);

      const sig = await provider.sendAndConfirm(tx);
      setLastReceipt({
        amount: quote.netAmount,
        discountBps: quote.discountBps,
        signature: sig,
      });
      setAttestationCount((c) => (c === null ? 1n : c + 1n));
      toast.success("Paid + attested", {
        description: `${formatUsdc(quote.netAmount)} sent. Sig ${sig.slice(0, 8)}…`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Payment failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Nav />
      <div className="container max-w-4xl py-10 grid gap-6 md:grid-cols-[1fr,320px]">
        <section className="card">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="text-sm text-textMuted mt-1">
            Pay the merchant and earn a portable attestation in the same signature.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-textMuted mb-1">
                Merchant wallet
              </label>
              <Input
                placeholder="Paste the merchant's Solana wallet address"
                value={merchantInput}
                onChange={(e) => setMerchantInput(e.target.value)}
              />
              {merchantAuthority && (
                <p className="text-xs text-textMuted mt-1 font-mono">
                  Registry: {shortAddress(merchantRegistryPda(merchantAuthority)[0].toBase58(), 6)}
                  {merchant && (
                    <>
                      {" "}
                      · <span className="text-text">{merchant.name}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-textMuted mb-1">
                Amount (USDC)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="stat">
                <span className="stat-label">Full price</span>
                <span className="stat-value text-lg">{formatUsdc(quote.fullAmount)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Discount</span>
                <span className="stat-value text-lg">{formatBps(quote.discountBps)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">You pay</span>
                <span className="stat-value text-lg text-accent">
                  {formatUsdc(quote.netAmount)}
                </span>
              </div>
            </div>

            <Button onClick={handlePay} isLoading={busy} className="w-full mt-2">
              Pay &amp; earn attestation
            </Button>
          </div>

          {lastReceipt && (
            <div className="mt-6">
              <ReceiptView
                merchantName={merchant?.name ?? "Merchant"}
                amount={lastReceipt.amount}
                discountBps={lastReceipt.discountBps}
                signature={lastReceipt.signature}
              />
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <TrustScoreCard attestationCount={attestationCount} />

          <div className="card text-sm">
            <h3 className="font-semibold mb-2">How portable reputation works</h3>
            <ol className="list-decimal pl-5 space-y-1 text-textMuted">
              <li>Pay any Solana merchant that uses ProofPay.</li>
              <li>One attestation mints per payment to your wallet.</li>
              <li>Every merchant reads your total count when you check out.</li>
              <li>You always see the discount before signing.</li>
            </ol>
          </div>
        </aside>
      </div>
    </main>
  );
}

interface MerchantRegistryRaw {
  authority: PublicKey;
  treasuryAta: PublicKey;
  usdcMint: PublicKey;
  policyCount: number;
  policy: { minAttestations: number; discountBps: number; validUntil: BN }[];
  name: string;
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
