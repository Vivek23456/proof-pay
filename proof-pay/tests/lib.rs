//! LiteSVM harness for ProofPay.
//!
//! Each test spins up an in-process SVM, loads the built `proof_pay.so`, creates a
//! USDC-like mint, and exercises the full register → set_policy → pay_and_attest flow.
//!
//! Build the program first:
//!     cd proof-pay && anchor build -p proof_pay
//! Then:
//!     cargo test --manifest-path tests/Cargo.toml

use anchor_lang::prelude::*;
use anchor_lang::{InstructionData, ToAccountMetas};
use litesvm::LiteSVM;
use litesvm_token::{CreateAssociatedTokenAccount, CreateMint, MintTo};
use proof_pay::state::{CustomerCounter, MerchantRegistry, PolicyRule, ProofPayAttestation};
use solana_sdk::{
    instruction::Instruction,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};

const PROGRAM_ID: Pubkey = proof_pay::ID;

fn load_program(svm: &mut LiteSVM) {
    // Expect `anchor build` output at `../target/deploy/proof_pay.so`.
    let so_path = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("target")
        .join("deploy")
        .join("proof_pay.so");
    svm.add_program_from_file(PROGRAM_ID, &so_path)
        .expect("add proof_pay program");
}

fn setup() -> (LiteSVM, Keypair, Keypair, Keypair, Pubkey, Pubkey, Pubkey) {
    let mut svm = LiteSVM::new();
    load_program(&mut svm);

    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 10_000_000_000).unwrap();

    let merchant_authority = Keypair::new();
    svm.airdrop(&merchant_authority.pubkey(), 10_000_000_000).unwrap();

    let customer = Keypair::new();
    svm.airdrop(&customer.pubkey(), 10_000_000_000).unwrap();

    let usdc_mint = CreateMint::new(&mut svm, &payer)
        .decimals(6)
        .send()
        .expect("create USDC mint");

    let treasury_ata = CreateAssociatedTokenAccount::new(&mut svm, &payer, &usdc_mint)
        .owner(&merchant_authority)
        .send()
        .expect("create merchant treasury ATA");

    let customer_ata = CreateAssociatedTokenAccount::new(&mut svm, &payer, &usdc_mint)
        .owner(&customer)
        .send()
        .expect("create customer ATA");

    MintTo::new(&mut svm, &payer, &usdc_mint, &customer_ata, 1_000_000_000)
        .send()
        .expect("fund customer USDC");

    (svm, payer, merchant_authority, customer, usdc_mint, treasury_ata, customer_ata)
}

fn registry_pda(authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[MerchantRegistry::SEED_PREFIX, authority.as_ref()], &PROGRAM_ID)
}

fn counter_pda(customer: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[CustomerCounter::SEED_PREFIX, customer.as_ref()], &PROGRAM_ID)
}

fn attestation_pda(customer: &Pubkey, registry: &Pubkey, nonce: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            ProofPayAttestation::SEED_PREFIX,
            customer.as_ref(),
            registry.as_ref(),
            &nonce.to_le_bytes(),
        ],
        &PROGRAM_ID,
    )
}

fn register_merchant(
    svm: &mut LiteSVM,
    payer: &Keypair,
    authority: &Keypair,
    usdc_mint: &Pubkey,
    treasury_ata: &Pubkey,
    name: &str,
) -> Pubkey {
    let (registry, _) = registry_pda(&authority.pubkey());

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: proof_pay::accounts::RegisterMerchant {
            authority: authority.pubkey(),
            registry,
            usdc_mint: *usdc_mint,
            treasury_ata: *treasury_ata,
            system_program: anchor_lang::system_program::ID,
        }
        .to_account_metas(None),
        data: proof_pay::instruction::RegisterMerchant { name: name.to_string() }.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&payer.pubkey()),
        &[payer, authority],
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx).expect("register_merchant");
    registry
}

fn set_policy(
    svm: &mut LiteSVM,
    authority: &Keypair,
    rules: Vec<PolicyRule>,
) {
    let (registry, _) = registry_pda(&authority.pubkey());
    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: proof_pay::accounts::SetPolicy {
            authority: authority.pubkey(),
            registry,
        }
        .to_account_metas(None),
        data: proof_pay::instruction::SetPolicy { rules }.data(),
    };
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&authority.pubkey()),
        &[authority],
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx).expect("set_policy");
}

#[allow(clippy::too_many_arguments)]
fn pay_and_attest(
    svm: &mut LiteSVM,
    customer: &Keypair,
    merchant_authority_pubkey: &Pubkey,
    usdc_mint: &Pubkey,
    treasury_ata: &Pubkey,
    customer_ata: &Pubkey,
    amount: u64,
) -> (Pubkey, Pubkey) {
    let (registry, _) = registry_pda(merchant_authority_pubkey);
    let (customer_counter, _) = counter_pda(&customer.pubkey());

    let nonce = svm
    .get_account(&customer_counter)
    .and_then(|acc| CustomerCounter::try_deserialize(&mut &acc.data[..]).ok())
    .map(|c| c.attestation_count)
    .unwrap_or(0);

    let (attestation, _) = attestation_pda(&customer.pubkey(), &registry, nonce);

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: proof_pay::accounts::PayAndAttest {
            customer: customer.pubkey(),
            registry,
            authority: *merchant_authority_pubkey,
            merchant_authority: *merchant_authority_pubkey,
            usdc_mint: *usdc_mint,
            customer_ata: *customer_ata,
            treasury_ata: *treasury_ata,
            customer_counter,
            attestation,
            token_program: anchor_spl::token::ID,
            system_program: anchor_lang::system_program::ID,
            rent: solana_sdk::sysvar::rent::ID,
        }
        .to_account_metas(None),
        data: proof_pay::instruction::PayAndAttest { amount_usdc: amount }.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&customer.pubkey()),
        &[customer],
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx).expect("pay_and_attest");
    (registry, attestation)
}

#[test]
fn happy_path_register_and_single_payment() {
    let (mut svm, payer, merchant_auth, customer, usdc_mint, treasury_ata, customer_ata) = setup();
    let registry = register_merchant(&mut svm, &payer, &merchant_auth, &usdc_mint, &treasury_ata, "Cafe Solana");

    let raw = svm.get_account(&registry).unwrap();
    let parsed = MerchantRegistry::try_deserialize(&mut &raw.data[..]).unwrap();
    assert_eq!(parsed.name, "Cafe Solana");
    assert_eq!(parsed.authority, merchant_auth.pubkey());
    assert_eq!(parsed.policy_count, 0);

    let (_, _) = pay_and_attest(
        &mut svm,
        &customer,
        &merchant_auth.pubkey(),
        &usdc_mint,
        &treasury_ata,
        &customer_ata,
        10_000_000, // 10 USDC
    );

    let (counter_pk, _) = counter_pda(&customer.pubkey());
    let raw = svm.get_account(&counter_pk).unwrap();
    let counter = CustomerCounter::try_deserialize(&mut &raw.data[..]).unwrap();
    assert_eq!(counter.attestation_count, 1);
}

#[test]
fn discount_applies_after_threshold() {
    let (mut svm, payer, merchant_auth, customer, usdc_mint, treasury_ata, customer_ata) = setup();
    register_merchant(&mut svm, &payer, &merchant_auth, &usdc_mint, &treasury_ata, "Lunch Counter");
    set_policy(
        &mut svm,
        &merchant_auth,
        vec![PolicyRule { min_attestations: 2, discount_bps: 1_500, valid_until: 0 }],
    );

    // Three purchases. The first two are at full price (< min_attestations). The third sees 15% off.
    for _ in 0..3 {
        pay_and_attest(
            &mut svm,
            &customer,
            &merchant_auth.pubkey(),
            &usdc_mint,
            &treasury_ata,
            &customer_ata,
            10_000_000,
        );
    }

    let (counter_pk, _) = counter_pda(&customer.pubkey());
    let raw = svm.get_account(&counter_pk).unwrap();
    let counter = CustomerCounter::try_deserialize(&mut &raw.data[..]).unwrap();
    assert_eq!(counter.attestation_count, 3);

    // Verify the third attestation recorded a 15% discount.
    let (_, reg) = (counter_pk, registry_pda(&merchant_auth.pubkey()).0);
    let (third_att, _) = attestation_pda(&customer.pubkey(), &reg, 2);
    let raw = svm.get_account(&third_att).unwrap();
    let att = ProofPayAttestation::try_deserialize(&mut &raw.data[..]).unwrap();
    assert_eq!(att.discount_bps_applied, 1_500);
    assert_eq!(att.amount_paid, 8_500_000); // 10 USDC - 15% = 8.50
}

#[test]
fn portable_reputation_across_two_merchants() {
    let (mut svm, payer, merchant_a, _, usdc_mint, treasury_a, customer_ata) = setup();
    let customer = Keypair::new();
    svm.airdrop(&customer.pubkey(), 10_000_000_000).unwrap();
    // Reuse customer_ata's keypair? No — we need a fresh one; let's rebuild it.
    let customer_ata_pk = CreateAssociatedTokenAccount::new(&mut svm, &payer, &usdc_mint)
        .owner(&customer)
        .send()
        .expect("customer ATA");
    MintTo::new(&mut svm, &payer, &usdc_mint, &customer_ata_pk, 1_000_000_000)
        .send()
        .unwrap();
    let _ = customer_ata;

    let merchant_b = Keypair::new();
    svm.airdrop(&merchant_b.pubkey(), 10_000_000_000).unwrap();
    let treasury_b = CreateAssociatedTokenAccount::new(&mut svm, &payer, &usdc_mint)
        .owner(&merchant_b)
        .send()
        .unwrap();

    register_merchant(&mut svm, &payer, &merchant_a, &usdc_mint, &treasury_a, "A");
    register_merchant(&mut svm, &payer, &merchant_b, &usdc_mint, &treasury_b, "B");
    set_policy(
        &mut svm,
        &merchant_b,
        vec![PolicyRule { min_attestations: 2, discount_bps: 2_000, valid_until: 0 }],
    );

    // Two purchases at merchant A — no policy, no discount, but attestation count climbs.
    for _ in 0..2 {
        pay_and_attest(
            &mut svm,
            &customer,
            &merchant_a.pubkey(),
            &usdc_mint,
            &treasury_a,
            &customer_ata_pk,
            10_000_000,
        );
    }

    // First-ever purchase at merchant B — portable reputation kicks in.
    let (_, att_pk) = pay_and_attest(
        &mut svm,
        &customer,
        &merchant_b.pubkey(),
        &usdc_mint,
        &treasury_b,
        &customer_ata_pk,
        10_000_000,
    );
    let raw = svm.get_account(&att_pk).unwrap();
    let att = ProofPayAttestation::try_deserialize(&mut &raw.data[..]).unwrap();
    assert_eq!(att.discount_bps_applied, 2_000);
    assert_eq!(att.amount_paid, 8_000_000);
}
