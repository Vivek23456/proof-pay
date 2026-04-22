# Team skills map — ProofPay solo build

**Team shape:** one solo builder, roughly 30 h/week through 2026-05-11. This map is the honest replacement for the prior "worked example" placeholder.

## Time commitment (through 2026-05-11)

| Person / role | Hours / week | Notes |
|---------------|--------------|-------|
| Solo builder | ~30 h/wk | Confirm real availability at Phase 0 exit. If it drops below 20, trim Phase 2 to one route only. |

**Total:** ~60 hours across the three remaining weeks (Apr 22 – May 11), plus two buffer days.

## Skill inventory

Fill in honestly. Skip any row where you haven't shipped production work — that's where the mitigations column matters.

| Area | Level (1–5) | Evidence / notes |
|------|-------------|------------------|
| Anchor / Solana programs | _fill_ | Target level ≥ 3 for solo. If lower, pair with a mentor on the `pay_and_attest` instruction specifically. |
| Rust (non-Anchor) | _fill_ | Only relevant if the SAS fallback path triggers. |
| TypeScript / React | _fill_ | Target level ≥ 3. Next.js App Router assumed. |
| Mobile (iOS/Android/RN) | N/A | Web-responsive only for MVP. |
| Backend / APIs | _fill_ | Not needed — no custom server. Vercel + RPC only. |
| DevOps / CI / hosting | _fill_ | Vercel + GitHub Actions skeleton on Apr 25. |
| Security / audits mindset | _fill_ | Read the `solana-dev` skill's security checklist before `pay_and_attest` lands. |
| Product / UX design | _fill_ | Single biggest solo risk. Mitigation: shadcn/ui + copy-first UI. |
| Video / narrative | _fill_ | Record demo May 9 (not May 10). Use Loom or OBS; don't overthink it. |

## Gaps and mitigations (solo reality)

| Gap | Mitigation |
|-----|------------|
| No second set of eyes on the Anchor program | LiteSVM happy-path and reject-path tests before devnet deploy. Post the program on Superteam Discord for a free review if possible. |
| No dedicated UX designer | Use shadcn/ui templates verbatim. Copy is the only place to invest — rewrite merchant and customer flows three times. |
| No dedicated PM — scope drift risk | Hard rule: anything not in [mvp-spec.md](./mvp-spec.md) goes into `docs/v2.md`. Close `mvp-spec.md` on May 1. |
| No dedicated videographer | Rehearse the 8-beat demo script in [mvp-spec.md](./mvp-spec.md) at least five times before recording. Record May 9. |
| Burnout risk | Daily hard stop at a working commit. No all-nighters — the demo recording on May 9 needs a rested brain more than the code needs an extra feature. |
| Single point of failure for SAS integration | Fallback internal `Attestation` PDA documented in [mvp-spec.md](./mvp-spec.md). Switch decision must be made by Apr 28 at the latest. |

## Implication for scope

A solo builder at ~30 h/wk can ship a **one-Anchor-program + two-route Next.js app + seeded devnet demo + three-minute video** in 20 days, if and only if:

1. Scope is frozen on Apr 24.
2. Docs are not re-opened after May 1.
3. No feature is added after May 5.
4. Demo is recorded on May 9, not May 10.

If any of those four break, the project misses the May 11 deadline. That's the real constraint, not technical difficulty.

## Checkpoint

- [ ] Real weekly hours confirmed (not the placeholder 30).
- [ ] Skill level column filled honestly for at least Anchor + React + UX rows.
- [ ] Gaps reviewed; `pay_and_attest` SAS CPI decision route confirmed (SAS primary, internal fallback as plan B).
- [ ] Daily hard-stop rule committed to in writing before Apr 25.
