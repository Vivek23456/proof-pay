use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

use crate::error::ProofPayError;
use crate::state::{MerchantRegistry, PolicyRule, MAX_MERCHANT_NAME_BYTES, MAX_POLICY_RULES};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterMerchant<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + MerchantRegistry::SIZE,
        seeds = [MerchantRegistry::SEED_PREFIX, authority.key().as_ref()],
        bump,
    )]
    pub registry: Account<'info, MerchantRegistry>,

    /// USDC mint pinned at registration time so `pay_and_attest` cannot be tricked into
    /// routing a different SPL token through the policy engine.
    pub usdc_mint: Account<'info, Mint>,

    /// Merchant-owned USDC ATA for receiving payments.
    #[account(
        constraint = treasury_ata.mint == usdc_mint.key()   @ ProofPayError::TreasuryMintMismatch,
        constraint = treasury_ata.owner == authority.key() @ ProofPayError::TreasuryOwnerMismatch,
    )]
    pub treasury_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterMerchant>, name: String) -> Result<()> {
    require!(
        !name.is_empty() && name.as_bytes().len() <= MAX_MERCHANT_NAME_BYTES,
        ProofPayError::InvalidMerchantName
    );

    let clock = Clock::get()?;
    let registry = &mut ctx.accounts.registry;

    registry.authority = ctx.accounts.authority.key();
    registry.treasury_ata = ctx.accounts.treasury_ata.key();
    registry.usdc_mint = ctx.accounts.usdc_mint.key();
    registry.policy_count = 0;
    registry.policy = [PolicyRule {
        min_attestations: 0,
        discount_bps: 0,
        valid_until: 0,
    }; MAX_POLICY_RULES];
    registry.created_at = clock.unix_timestamp;
    registry.bump = ctx.bumps.registry;
    registry.name = name;

    emit!(MerchantRegistered {
        authority: registry.authority,
        registry: registry.key(),
        name: registry.name.clone(),
        treasury_ata: registry.treasury_ata,
        created_at: registry.created_at,
    });

    Ok(())
}

#[event]
pub struct MerchantRegistered {
    pub authority: Pubkey,
    pub registry: Pubkey,
    pub name: String,
    pub treasury_ata: Pubkey,
    pub created_at: i64,
}
