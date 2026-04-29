# Grub — Test Strategy (Non-Technical Summary)

**Audience:** Product, Engineering Leadership, Stakeholders
**Last updated:** 2026

---

## What This Document Covers

This is a plain-English summary of how we test the Grub ordering system, what we are confident about, what we are not, and what we need before we can ship to real customers.

---

## What We Are Testing

We test the system at four levels, each catching a different type of problem.

| Level | What it checks | How fast |
|---|---|---|
| Unit tests | Maths and rules — price calculations, tax, delivery fee, payment validation | ~3 seconds |
| Integration tests | Our API endpoints respond correctly to valid and invalid requests | ~5 seconds |
| API tests | The full HTTP layer — routing, error codes, response shapes | ~30 seconds |
| Browser tests | Real user journeys in Chrome, Firefox, and mobile Chrome | ~5 minutes |

**Total automated test count: 100+ tests across all levels.**

The browser tests cover the complete customer journey end to end:

- Browsing the menu and filtering by category
- Adding items to the cart and seeing correct prices
- Applying the free delivery threshold (orders over £30)
- Filling in delivery details and payment information
- Completing a successful order and receiving a confirmation
- Handling payment failures gracefully (declined card, insufficient funds)
- Retrying after a failed payment

---

## What We Are Confident About

- **Pricing is correct.** Every calculation — subtotal, 5% GST, ₹40 delivery fee, free delivery over ₹500 — is tested with exact values at the unit level and verified again in the browser.
- **Payment failures are handled safely.** A declined or invalid card never advances the customer to a confirmation screen. The error is shown and the customer can retry.
- **The menu is accurate.** All 13 items are tested individually — if a price or name changes in the code without the test being updated, the test fails immediately.
- **Form validation works.** Missing name, invalid email, missing address, short card number, wrong expiry format — all are caught before the order is submitted.
- **The order flow is stable across browsers.** Tests run in Chrome, Firefox, and mobile Chrome on every code change.

---

## What We Are Not Testing Yet

| Gap | Risk if not addressed |
|---|---|
| Visual appearance | A layout change could make the site unusable on mobile without any test failing |
| Performance under load | We don't know how the system behaves with 100 simultaneous orders |
| Real payment processing | The current payment system is a simulation — no real money moves |
| Order persistence | If the server restarts, all orders are lost |
| Email confirmations | Customers receive no email record of their order |
| Contract Testing | Catches UI/API disagreement bugs that other layers miss. Critical as teams grow. |

---

## Risks

| Risk | Likelihood | Impact | Status |
|---|---|---|---|
| Server restart loses all orders | High in production | High | Known — needs a database before go-live |
| No rate limiting on payment endpoint | Medium | Medium | Known — could be abused to probe card numbers |
| No CSRF protection | Medium | Medium | Known — needs middleware before go-live |
| Static menu — availability not live | Low | Low | Acceptable for demo, needs API in production |

---

## What We Need Before Shipping to Real Customers

These are hard blockers — the system should not take real orders without them:

1. **A real database** — orders must survive server restarts
2. **A real payment gateway** (e.g. Stripe/RazorPay) — the current processor is a simulation
3. **Rate limiting** on the payment endpoint
4. **Email order confirmations** — customers need a receipt
5. **HTTPS** — all traffic must be encrypted

These are strong recommendations but not hard blockers for a limited beta:

6. Visual regression tests — catch layout breakages automatically
7. Load testing — establish a performance baseline before marketing spend drives traffic
8. Error tracking (e.g. Sentry) — know when things break in production before customers report it

---

## How to Read the Test Results

After every code change, the CI pipeline runs all tests automatically and produces an Allure report. The report is published to GitHub Pages and shows:

- Which tests passed and failed
- A breakdown by suite (unit, integration, E2E, critical path)
- Screenshots and video recordings for any browser test that failed
- A full trace of every failed test so engineers can replay exactly what happened

**Green pipeline = safe to deploy. Any red = do not deploy until fixed.**

The critical path suite (13 tests tagged "blocker" or "critical") is the minimum bar. If any of those fail, the build is blocked regardless of everything else passing.
