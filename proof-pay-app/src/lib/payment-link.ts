import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { USDC_DECIMALS } from "./config";

/**
 * A merchant-issued payment link. Stored locally so the merchant can poll
 * for confirmation without a backend.
 */
export interface PendingLink {
  /** Random pubkey embedded in the tx as a non-signer marker (Solana Pay convention). */
  reference: string;
  /** Merchant authority pubkey (base58). */
  merchant: string;
  /** USDC atomic amount as a string (BigInt is not JSON-serialisable). */
  amount: string;
  productName?: string;
  createdAt: number;
  expiresAt: number;
  status: "pending" | "paid" | "expired";
  /** Set when status === "paid". */
  signature?: string;
}

/** Default link lifetime — long enough for a real-world checkout, short enough to flush stale entries. */
export const LINK_LIFETIME_MS = 30 * 60 * 1000;

const STORAGE_PREFIX = "proofpay:pending-links:";

export function newReferenceKey(): PublicKey {
  return Keypair.generate().publicKey;
}

/**
 * Build a `/checkout` URL with the amount + reference baked in. The customer
 * cannot edit either; the checkout page detects the URL params and locks the
 * inputs.
 */
export function buildPaymentUrl(opts: {
  origin: string;
  merchant: PublicKey;
  amountUsdcAtomic: bigint;
  reference: PublicKey;
  productName?: string;
}): string {
  const url = new URL(`${opts.origin}/checkout`);
  url.searchParams.set("merchant", opts.merchant.toBase58());
  // Format amount as a human-readable USDC value (the checkout page parses it back).
  const human = (Number(opts.amountUsdcAtomic) / 10 ** USDC_DECIMALS).toFixed(USDC_DECIMALS);
  url.searchParams.set("amount", human);
  url.searchParams.set("ref", opts.reference.toBase58());
  if (opts.productName) url.searchParams.set("label", opts.productName);
  return url.toString();
}

function storageKey(merchant: PublicKey | string) {
  return `${STORAGE_PREFIX}${typeof merchant === "string" ? merchant : merchant.toBase58()}`;
}

export function readPendingLinks(merchant: PublicKey | string): PendingLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(merchant));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingLink[]) : [];
  } catch {
    return [];
  }
}

function writePendingLinks(merchant: PublicKey | string, links: PendingLink[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(merchant), JSON.stringify(links));
}

export function appendPendingLink(merchant: PublicKey | string, link: PendingLink) {
  const all = readPendingLinks(merchant);
  all.unshift(link);
  // Cap to prevent unbounded growth on a long-running demo session.
  writePendingLinks(merchant, all.slice(0, 50));
}

export function updatePendingLink(
  merchant: PublicKey | string,
  reference: string,
  patch: Partial<PendingLink>,
) {
  const all = readPendingLinks(merchant);
  const idx = all.findIndex((l) => l.reference === reference);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch };
  writePendingLinks(merchant, all);
}

export function removePendingLink(
  merchant: PublicKey | string,
  reference: string,
) {
  writePendingLinks(
    merchant,
    readPendingLinks(merchant).filter((l) => l.reference !== reference),
  );
}

export function newPendingLink(opts: {
  reference: PublicKey;
  merchant: PublicKey;
  amountUsdcAtomic: bigint;
  productName?: string;
}): PendingLink {
  const now = Date.now();
  return {
    reference: opts.reference.toBase58(),
    merchant: opts.merchant.toBase58(),
    amount: opts.amountUsdcAtomic.toString(),
    productName: opts.productName,
    createdAt: now,
    expiresAt: now + LINK_LIFETIME_MS,
    status: "pending",
  };
}

/**
 * Find the most recent confirmed signature touching `reference`.
 * Returns null while the customer hasn't paid yet.
 */
export async function findReferenceSignature(
  connection: Connection,
  reference: PublicKey,
): Promise<string | null> {
  const sigs = await connection.getSignaturesForAddress(reference, { limit: 5 });
  for (const s of sigs) {
    if (s.err) continue;
    if (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized") {
      return s.signature;
    }
  }
  return null;
}

/**
 * Confirm that `signature` actually credited at least `minAmountAtomic` to
 * `treasuryAta`. We diff pre/post token balances rather than parsing instruction
 * data because `pay_and_attest` performs the SPL transfer via CPI.
 */
export async function verifyPayment(
  connection: Connection,
  signature: string,
  treasuryAta: PublicKey,
  minAmountAtomic: bigint,
): Promise<boolean> {
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx?.meta || tx.meta.err) return false;

  const accountKeys = tx.transaction.message.accountKeys;
  const treasuryStr = treasuryAta.toBase58();

  function balanceFor(side: "pre" | "post"): bigint {
    const list = side === "pre" ? tx!.meta!.preTokenBalances : tx!.meta!.postTokenBalances;
    if (!list) return 0n;
    for (const b of list) {
      const key = accountKeys[b.accountIndex]?.pubkey;
      if (key && key.toBase58() === treasuryStr) {
        return BigInt(b.uiTokenAmount.amount);
      }
    }
    return 0n;
  }

  const delta = balanceFor("post") - balanceFor("pre");
  return delta >= minAmountAtomic;
}
