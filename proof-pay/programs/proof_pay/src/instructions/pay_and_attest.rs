use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::attestation::write_internal_attestation;
use crate::error::ProofPayError;
use crate::state::{CustomerCounter, MerchantRegistry, ProofPayAttestation};

/// Atomic USDC transfer + attestation issuance + policy-driven discount.
#[derive(Accounts)]
pub struct PayAndAttest<'info> {
    #[account(mut)]
    pub customer: Signer<'info>,

    /// The merchant's registry PDA. Verified via `has_one = authority` + seeds.
    #[account(
        seeds = [MerchantRegistry::SEED_PREFIX, merchant_authority.key().as_ref()],
        bump = registry.bump,
        has_one = authority @ ProofPayError::UnauthorizedMerchant,
        has_one = usdc_mint @ ProofPayError::TreasuryMintMismatch,
        has_one = treasury_ata @ ProofPayError::TreasuryOwnerMismatch,
    )]
    pub registry: Box<Account<'info, MerchantRegistry>>,

    /// Readonly reference — only used to tie the seed back to the registry's authority.
    /// CHECK: verified against `registry.authority` via the `has_one` constraint above.
    #[account(address = registry.authority)]
    pub authority: UncheckedAccount<'info>,

    /// Same as above but exposed with an `UncheckedAccount` alias named `merchant_authority`
    /// for the seed derivation. We keep the two separate to stay explicit about intent.
    /// CHECK: identical pubkey to `authority`.
    #[account(address = registry.authority)]
    pub merchant_authority: UncheckedAccount<'info>,

    /// USDC mint pinned at registration time.
    pub usdc_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = customer_ata.mint == registry.usdc_mint @ ProofPayError::CustomerMintMismatch,
        constraint = customer_ata.owner == customer.key(),
    )]
    pub customer_ata: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub treasury_ata: Box<Account<'info, TokenAccount>>,

    /// Running per-customer attestation counter. Init-if-needed so a first-time
    /// customer doesn't need a separate "opt-in" step.
    #[account(
        init_if_needed,
        payer = customer,
        space = 8 + CustomerCounter::SIZE,
        seeds = [CustomerCounter::SEED_PREFIX, customer.key().as_ref()],
        bump,
    )]
    pub customer_counter: Box<Account<'info, CustomerCounter>>,

    /// The fallback attestation record.
    /// Seeded by `(customer, merchant, counter.attestation_count)` so each new purchase
    /// gets a unique PDA without requiring a client-supplied nonce.
    #[account(
        init,
        payer = customer,
        space = 8 + ProofPayAttestation::SIZE,
        seeds = [
            ProofPayAttestation::SEED_PREFIX,
            customer.key().as_ref(),
            registry.key().as_ref(),
            &customer_counter.attestation_count.to_le_bytes(),
        ],
        bump,
    )]
    pub attestation: Box<Account<'info, ProofPayAttestation>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<PayAndAttest>, amount_usdc: u64) -> Result<()> {
    require!(amount_usdc > 0, ProofPayError::ZeroAmount);

    let now = Clock::get()?.unix_timestamp;

    // Initialise the counter fields on first use. `init_if_needed` leaves them zeroed
    // on a fresh account; an existing account keeps its current `attestation_count`.
    if ctx.accounts.customer_counter.customer == Pubkey::default() {
        ctx.accounts.customer_counter.customer = ctx.accounts.customer.key();
        ctx.accounts.customer_counter.bump = ctx.bumps.customer_counter;
    }

    // Policy evaluation uses the customer's *prior* attestation count (purchases elsewhere
    // already count — the current purchase has not been recorded yet).
    let prior_attestations = ctx.accounts.customer_counter.attestation_count;
    let discount_bps = ctx
        .accounts
        .registry
        .best_discount_bps(prior_attestations, now);

    let discount_amount = (amount_usdc as u128)
        .checked_mul(discount_bps as u128)
        .and_then(|v| v.checked_div(10_000))
        .ok_or(ProofPayError::MathOverflow)? as u64;

    let net_amount = amount_usdc
        .checked_sub(discount_amount)
        .ok_or(ProofPayError::MathOverflow)?;

    // SPL CPI — customer's ATA → merchant treasury ATA.
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.customer_ata.to_account_info(),
            to: ctx.accounts.treasury_ata.to_account_info(),
            authority: ctx.accounts.customer.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, net_amount)?;

    // Issue the attestation. Internal-PDA path is default; see `attestation.rs` for
    // the SAS CPI toggle.
    write_internal_attestation(
        &mut *ctx.accounts.attestation,
        &mut *ctx.accounts.customer_counter,
        ctx.accounts.registry.key(),
        ctx.accounts.customer.key(),
        net_amount,
        discount_bps,
        now,
        ctx.bumps.attestation,
    )?;

    emit!(PaymentRecorded {
        customer: ctx.accounts.customer.key(),
        merchant: ctx.accounts.registry.key(),
        amount_requested: amount_usdc,
        amount_paid: net_amount,
        discount_bps,
        prior_attestations,
        new_attestation_count: ctx.accounts.customer_counter.attestation_count,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct PaymentRecorded {
    pub customer: Pubkey,
    pub merchant: Pubkey,
    pub amount_requested: u64,
    pub amount_paid: u64,
    pub discount_bps: u16,
    pub prior_attestations: u64,
    pub new_attestation_count: u64,
    pub timestamp: i64,
}
