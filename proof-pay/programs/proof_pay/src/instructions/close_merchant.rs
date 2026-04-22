use anchor_lang::prelude::*;

use crate::error::ProofPayError;
use crate::state::MerchantRegistry;

#[derive(Accounts)]
pub struct CloseMerchant<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [MerchantRegistry::SEED_PREFIX, authority.key().as_ref()],
        bump = registry.bump,
        has_one = authority @ ProofPayError::UnauthorizedMerchant,
        close = authority,
    )]
    pub registry: Account<'info, MerchantRegistry>,
}

pub fn handler(_ctx: Context<CloseMerchant>) -> Result<()> {
    Ok(())
}
