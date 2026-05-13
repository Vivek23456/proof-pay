"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";
import { Nav } from "@/components/proofpay/nav";
import { PROGRAM_ID, USDC_MINT } from "@/lib/config";
import { merchantRegistryPda } from "@/lib/pda";
import { shortAddress } from "@/lib/format";
import { PolicyEditor, type DraftRule } from "@/components/proofpay/policy-editor";
import { TxList } from "@/components/proofpay/tx-list";
import { OnboardPanel } from "@/components/proofpay/onboard-panel";
import { FaucetCard } from "@/components/proofpay/faucet-card";
import { PaymentLinkBuilder } from "@/components/proofpay/payment-link-builder";
import { PaymentWatcher } from "@/components/proofpay/payment-watcher";
import { MerchantHistory } from "@/components/proofpay/merchant-history";
import { Leaderboard } from "@/components/proofpay/leaderboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useProofPayProgram } from "@/lib/anchor";
import type { TxRow } from "@/components/proofpay/tx-list";

interface MerchantState {
  registry: PublicKey | null;
  name: string | null;
  treasuryAta: PublicKey | null;
  policyCount: number;
  rules: DraftRule[];
  loading: boolean;
  exists: boolean;
}

interface MerchantRegistryRaw {
  authority: PublicKey;
  treasuryAta: PublicKey;
  usdcMint: PublicKey;
  policyCount: number;
  policy: { minAttestations: number; discountBps: number; validUntil: BN }[];
  name: string;
}

export default function MerchantDashboardPage() {
  const { publicKey, connected } = useWallet();
  const { program } = useProofPayProgram();
  const [txRows, setTxRows] = useState<TxRow[]>([]);
  const [state, setState] = useState<MerchantState>({
    registry: null,
    name: null,
    treasuryAta: null,
    policyCount: 0,
    rules: [],
    loading: false,
    exists: false,
  });
  const [linkRefreshKey, setLinkRefreshKey] = useState(0);

  useEffect(() => {
    if (!publicKey || !program) {
      setState((s) => ({ ...s, registry: null, exists: false }));
      return;
    }
    const [registryPda] = merchantRegistryPda(publicKey);
    setState((s) => ({ ...s, registry: registryPda, loading: true }));

    let cancelled = false;
    (async () => {
      try {
        const reg = await (program.account as Record<string, { fetchNullable: (pk: PublicKey) => Promise<MerchantRegistryRaw | null> }>)
          .merchantRegistry.fetchNullable(registryPda);
        if (cancelled) return;
        if (!reg) {
          setState((s) => ({
            ...s,
            exists: false,
            loading: false,
            rules: [],
            name: null,
            treasuryAta: null,
            policyCount: 0,
          }));
          return;
        }
        const rules: DraftRule[] = Array.from({ length: reg.policyCount }).map((_, i) => ({
          minAttestations: reg.policy[i].minAttestations,
          discountBps: reg.policy[i].discountBps,
          validUntil: Number(reg.policy[i].validUntil.toString()),
        }));
        setState((s) => ({
          ...s,
          exists: true,
          loading: false,
          name: reg.name,
          treasuryAta: reg.treasuryAta,
          policyCount: reg.policyCount,
          rules,
        }));
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey, program]);

  if (!connected || !publicKey) {
    return (
      <main className="min-h-screen">
        <Nav />
        <div className="container max-w-xl py-20">
          <div className="card text-center">
            <h1 className="text-2xl font-semibold mb-2">Merchant dashboard</h1>
            <p className="text-textMuted text-sm mb-6">
              Connect your wallet to register a storefront or edit your policy rules.
            </p>
            <p className="text-xs text-textMuted">
              Network: devnet · Program:{" "}
              <span className="font-mono">{shortAddress(PROGRAM_ID.toBase58(), 6)}</span>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Nav />
      <div className="container max-w-5xl py-10 grid gap-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat">
            <span className="stat-label">Merchant authority</span>
            <span className="stat-value text-base font-mono">
              {shortAddress(publicKey.toBase58(), 6)}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Treasury mint</span>
            <span className="stat-value text-base font-mono">
              {shortAddress(USDC_MINT.toBase58(), 6)}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Registry status</span>
            {state.loading ? (
              <Skeleton className="h-6 w-28 mt-1" />
            ) : (
              <span className="stat-value text-base flex items-center gap-2">
                {state.exists ? (
                  <>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                    Registered
                  </>
                ) : (
                  "Not registered"
                )}
              </span>
            )}
          </div>
        </section>

        {!state.exists ? (
          <div className="grid gap-6 md:grid-cols-[1fr,320px] items-start">
            <OnboardPanel />
            <FaucetCard />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-[1fr,320px] items-start">
              <PolicyEditor />
              <FaucetCard />
            </div>
            <div className="grid gap-6 md:grid-cols-2 items-start">
              <PaymentLinkBuilder
                onCreated={() => setLinkRefreshKey((k) => k + 1)}
              />
              <PaymentWatcher refreshKey={linkRefreshKey} />
            </div>
            <TxList
              merchantRegistry={state.registry}
              onDataLoaded={setTxRows}
            />
            <MerchantHistory txRows={txRows} />
            <div className="grid gap-6 md:grid-cols-2 items-start">
              <Leaderboard
                merchantRegistry={state.registry}
                txRows={txRows}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}