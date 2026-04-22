use anchor_lang::prelude::*;

/// Maximum number of policy rules a merchant can configure for the MVP.
/// Intentional hard cap; keeps account size bounded and UI tractable.
pub const MAX_POLICY_RULES: usize = 3;

/// Maximum UTF-8 byte length of a merchant display name.
pub const MAX_MERCHANT_NAME_BYTES: usize = 48;

/// Discount is expressed in basis points (1/100 of a percent).
/// 10_000 bps = 100%. Anything above 9_000 bps (90% off) is rejected as nonsense.
pub const MAX_DISCOUNT_BPS: u16 = 9_000;

/// Single policy rule. Evaluated against a customer's cross-merchant attestation count.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub struct PolicyRule {
    /// Minimum number of prior attestations (across ALL merchants) a customer must have.
    pub min_attestations: u8,
    /// Discount, in basis points.
    pub discount_bps: u16,
    /// Unix timestamp after which this rule stops applying. `0` = never expires.
    pub valid_until: i64,
}

impl PolicyRule {
    pub const SIZE: usize = 1 + 2 + 8; // u8 + u16 + i64

    pub fn is_valid(&self) -> bool {
        self.discount_bps <= MAX_DISCOUNT_BPS
    }
}

/// Represents a single merchant storefront.
///
/// Seeds: `[b"merchant", authority.key().as_ref()]`.
#[account]
#[derive(Debug)]
pub struct MerchantRegistry {
    /// The merchant's wallet (signer for `set_policy`, `close_merchant`).
    pub authority: Pubkey,
    /// USDC ATA owned by `authority` where payments land.
    pub treasury_ata: Pubkey,
    /// USDC mint pinned at registration time. Keeps `pay_and_attest` from being tricked
    /// into routing an arbitrary SPL token through the policy engine.
    pub usdc_mint: Pubkey,
    /// Current number of populated policy rules (0..=MAX_POLICY_RULES).
    pub policy_count: u8,
    /// Rule slots. Only the first `policy_count` entries are meaningful.
    pub policy: [PolicyRule; MAX_POLICY_RULES],
    /// Unix timestamp of registration.
    pub created_at: i64,
    /// PDA bump for seed derivation.
    pub bump: u8,
    /// UTF-8 display name for the merchant. Kept short on purpose.
    pub name: String,
}

impl MerchantRegistry {
    /// Account size for init. 8-byte discriminator is prepended automatically by Anchor.
    pub const SIZE: usize = 32            // authority
        + 32                              // treasury_ata
        + 32                              // usdc_mint
        + 1                               // policy_count
        + PolicyRule::SIZE * MAX_POLICY_RULES
        + 8                               // created_at
        + 1                               // bump
        + 4 + MAX_MERCHANT_NAME_BYTES;    // name (Vec length prefix + bytes)

    pub const SEED_PREFIX: &'static [u8] = b"merchant";

    /// Evaluate the merchant's policy against a customer's attestation count.
    /// Returns the best (largest `discount_bps`) rule that matches, or `0` if none match.
    pub fn best_discount_bps(&self, attestation_count: u64, now: i64) -> u16 {
        let mut best = 0u16;
        for i in 0..(self.policy_count as usize).min(MAX_POLICY_RULES) {
            let rule = &self.policy[i];
            if attestation_count >= rule.min_attestations as u64
                && (rule.valid_until == 0 || rule.valid_until >= now)
                && rule.discount_bps > best
            {
                best = rule.discount_bps;
            }
        }
        best
    }
}

/// Fallback attestation record — only used when the SAS CPI path is unavailable.
/// The SAS path writes to a SAS-owned account; this one is owned by the ProofPay program.
///
/// Seeds: `[b"attestation", customer.key().as_ref(), merchant.key().as_ref(), nonce.to_le_bytes().as_ref()]`.
#[account]
#[derive(Debug)]
pub struct ProofPayAttestation {
    pub merchant: Pubkey,
    pub customer: Pubkey,
    pub amount_paid: u64,
    pub discount_bps_applied: u16,
    pub timestamp: i64,
    pub nonce: u64,
    pub bump: u8,
}

impl ProofPayAttestation {
    pub const SIZE: usize = 32 + 32 + 8 + 2 + 8 + 8 + 1;
    pub const SEED_PREFIX: &'static [u8] = b"attestation";
}

/// Per-customer counter of attestations issued by this program. One account per customer.
/// Lets `pay_and_attest` read the running attestation count in O(1) without scanning
/// `getProgramAccounts` in the program itself.
///
/// Seeds: `[b"counter", customer.key().as_ref()]`.
#[account]
#[derive(Debug)]
pub struct CustomerCounter {
    pub customer: Pubkey,
    pub attestation_count: u64,
    pub bump: u8,
}

impl CustomerCounter {
    pub const SIZE: usize = 32 + 8 + 1;
    pub const SEED_PREFIX: &'static [u8] = b"counter";
}
