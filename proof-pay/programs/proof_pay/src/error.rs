use anchor_lang::prelude::*;

#[error_code]
pub enum ProofPayError {
    #[msg("Merchant name is empty or exceeds MAX_MERCHANT_NAME_BYTES.")]
    InvalidMerchantName,

    #[msg("Too many policy rules (max 3 in MVP).")]
    TooManyPolicyRules,

    #[msg("Policy rule discount_bps exceeds MAX_DISCOUNT_BPS.")]
    InvalidDiscountBps,

    #[msg("Treasury ATA owner does not match merchant authority.")]
    TreasuryOwnerMismatch,

    #[msg("Treasury ATA mint does not match registered USDC mint.")]
    TreasuryMintMismatch,

    #[msg("Customer ATA mint does not match registered USDC mint.")]
    CustomerMintMismatch,

    #[msg("Payment amount must be greater than zero.")]
    ZeroAmount,

    #[msg("Arithmetic overflow computing discount.")]
    MathOverflow,

    #[msg("Provided merchant authority does not match the registry.")]
    UnauthorizedMerchant,

    #[msg("Customer counter PDA seed mismatch.")]
    CounterSeedMismatch,
}
