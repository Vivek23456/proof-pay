import { utils } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PartiallyDecodedInstruction,
  PublicKey,
} from "@solana/web3.js";
import { PROGRAM_ID, USDC_DECIMALS } from "./config";

const PAY_AND_ATTEST_DISCRIMINATOR = Uint8Array.from([
  21, 55, 107, 251, 19, 220, 128, 149,
]);
const PAY_AND_ATTEST_TREASURY_ACCOUNT_INDEX = 6;
const PAY_AND_ATTEST_AMOUNT_OFFSET = PAY_AND_ATTEST_DISCRIMINATOR.length;
const U64_BYTE_LENGTH = 8;

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
  if (delta >= minAmountAtomic) return true;

  // Discounted ProofPay checkouts credit the merchant with the net amount, not
  // the gross invoice amount. Accept that lower delta only when the transaction
  // is a successful ProofPay payment instruction for the exact invoice amount
  // and the merchant's treasury ATA.
  return (
    delta > 0n &&
    tx.transaction.message.instructions.some((ix) =>
      isMatchingPayAndAttestInstruction(ix, treasuryAta, minAmountAtomic),
    )
  );
}

function isMatchingPayAndAttestInstruction(
  ix: unknown,
  treasuryAta: PublicKey,
  amountAtomic: bigint,
): boolean {
  if (!isPartiallyDecodedInstruction(ix)) return false;
  if (!ix.programId.equals(PROGRAM_ID)) return false;
  if (
    !ix.accounts[PAY_AND_ATTEST_TREASURY_ACCOUNT_INDEX]?.equals(treasuryAta)
  ) {
    return false;
  }

  let data: Uint8Array;
  try {
    data = utils.bytes.bs58.decode(ix.data);
  } catch {
    return false;
  }

  const expectedLength = PAY_AND_ATTEST_AMOUNT_OFFSET + U64_BYTE_LENGTH;
  if (data.length !== expectedLength) return false;

  for (let i = 0; i < PAY_AND_ATTEST_DISCRIMINATOR.length; i += 1) {
    if (data[i] !== PAY_AND_ATTEST_DISCRIMINATOR[i]) return false;
  }

  const encodedAmount = data.subarray(
    PAY_AND_ATTEST_AMOUNT_OFFSET,
    expectedLength,
  );
  let decodedAmount = 0n;
  for (let i = 0; i < encodedAmount.length; i += 1) {
    decodedAmount |= BigInt(encodedAmount[i]) << BigInt(i * 8);
  }
  return decodedAmount === amountAtomic;
}

function isPartiallyDecodedInstruction(
  ix: unknown,
): ix is PartiallyDecodedInstruction {
  return (
    typeof ix === "object" &&
    ix !== null &&
    "programId" in ix &&
    (ix as { programId?: unknown }).programId instanceof PublicKey &&
    "accounts" in ix &&
    Array.isArray((ix as { accounts?: unknown }).accounts) &&
    "data" in ix &&
    typeof (ix as { data?: unknown }).data === "string"
  );
}
