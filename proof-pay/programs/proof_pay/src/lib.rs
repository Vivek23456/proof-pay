//! ProofPay — portable cross-merchant customer reputation on Solana.
//!
//! On-chain surface is deliberately small:
//!   * `register_merchant` — create a `MerchantRegistry` PDA for a storefront.
//!   * `set_policy`        — merchant-only; configure up to three discount rules.
//!   * `pay_and_attest`    — atomic USDC transfer + attestation mint + policy-driven discount.
//!   * `close_merchant`    — optional cleanup; refunds rent to the merchant authority.
//!
//! Attestations are stored in a `ProofPayAttestation` PDA owned by this program (MVP fallback).
//! The SAS CPI path is wired via `attestation::issue_attestation` and can be swapped in once
//! `sas-lib` is pinned; see [`crate::attestation`] for details.

use anchor_lang::prelude::*;

pub mod attestation;
pub mod error;
pub mod instructions;
pub mod state;

pub use instructions::*;
pub use state::*;

declare_id!("ABSmAN3fhCdnEnAdRiKUWjpBwrZb2FZ41EYD3hnFN5xT");

#[program]
pub mod proof_pay {
    use super::*;

    pub fn register_merchant(ctx: Context<RegisterMerchant>, name: String) -> Result<()> {
        instructions::register_merchant::handler(ctx, name)
    }

    pub fn set_policy(ctx: Context<SetPolicy>, rules: Vec<PolicyRule>) -> Result<()> {
        instructions::set_policy::handler(ctx, rules)
    }

    pub fn pay_and_attest(ctx: Context<PayAndAttest>, amount_usdc: u64) -> Result<()> {
        instructions::pay_and_attest::handler(ctx, amount_usdc)
    }

    pub fn close_merchant(ctx: Context<CloseMerchant>) -> Result<()> {
        instructions::close_merchant::handler(ctx)
    }
}
