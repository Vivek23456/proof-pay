# Demo script — 3-minute recording plan

Record once on **May 9, 2026** (not May 10). Rehearse five times first. Use OBS or Loom; 1080p; dark desktop background; Phantom extension visible in the browser.

Target length: **2:45** with ±15s buffer. Anything longer gets cut before upload.

## Pre-flight checklist (run immediately before recording)

- [ ] `anchor deploy --provider.cluster devnet` — program is live; note the signature.
- [ ] `npm run seed:devnet` — two merchants + a customer wallet; three existing attestations at Merchant A.
- [ ] Phantom has three devnet wallets: `MerchantA.json`, `MerchantB.json`, `Customer.json`. All funded with 2 SOL + ≥ 50 USDC.
- [ ] `npm run dev` in `proof-pay-app/`. Browser tab at `localhost:3000` with empty cache.
- [ ] Check `NEXT_PUBLIC_PROOFPAY_PROGRAM_ID` in `.env.local` matches the deployed program.
- [ ] Microphone level: -12 dB peak. Headphones on.
- [ ] Close Slack / Discord / Messages. Do-Not-Disturb on.
- [ ] Quit Spotify. Seriously.

## Beat-by-beat (target timestamps)

### 0:00 — Hook (15 s)
> *"Every coffee shop on Solana has its own loyalty card. What if your purchase history was yours — and every future merchant could trust it?"*

Show the landing page. Cursor on the "Your Solana purchase history is yours" headline.

### 0:15 — Setup flash (20 s)
> *"One Anchor program, Solana Attestation Service, USDC on devnet. Here's the repo."*

Cut to terminal:
```bash
git clone proofpay && cd proofpay/proof-pay && anchor build
cargo test --manifest-path tests/Cargo.toml   # 3 tests pass
```

### 0:35 — Merchant A onboards (30 s)
> *"I'm a coffee shop. Let me register."*

- Click **"I'm a merchant"** → connect `MerchantA.json` → register as **"Cafe Solana"**.
- Add one policy rule: **"After 3 attestations → 10% off"**. Save.
- Show the new `MerchantRegistry` PDA on Solana Explorer (split screen).

### 1:05 — Customer pays (30 s)
> *"I'm a customer. I've never used ProofPay before."*

- Switch Phantom to `Customer.json`.
- Navigate to `/checkout?merchant=<MerchantA-pubkey>&amount=10`.
- Note: trust score = **0**. Full price $10.00.
- Click **Pay & earn attestation** → Phantom prompt shows *one signature* = SPL transfer + attestation mint.
- Receipt slides in: attestation issued.
- Refresh: trust score = **1**.

### 1:35 — Pay twice more (20 s)
> *"Two more visits to the same coffee shop — my count climbs."*

- Two fast checkout clicks. Trust score = **3**. Third attestation receipt shows **10% off** applied (discount kicked in because `min_attestations = 3` now matches).

### 1:55 — Merchant B onboards (15 s)
> *"Now a completely different merchant — a bookstore — signs up."*

- Phantom → `MerchantB.json`. Register **"Lunch Counter"**. Policy: **"After 3 attestations → 15% off"**.

### 2:10 — The hero moment (25 s)
> *"First-ever visit to the bookstore. Watch this."*

- Switch to `Customer.json`. Navigate to `/checkout?merchant=<MerchantB-pubkey>&amount=10`.
- The trust-score card still reads **3** (from Merchant A!).
- The pay button already shows **$8.50** — the 15% discount is pre-applied, *before* the customer signs, based on attestations earned at an unrelated merchant.
- Sign. Transaction succeeds. Discount recorded in the receipt. **This is the product promise.**

### 2:35 — Narrative beat (15 s)
Cut to a slide:
> *"Decal: each merchant owns the loyalty token.*
> *ProofPay: each customer owns the reputation."*

Hold for 3 seconds. Szabo pullquote below:
> *"Formalize and secure relationships on public networks."*

### 2:50 — Wrap (10 s)
> *"Code is open, program is deployed, README has the one-command quickstart. What's next: Humanship sybil resistance, Stripe on-ramp, mainnet."*

End card: GitHub URL + Vercel URL + "Frontier 2026 submission" tag.

---

## What NOT to do

- Do not explain the PDA seed derivation. No judge cares.
- Do not show `register_merchant` account metas. Keep the camera on the UI.
- Do not mention compute units.
- Do not pitch the SDK as the primary product. The consumer loop is the product.
- Do not apologize for the scaffold state. The demo is the product.

## If something breaks on camera

- Devnet outage → switch to the `litesvm` demo harness (the third test). "Even when devnet is down, the product still works in-process."
- Phantom prompt doesn't appear → refresh once, silently. If it still fails, cut to a pre-recorded B-roll of the successful payment.
- Amount rounds wrong → quote the source of truth: `best_discount_bps(attestation_count)` in `state.rs`.

## Post-recording

- [ ] Upload to YouTube unlisted + Loom backup.
- [ ] Paste both URLs into the Arena submission form.
- [ ] Drop the YouTube link into the repo README under "Demo video".
