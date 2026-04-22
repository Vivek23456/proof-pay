import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, USDC_MINT } from "@/lib/config";

/**
 * Solana Pay transaction-request endpoint.
 *
 * GET  -> returns the label + icon (Solana Pay spec).
 * POST -> returns a serialized `pay_and_attest` transaction for the client to sign.
 *
 * Wire the POST handler once the Anchor IDL client is generated. The happy path:
 *   1. decode `account` from the request body (customer pubkey)
 *   2. derive registry + customer_counter + attestation PDAs
 *   3. build pay_and_attest ix via program.methods.payAndAttest(amount).accountsStrict(...)
 *   4. return { transaction: base64(tx.serialize({verifySignatures: false})) }
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const label = url.searchParams.get("label") ?? "ProofPay";
  return NextResponse.json({
    label,
    icon: "https://solana.com/src/img/branding/solanaLogoMark.svg",
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const merchant = url.searchParams.get("merchant");
  const amount = url.searchParams.get("amount");

  if (!merchant || !amount) {
    return NextResponse.json({ error: "missing merchant or amount" }, { status: 400 });
  }

  try {
    const merchantKey = new PublicKey(merchant);
    // Placeholder — real build happens once the IDL client is wired.
    return NextResponse.json({
      message: "ProofPay pay_and_attest scaffold",
      merchant: merchantKey.toBase58(),
      amount,
      programId: PROGRAM_ID.toBase58(),
      usdcMint: USDC_MINT.toBase58(),
      transaction: null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 400 });
  }
}
