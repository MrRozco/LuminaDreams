# Phase 11 Release Checklist

This checklist covers the remaining non-Stripe go-live work for LucidDreamers.

## 11.1 Testing Baseline

### Commands

```bash
npm run test
npm run test:coverage
npm run verify
```

### Pass Criteria

- Unit tests pass in CI mode (`npm run test`).
- Coverage report is generated in `coverage/`.
- Lint, typecheck, and production build pass (`npm run verify`).

## 11.2 Deployment and Environment Parity

### Required environment variables in hosting platform

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `XAI_API_KEY`
- `STRIPE_SECRET_KEY` (test until live cutover)
- `STRIPE_WEBHOOK_SECRET` (test until live cutover)
- `STRIPE_PRICE_ESSENTIAL_MONTHLY`
- `STRIPE_PRICE_ESSENTIAL_YEARLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `TURNSTILE_ENFORCE`
- `NEXT_PUBLIC_TURNSTILE_ENFORCE`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `DISPOSABLE_EMAIL_BLOCKLIST`

### Parity checks

- `NEXT_PUBLIC_APP_URL` matches the deployed domain exactly.
- Supabase redirect URLs include production auth callback URL.
- Stripe webhook endpoint URL matches `/api/stripe/webhook` in deployed app.
- Storage buckets exist and remain private where expected.

## 11.3 Production Smoke Test Script

Run this sequence immediately after deploy:

1. Load landing page and verify no console/runtime error.
2. Open `/privacy` and `/terms` and verify render.
3. Sign up a fresh test user and complete email verification.
4. Log a dream and confirm it appears in Journal/Library.
5. Trigger dream interpretation and verify DB row update.
6. Generate image and verify it appears in Creations.
7. (Optional if enabled) Generate video and verify playback.
8. Visit Insights flow with enough data and verify generation path.
9. Confirm protected routes redirect behavior when signed out.
10. Confirm webhook endpoint returns `200` for valid Stripe test events.

## 11.4 Final Sign-off Gate

Mark each item before release announcement:

- [ ] `npm run verify` passed on release commit.
- [ ] `npm run test` passed on release commit.
- [ ] Smoke test sequence completed successfully.
- [ ] Error logs reviewed for first production session.
- [ ] Backout plan documented (previous deploy/version known).
- [ ] Live Stripe cutover explicitly deferred or completed.

## Live Stripe Deferred State

If you intentionally ship before live billing:

- Keep Stripe in test mode.
- Hide or communicate billing as pre-launch/testing.
- Schedule a separate live cutover window with rollback plan.
