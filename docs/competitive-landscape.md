# Competitive landscape — ProofPay

Snapshot as of 2026-04-22. Grounded in Colosseum Copilot builder project data, The Grid ecosystem index, and live web checks. Purpose: make the "why we're differentiated" paragraph of the submission README unambiguous.

## TL;DR

| Player | What they do | Relationship to ProofPay |
|--------|--------------|--------------------------|
| **Decal** | Solana stablecoin POS + Token-Extension loyalty tokens (per-merchant). Square integration. 1% fees. Yield-funded rewards. | Direct adjacent competitor. Per-merchant siloed loyalty. We build the cross-merchant portable layer Decal does not. |
| **Humanship ID** | ZK-proof human identity layer on Solana. Privacy-first. Won Cypherpunk 2025 Undefined 5th ($5k). | Not a competitor. Potential v2 integration partner (sybil-resistance on top of ProofPay attestations). |
| **ASSAP** | Anti-sybil Solana attestation protocol. Developer SDK pitch. Breakout 2025, did not win. | Cautionary tale: attestation protocols pitched as infra lose. We pitch consumer-merchant product. |
| **Squads Grid** | Programmable payment APIs, smart accounts, conditional payments, spending limits, standing orders. B2B/DAO focus. | Adjacent but different segment. B2B treasury; we are consumer merchant-customer loyalty. |
| **Zebec** | Streaming payroll, multi-sig vaults, USDC treasury, cross-border payroll. | Adjacent; same reason — B2B payroll, not merchant-customer reputation. |
| **Solana Attestation Service** | Solana Foundation public good. `sas-lib` npm, live on mainnet. | Our **infrastructure dependency**, not a competitor. ProofPay is the merchant-facing application layer. |

---

## Decal (direct adjacent competitor)

- **Product:** Stablecoin payments and loyalty for merchants. Integrates with existing POS (Square). 1% transaction fee vs. 3.5% card. Instant settlement. Loyalty rewards funded by yield earned on customer stored value.
- **Primitives:** SPL Token, Token Extensions, yield-bearing balances.
- **Hackathon evidence:** `decal-payments-and-loyalty` — Breakout Apr-2025, **won 2nd Place Stablecoins track, $20,000**. Tracks: Consumer Apps + Stablecoins.
- **Current status:** Live product at [usedecal.com](https://usedecal.com). Real merchants onboarded.
- **Where ProofPay differentiates:**
  - Decal's loyalty is **per-merchant** — each Token-Extension token lives inside that merchant's loyalty program. A coffee shop's stamp card and a bookstore's points don't talk.
  - ProofPay's attestations are **portable** — a customer's purchase history across *every* participating Solana merchant is readable by any other merchant that opts to honor it. The customer owns the credential, not the merchant's database.
  - Decal targets retail brands with Square POS. ProofPay targets creators, micro-merchants, DePIN service providers, OSS bounty programs — segments Decal doesn't cover today.
- **Read:** Decal is **validation** that Solana commerce + loyalty wins prizes, not a blocker. Cite them honestly in the README.

## Humanship ID (potential integration partner, not competitor)

- **Product:** Privacy-first human identity layer. ZK proofs, on-device verification, sybil-resistance.
- **Primitives:** `zk-proof`, `identity`, `sybil-resistance`, `attestation`.
- **Hackathon evidence:** `humanship-id` — Cypherpunk Sep-2025, **won 5th Place Undefined track, $5,000**.
- **Where it fits ProofPay:** v2 feature. Humanship can vouch that a ProofPay attestation was issued to a unique human, eliminating sybil-farmed loyalty reputation. Keep v1 simple (one-wallet = one-customer); add Humanship later for credibility.
- **Read:** friendly ecosystem neighbor. Mention in the README "what's next" section.

## ASSAP (cautionary tale)

- **Product:** Anti-sybil Solana attestation protocol. Programmable attestations with weighted identity scores. Developer SDK.
- **Primitives:** `attestation`, `identity`, `sybil-resistance`, `oracle`.
- **Hackathon evidence:** `assap-anti-sybil-solana-attestation-protocol` — Breakout Apr-2025, **did not win**. Tracks: Consumer Apps + DePIN + Infrastructure.
- **Why they lost:** Pitched as an SDK / developer infrastructure, not a consumer product. Attestation protocols without a visible user-facing loop do not win hackathon demos. Humanship succeeded six months later with the same primitive because they built a *user-visible* identity product.
- **Lesson for ProofPay:** Lead the demo with the customer discount. The attestation mechanics are the second story, not the first.

## Squads Grid (adjacent B2B incumbent)

- **Product:** Programmable payment APIs on Squads multi-sig infrastructure. Smart accounts with conditional payments, spending limits, timelocks, standing orders. Developer-first.
- **Status:** Live at [developers.squads.so](https://developers.squads.so). V4 multi-sig is production-grade; Grid API is newer.
- **Primitives:** multi-sig, policy rules, smart accounts.
- **Why not a competitor:**
  - Squads Grid is a **developer API** serving DAOs, treasuries, and institutional smart accounts. ProofPay is a **merchant-customer consumer product**.
  - Squads's policies are executed by the account owner (treasury admin). ProofPay's policies are defined by the merchant and evaluated against the *customer's* cross-merchant history.
  - Different buyer, different motion.
- **Could Squads ship into our space?** Yes. Mitigation is in [wedge-shortlist.md](./wedge-shortlist.md) pivot triggers — if they announce cross-merchant portable reputation before May 5, we narrow the segment to creator/DePIN/OSS payouts where Squads is not the incumbent.

## Zebec (adjacent B2B incumbent)

- **Product:** Continuous streaming payments for payroll, token vesting, DAO treasury. Multi-sig vaults. USDC-focused. Cross-border payroll (Zebec Payroll / WageLink) and crypto-native payment cards (Zebec Cards).
- **Status:** Live; expanding into Stellar in 2025.
- **Why not a competitor:** Same reason as Squads — B2B payroll and treasury, not consumer merchant-customer reputation.

## Solana Attestation Service (infrastructure dependency)

- **What it is:** Solana Foundation public good at `solana-foundation/solana-attestation-service`. `sas-lib` on npm. Live on mainnet. Rust-first program, TypeScript client.
- **Why we use it:** Avoid building a custom attestation program. Inherit Solana Foundation trust. Get indexer / tooling support for free.
- **Risks:**
  - Ongoing development — PR #101 (compressed attestations, Light Protocol) is not yet merged as of 2026-04-22; pin SDK version and do not chase unreleased features.
  - CPI surface may shift. Keep the fallback internal `Attestation` PDA ready as documented in [mvp-spec.md](./mvp-spec.md).
- **Documentation:** [launch.solana.com/docs/attestations](https://launch.solana.com/docs/attestations).

---

## Grid ecosystem saturation (sanity check)

Grid GraphQL query on Solana-tagged products:

- `payments_infrastructure_and_orchestration` + `merchant_payment_gateway` + `peer_to_peer_and_remittance`: **203 products, 168 distinct roots** — saturated.
- Keyword search for `"treasury policy"`: **0** — linguistically open.
- Keyword search for `"spend control"`: **0** — linguistically open.
- Top live Solana payment orchestrators: Stripe Stablecoin Infrastructure (open_beta), Circle USDCKit (early_access), Bando, Zebec App, Wirex Pay, Bridge (bridge.xyz), Fireblocks Network, BVNK, AEON.

The payment-rail layer is crowded. The **reputation layer on top of those rails** — the wedge ProofPay claims — is empty.

## What we will tell judges in two sentences

> ProofPay is what Decal can't be: your Solana purchase history is *yours*, not each merchant's database. Pay once, every future merchant who opts in can trust you — and price accordingly.

Keep that exact framing in the submission.
