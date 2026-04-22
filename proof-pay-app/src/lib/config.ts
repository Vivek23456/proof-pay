import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROOFPAY_PROGRAM_ID ??
  "ABSmAN3fhCdnEnAdRiKUWjpBwrZb2FZ41EYD3hnFN5xT",
);


// Devnet USDC by default (Circle's devnet mint). Override via env for mainnet.
export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ??
    "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
);

export const USDC_DECIMALS = 6;

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

export const MAX_POLICY_RULES = 3;

export const MERCHANT_SEED = "merchant";
export const COUNTER_SEED = "counter";
export const ATTESTATION_SEED = "attestation";
