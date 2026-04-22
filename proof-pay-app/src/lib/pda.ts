import { PublicKey } from "@solana/web3.js";
import {
  ATTESTATION_SEED,
  COUNTER_SEED,
  MERCHANT_SEED,
  PROGRAM_ID,
} from "./config";

export function merchantRegistryPda(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(MERCHANT_SEED), authority.toBuffer()],
    PROGRAM_ID,
  );
}

export function customerCounterPda(customer: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(COUNTER_SEED), customer.toBuffer()],
    PROGRAM_ID,
  );
}

export function attestationPda(
  customer: PublicKey,
  registry: PublicKey,
  nonce: bigint,
) {
  const nonceBuf = Buffer.alloc(8);
  nonceBuf.writeBigUInt64LE(nonce);
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ATTESTATION_SEED), customer.toBuffer(), registry.toBuffer(), nonceBuf],
    PROGRAM_ID,
  );
}
