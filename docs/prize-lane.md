# Prize lane choice — ProofPay @ Frontier 2026

Official reference: [Solana Frontier Hackathon](https://www.colosseum.com/frontier). Runs Apr 6 – **May 11, 2026**.

**Important update from the prior version of this doc:** Frontier 2026 dropped all traditional tracks (no Consumer Apps, no DeFi, no Stablecoins, no Infrastructure). Judging is single-axis on product impact. This simplifies the decision.

## Prizes available

| Prize | Amount | Fit for ProofPay |
|-------|--------|------------------|
| **Grand Champion** | $30,000 | Primary target. Requires a product-shaped demo with a clear user, retention hook, and "why Solana." ProofPay's two-merchant portable-attestation demo maps cleanly. |
| 20 standout teams | $10,000 each | Automatic consideration for any submission with credible delivery. Secondary safety net. |
| **University Award** | $10,000 | Parallel submission if the solo builder qualifies. Confirm eligibility below. |
| **Public Goods Award** | $10,000 | *Not a fit.* ProofPay is a consumer product, not a reusable SDK. Do not split focus. |

## Decision

| Lane | Target | Rationale |
|------|--------|-----------|
| **Primary** | **Grand Champion** | Best fit for a shipping consumer product with clear on-chain value and demo wow-factor. Matches recent Grand Champion winners (Unruggable at Cypherpunk 2025). |
| **Secondary** | 20 standout teams pool | Automatic — no separate action. Just ship a credible submission. |
| **Parallel** | **University Award** | Only if solo builder meets Colosseum's current university criteria. Zero extra build work; add the flag on the Arena submission form. |

## Grand Champion — what to optimize for

- Product-shaped demo (not a lab experiment). The two-merchant discount flow is the hero moment.
- Clear user (creators / small merchants on Solana) and retention hook (portable reputation that compounds across merchants).
- "Why Solana" is non-generic: sub-cent per-payment cost enables micro-merchant attestations that EVM gas would kill, and SAS is Solana-native.
- Mainnet or devnet path that judges can follow from README in under 15 minutes.
- Evidence of distribution intent: at least one friendly merchant runs the flow before submission.

## University Award — confirm now

Check current Frontier rules at [arena.colosseum.org](https://arena.colosseum.org) before submission. Typical Colosseum criteria (verify, do not assume):

- Solo / all team members enrolled in a recognized university (or within the Dropout Program window).
- Flag set on submission form and in README.
- Advisor/institution naming optional depending on the edition.

**University eligible (yes / no / unsure):** _unsure — verify in Arena submission guidelines during Phase 0._

If **yes**: add a one-line README banner ("Submitted to University Award — <Institution>") and check the checkbox on the Arena form. No other changes.

If **no**: ignore this lane. Do not invent a team affiliation.

## What NOT to do

- **Do not pitch as dev tooling.** ASSAP did that at Breakout with a more-mature attestation product and lost. Consumer-product framing wins.
- **Do not mention "Token Extensions" as your loyalty primitive.** That's Decal's pitch. ProofPay is SAS-based portable reputation.
- **Do not over-index on the Cypherpunk philosophy slide.** Cypherpunk was the prior hackathon; Frontier judges are looking for product impact, not lectures. One Szabo pullquote in the README is plenty; the demo leads with user benefit.
- **Do not split the submission narrative between two lanes.** University is a checkbox, not a second pitch.

## Action items before May 11

- [ ] Confirm University eligibility with official Frontier rules at arena.colosseum.org.
- [ ] Lock Grand Champion as the single primary narrative (video + first paragraph of README).
- [ ] Add University flag to submission form iff eligible.
- [ ] Verify `sas-lib` version pinned in `package.json` and [README](../README.md) quickstart works on a fresh machine.
