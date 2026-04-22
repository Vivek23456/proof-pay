"use client";

import { useMemo } from "react";
import {
  AnchorProvider,
  Program,
  Idl,
} from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

import idlJson from "./proof_pay.json";
import { PROGRAM_ID } from "./config";

export const IDL = idlJson as unknown as Idl;

export type ProofPayProgram = Program<Idl>;

function adaptWallet(wallet: WalletContextState) {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    return null;
  }
  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions.bind(wallet),
  };
}

export function makeProvider(connection: Connection, wallet: WalletContextState) {
  const adapted = adaptWallet(wallet);
  if (!adapted) return null;
  return new AnchorProvider(connection, adapted as never, {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });
}

export function makeProgram(provider: AnchorProvider): ProofPayProgram {
  // Anchor 0.30+: programId aata hai IDL ke "address" field se, alag pass nahi karna.
  return new Program(IDL, provider);
}

/**
 * Convenience hook: returns the Program (typed as Anchor's generic Program<Idl>)
 * once a wallet is connected. Returns null when the wallet is missing.
 */
export function useProofPayProgram(): {
  program: ProofPayProgram | null;
  provider: AnchorProvider | null;
} {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    const provider = makeProvider(connection, wallet);
    if (!provider) return { program: null, provider: null };
    return { program: makeProgram(provider), provider };
  }, [connection, wallet]);
}

export const PROOFPAY_PROGRAM_ID: PublicKey = PROGRAM_ID;
