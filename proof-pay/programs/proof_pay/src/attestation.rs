//! Attestation issuance abstraction.
//!
//! Two paths are supported:
//!   1. **Internal PDA** (default in MVP) — ProofPay owns the account; simple, no CPI
//!      risk, good enough to demo portable reputation across merchants.
//!   2. **Solana Attestation Service CPI** (preferred for mainnet launch) — defer to the
//!      Solana Foundation's SAS program so attestations inherit the shared indexer /
//!      tooling. Wire-up is sketched below; flip `USE_SAS_CPI` to `true` once the
//!      `sas-lib` version has been pinned and the CPI surface is green on devnet.
//!
//! The policy-evaluation code path is identical in both cases: we read a running
//! [`crate::state::CustomerCounter`] and compute the best-matching discount bps.

use anchor_lang::prelude::*;

use crate::state::{CustomerCounter, ProofPayAttestation};

/// Feature flag gating SAS CPI. Keep `false` until the `sas-lib` version is pinned.
pub const USE_SAS_CPI: bool = false;

/// Write the MVP fallback attestation into the customer/merchant PDA.
/// The caller is responsible for `init`-ing the account; this function only populates it.
pub fn write_internal_attestation(
    attestation: &mut Account<ProofPayAttestation>,
    counter: &mut Account<CustomerCounter>,
    merchant: Pubkey,
    customer: Pubkey,
    amount_paid: u64,
    discount_bps_applied: u16,
    timestamp: i64,
    bump: u8,
) -> Result<()> {
    attestation.merchant = merchant;
    attestation.customer = customer;
    attestation.amount_paid = amount_paid;
    attestation.discount_bps_applied = discount_bps_applied;
    attestation.timestamp = timestamp;
    attestation.nonce = counter.attestation_count;
    attestation.bump = bump;

    counter.attestation_count = counter
        .attestation_count
        .checked_add(1)
        .ok_or(crate::error::ProofPayError::MathOverflow)?;
    Ok(())
}

/// Placeholder for the SAS CPI path. Intentionally not wired until `sas-lib` is pinned.
///
/// When enabled, this will:
///   * Build a SAS `issue_attestation` instruction using the `sas-lib` CPI builder.
///   * Encode the same schema we use in [`write_internal_attestation`].
///   * `invoke_signed` via our program PDA if SAS requires an authority signer.
#[allow(unused_variables)]
pub fn issue_sas_attestation_stub(
    merchant: Pubkey,
    customer: Pubkey,
    amount_paid: u64,
    timestamp: i64,
) -> Result<()> {
    // Decision gate on Apr 28: if SAS CPI is blocking, this stub stays a stub and the
    // program falls back to `write_internal_attestation`. See docs/mvp-spec.md.
    Ok(())
}
