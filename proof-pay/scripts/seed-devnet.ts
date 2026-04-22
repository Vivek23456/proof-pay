/**
 * Seed a devnet demo: two merchants + one customer + 3 pre-existing attestations
 * across merchant A, so the submission video can open at "customer already trusted".
 *
 * Expected env:
 *   PROOFPAY_PROGRAM_ID   — pinned in Anchor.toml (default: PayBhrjWjw4sCnu9Xuu8jWpj5G6Tuu1KEGkq8Z8Kye8)
 *   PROOFPAY_USDC_MINT    — devnet USDC mint (default: Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr)
 *   PROOFPAY_RPC_URL      — defaults to https://api.devnet.solana.com
 *
 * Usage: npm run seed:devnet
 *
 * NOTE: This script is a TODO scaffold — the Anchor TS client ergonomics pin down the
 * remaining 50 lines once the IDL is generated (`npm run idl:generate`).
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey(
  process.env.PROOFPAY_PROGRAM_ID ?? "PayBhrjWjw4sCnu9Xuu8jWpj5G6Tuu1KEGkq8Z8Kye8",
);
const USDC_MINT = new PublicKey(
  process.env.PROOFPAY_USDC_MINT ?? "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
);

async function main() {
  const rpc = process.env.PROOFPAY_RPC_URL ?? clusterApiUrl("devnet");
  const connection = new Connection(rpc, "confirmed");

  console.log("ProofPay devnet seeder");
  console.log("----------------------");
  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("USDC mint :", USDC_MINT.toBase58());
  console.log("RPC       :", rpc);

  // Keypairs: load from ~/.config/solana/proofpay-* or generate + airdrop.
  const merchantA = Keypair.generate();
  const merchantB = Keypair.generate();
  const customer = Keypair.generate();

  console.log("Merchant A:", merchantA.publicKey.toBase58());
  console.log("Merchant B:", merchantB.publicKey.toBase58());
  console.log("Customer  :", customer.publicKey.toBase58());

  // TODO (Phase 3 seeder):
  //   1. airdrop 2 SOL to each of the three pubkeys
  //   2. create ATAs for USDC on all three
  //   3. call register_merchant on both merchants
  //   4. set_policy on merchant A (≥3 attestations → 10%)
  //   5. set_policy on merchant B (≥3 attestations → 15%)
  //   6. have customer call pay_and_attest 3x on merchant A
  //   7. log the final URL for the demo video

  console.log("\nSeeder scaffold only — finish the Anchor Provider wiring in Phase 3.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
