use anchor_lang::prelude::*;

use crate::error::ProofPayError;
use crate::state::{MerchantRegistry, PolicyRule, MAX_POLICY_RULES};

#[derive(Accounts)]
pub struct SetPolicy<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [MerchantRegistry::SEED_PREFIX, authority.key().as_ref()],
        bump = registry.bump,
        has_one = authority @ ProofPayError::UnauthorizedMerchant,
    )]
    pub registry: Account<'info, MerchantRegistry>,
}

pub fn handler(ctx: Context<SetPolicy>, rules: Vec<PolicyRule>) -> Result<()> {
    require!(
        rules.len() <= MAX_POLICY_RULES,
        ProofPayError::TooManyPolicyRules
    );
    for rule in rules.iter() {
        require!(rule.is_valid(), ProofPayError::InvalidDiscountBps);
    }

    let registry = &mut ctx.accounts.registry;

    for slot in registry.policy.iter_mut() {
        *slot = PolicyRule {
            min_attestations: 0,
            discount_bps: 0,
            valid_until: 0,
        };
    }
    for (i, rule) in rules.iter().enumerate() {
        registry.policy[i] = *rule;
    }
    registry.policy_count = rules.len() as u8;

    emit!(PolicyUpdated {
        registry: registry.key(),
        rule_count: registry.policy_count,
    });

    Ok(())
}

#[event]
pub struct PolicyUpdated {
    pub registry: Pubkey,
    pub rule_count: u8,
}
