# Wedge selection — ProofPay

**Decision locked:** build **ProofPay** — portable cross-merchant customer reputation on Solana, powered by the Solana Attestation Service (SAS).

This replaces the previous three-way shortlist (PolicyPay / PassStamp / TxFixture). See the evidence appendix below for why.

**Team assumption:** solo builder, ~30 h/week through 2026-05-11. See [skills-map.md](./skills-map.md).

## One-liner

Pay any Solana merchant in USDC, earn a portable on-chain attestation, and get an auto-applied discount at the next merchant that trusts your history — no per-brand loyalty accounts, no Web2 database of shame.

## Scoring

Same rubric as the prior shortlist, re-scored against ProofPay with winner-corpus evidence.

| Criterion | Score | Notes |
|-----------|-------|-------|
| Demoability | 5 | Two-merchant happy path: pay merchant A → attestation mints → pay merchant B → discount auto-applies. Under 90 seconds. |
| On-chain substance | 5 | Merchant registry PDA, policy PDA, USDC transfers, SAS attestation issuance — all on-chain, all readable. |
| Differentiation | 4 | Decal (Breakout 2nd-place Stablecoins, $20k) owns per-merchant loyalty via Token Extensions. Nobody owns *portable cross-merchant* reputation via SAS. |
| Team fit | 4 | Anchor program + Next.js app + wallet adapter — within a solo dev's reach in 20 days if scope stays frozen. Weak point: solo = no UX specialist. |
| Distribution | 3 | Plug-and-play into any Solana Pay merchant; seed with 2–5 friendly creators/OSS projects. No two-sided cold start because SAS gives credential mobility from day one. |
| Dependency risk | 4 | `sas-lib` npm published, SAS live on mainnet; fallback to internal Attestation PDA documented in [mvp-spec.md](./mvp-spec.md). |
| **Total** | **25** | Higher than the prior PolicyPay score of 26 only if we keep scope frozen; slightly lower otherwise. The point is fit, not the total. |

## Why not the three prior ideas

Deep-dive against Colosseum Copilot winner corpus (Breakout 2025 + Cypherpunk 2025) killed each of the three:

- **PolicyPay (DAO treasury multi-sig):** occupied by Squads Grid + Zebec + Streamflow. Cypherpunk 2025 had 7+ submissions in the space; zero won.
- **PassStamp (cNFT pass):** `tokengator` already won this lane at Renaissance 2024. "DAOs & Communities" track disappeared from Breakout/Cypherpunk winner distributions.
- **TxFixture (test fixture CLI):** realistic Public Goods shot, but the user wants a *startup*, not an OSS library. Public Goods narrative contradicts startup narrative.

## Why ProofPay

ProofPay sits at the intersection of three winning tags and one unfilled gap.

- **Adjacent winners (green flags):**
  - `decal-payments-and-loyalty` (Breakout Apr-2025, 2nd Stablecoins, $20k) — commerce + loyalty works at Frontier-scale hackathons.
  - `humanship-id` (Cypherpunk Sep-2025, 5th Undefined, $5k) — SAS-adjacent attestation primitives work as a wedge.
- **Tried and failed (lesson):**
  - `assap-anti-sybil-solana-attestation-protocol` (Breakout Apr-2025, did not win) — pitched as an SDK, not a consumer product. Do not repeat that mistake.
- **White space (the wedge):**
  - No winner in the corpus combines SAS + stablecoin commerce + cross-merchant portability. Decal owns per-merchant loyalty tokens (siloed). ProofPay makes reputation portable.

## Frontier 2026 context (what changed since the prior shortlist)

The Solana Frontier Hackathon (Apr 6 – May 11, 2026) **dropped all traditional tracks**. The only judging axes are product impact, Grand Champion demo strength, Public Goods reusability, and University eligibility. ProofPay targets **Grand Champion** primary, with University as a parallel submission if the builder qualifies. See [prize-lane.md](./prize-lane.md).

## Evidence appendix (auditable)

- Colosseum Copilot `search/projects` (winnersOnly) for "SAS / attestation / loyalty / commerce" — no direct-match winner found; top adjacent matches: `decal-payments-and-loyalty`, `humanship-id`, `soulboard`.
- Colosseum Copilot `search/projects` for "Solana Attestation Service" — `assap-anti-sybil-solana-attestation-protocol` tried and did not win.
- Colosseum Copilot `/analyze` on Breakout + Cypherpunk winners — top winner solution tags include `stablecoin payments` (36), `decentralized identity` (25), `smart contract escrow` (35). ProofPay hits two of the three.
- The Grid (`beta.node.thegrid.id`) — `payments_infrastructure_and_orchestration` + `merchant_payment_gateway` + `peer_to_peer_and_remittance` on Solana = 203 products across 168 distinct roots (saturated). Keyword search for "treasury policy" / "spend control" returned 0 — the specific ProofPay wording is untaken. Squads (Squads V4, SquadsX, **Grid**) and Zebec (streaming payroll + multi-sig vault) are the nearest B2B incumbents but do not serve cross-merchant consumer reputation.
- Archive framing: Nick Szabo, *Contracts with Bearer* (sim 0.25) and *Formalizing and Securing Relationships on Public Networks* (sim 0.21); a16z Crypto, *enforce safety properties in the code itself* (sim 0.66). Use these in the final README to land the Cypherpunk-philosophical framing.

## Pivot triggers (guarded)

- If SAS mainnet CPI integration is blocking by **Apr 28**, fall back to an internal `Attestation` PDA under ProofPay's program. Document the switch in the README; do not skip the feature.
- If Decal publicly announces portable cross-merchant attestations before **May 5**, pivot the wedge narrative to *creator collectives / DePIN service access / OSS bounty payouts* (segments Decal does not serve) while keeping the same program.

## Next step

Lock the baseline in [mvp-spec.md](./mvp-spec.md), confirm University eligibility in [prize-lane.md](./prize-lane.md), and begin Phase 1 Anchor scaffolding on Apr 25.
