# 🍔 Grub — A Takeaway SaaS application

> **Quality Engineering Leadership Assessment**
> Built by **Haripriya Muthukrishnan** - Quality Engineering Leader focused on building reliable, testable systems and high-signal automation.

This repository contains a simple takeaway ordering SaaS built to demonstrate my approach to engineering quality into the system, not just testing it after development. The application is intentionally minimal; the focus is on how the architecture enables fast feedback, layered confidence, and actionable failures across unit, integration, API, accessibility, and E2E test layers.

For the quickest review, please read the [Test Strategy](#test-strategy), [Key Decisions](#key-decisions), and [What Is Missing](#what-is-missing-and-why-it-is-not-here) sections. 

---

## What This System Does

A customer can browse a menu, add items to a cart, check out with delivery details and a payment card, and receive an order confirmation with a unique order ID and transaction reference.

| Feature | Detail |
|---|---|
| Menu | 17 items across 4 categories — starters, mains, desserts, drinks — with category filtering and sold-out states |
| Cart | Add, remove, quantity controls, live subtotal, 5% GST, ₹40 delivery fee, free delivery over ₹500 |
| Checkout | Delivery details + mock payment with deterministic test-card scenarios |
| Confirmation | Unique `ORD-` order ID, `TXN-` transaction ID, delivery address, total paid |


## Technology Stack

**Application Framework:**
- **Next.js 14.2.3** — React-based full-stack framework
- **React 18.3.0** — UI library
- **TypeScript** — Type-safe JavaScript

**Testing Frameworks & Tools:**
- **Jest 29.7.0** — Unit & Integration tests
- **Playwright 1.44.0** — E2E browser automation (Chrome, Firefox, Safari, Mobile)
- **Supertest 7.2.0** — HTTP API testing
- **Allure Reports** — Test reporting and analytics
- **axe-core 4.11.2** — Accessibility (WCAG 2.1 AA) testing
- **Pino 10.3.1** — Structured logging

**CI/CD:**
- **GitHub Actions** — Pipeline automation
- **Node 20** — Runtime environment

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Single-page app: menu → cart → checkout → confirmation
│   └── api/
│       ├── menu/route.ts     # GET  /api/menu?category=&available=
│       ├── orders/route.ts   # POST /api/orders  |  GET /api/orders
│       └── payment/route.ts  # POST /api/payment
├── lib/
│   ├── menu-data.ts          # Static menu catalogue + pricing constants
│   ├── order-utils.ts        # Pure business logic: calculations, validation, mock payment
│   └── logger.ts             # Pino structured logger with domain child loggers
└── types/
    └── index.ts              # Shared TypeScript interfaces

test-config/
├── test.config.ts            # Centralized test configuration (baseUrl, timeouts, test data)
└── .env.test                 # Test environment variables

tests/
├── unit/                     # Pure function tests (Jest, no DOM, no network)
├── integration/              # API handler tests (Jest, handlers imported directly)
├── api/                      # HTTP-level tests (Supertest, live server)
├── e2e/
│   ├── app.spec.ts           # Full behavioural suite (Playwright)
│   ├── critical-ui.spec.ts   # 13 highest-risk journeys, data-driven, severity-tagged
│   ├── regression.spec.ts    # Edge cases, boundary conditions, known risk areas
│   ├── accessibility.spec.ts # WCAG 2.1 AA compliance tests (axe-core)
├── pages/                    # Playwright Page Object Model (POM)
│   ├── base.page.ts          # Base page with common methods
│   ├── menu.page.ts          # Menu page interactions
│   ├── cart.page.ts          # Cart page interactions
│   ├── checkout.page.ts      # Checkout page interactions
│   ├── confirmation.page.ts  # Confirmation page interactions
│   └── index.ts              # Exports all page objects
├── fixtures/                 # Test utilities and factories
│   └── driver.factory.ts     # Browser driver factory
└── TEST_FRAMEWORK.md         # Framework documentation and patterns

docs/
└── test-strategy.md          # Non-technical test strategy for stakeholders

.github/workflows/
└── ci.yml                    # CI/CD pipeline: deploy, then test

.env.test                     # Test environment variables

jest.config.js               # Jest configuration (unit + integration)
playwright.config.ts         # Playwright configuration (E2E tests)
tsconfig.json                # TypeScript configuration
package.json                 # Dependencies and test scripts
```

---
**Test cards:**

| Number | Outcome |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined by issuer |
| `4000 0000 0000 9995` | Insufficient funds |
| Any past expiry date | Card expired |

---

## Commandline References

### Commands to deploy/start the application

```bash
npm install
npm run dev        # Start app at http://localhost:3000
```

### Commands for Running Tests


```bash
npm run test:unit          # 47 unit tests — pure functions, ~3s
npm run test:integration   # 15 integration tests — API handlers, ~5s
npm test                   # Unit + integration together

npm run test:e2e           # Full Playwright suite — all browsers
npm run test:e2e:smoke     # Critical path only (@smoke)
npm run test:e2e:a11y      # Accessibility tests (WCAG 2.1 AA)
npm run test:e2e:ui        # Playwright UI mode for local debugging

npm run test:all           # Local equivalent to full pipeline
```

### Test Reporting
#### Allure reporting (requires `npm install -g allure-commandline`)
```bash
# Install Allure CLI (one-time)
npm install -g allure-commandline

# Generate report from pipeline results
npm run allure:generate      # Build from allure-results/

npm run allure:open          # Open report in default browser
npm run allure:serve         # Serve report with live updates
```

**Set `PAYMENT_DELAY_MS=0` in your test environment** to eliminate the simulated 800ms payment processing delay from API and integration test runs.


---

Application has been developed keeping in mind: **what would make this system easy to test at every layer?**

### Design for Testability

**Pure business logic** — All calculations, validation, and payment logic live in `order-utils.ts` as pure functions. Zero framework dependencies. Tests run in milliseconds with no setup.

**Thin API handlers** — Each route does three things: parse request, validate, call business logic. Handlers are plain async functions that can be imported and tested directly without a server.

**Stable test selectors** — Every interactive element has a `data-testid`. Tests never break from CSS changes or layout shifts.

**Deterministic payment mocking** — Specific card numbers trigger specific outcomes (like Stripe test mode). Same cards work across all test layers.

**Injected dependencies** — `isCardExpired` accepts a `now` parameter for deterministic testing. `PAYMENT_DELAY_MS` environment variable eliminates artificial waits in tests.

**Structured logging from day one** — Pino with domain-scoped child loggers. Environment-aware: pretty-print in dev, JSON in prod, warn-level in test.

---

## Test Strategy

The suite is built in four layers. Each layer has a different cost, speed, and confidence trade-off. The key principle is that **every layer catches something the others cannot**.

```
              ┌──────────────────────────────────────────┐
              │  E2E — Playwright                         │
              │  Real browsers: Chrome, Firefox, Mobile   │  ~5 min
              │  app.spec.ts / critical-ui / regression / |
              │  accessibility                            |
              ├──────────────────────────────────────────┤
              │  API Tests — Supertest                    │
              │  Full HTTP stack, live server             │  ~30s
              ├──────────────────────────────────────────┤
              │  Integration Tests — Jest                 │
              │  Handlers imported directly, no server   │  ~5s
              ├──────────────────────────────────────────┤
              │  Unit Tests — Jest                        │
              │  Pure functions, zero dependencies       │  ~3s
              └──────────────────────────────────────────┘
```
### Layer 1 — Unit Tests (`tests/unit/`)

**47 tests.** Pure functions in complete isolation. No DOM, no network, no framework.

| File | What it covers |
|---|---|
| `order-utils.test.ts` | `calculateSubtotal`, `calculateTax`, `calculateDeliveryFee`, `calculateTotal`, `calculateOrderTotals`, `validateCart`, `validateCartItem`, `validatePayment`, `isCardExpired` (with pinned clock, 5 boundary cases), `mockProcessPayment`, `createOrder` |
| `menu-data.test.ts` | Menu integrity: no duplicate IDs, all 4 categories present, all prices > 0, constants in valid ranges |

These are the first gate in CI. If they fail, nothing else runs.

### Layer 2 — Integration Tests (`tests/integration/`)

**15 tests.** API route handlers imported and called directly — no server, no network, full request-to-response coverage.

This layer catches validation logic errors, wrong HTTP status codes, and malformed response shapes. It runs at unit-test speed because there is no server startup cost.

### Layer 3 — API Tests (`tests/api/`)

**17 tests** via Supertest against a real running Next.js server. This layer catches what handler-import tests cannot: routing configuration, middleware execution, HTTP serialisation, and response headers.

### Layer 4 — E2E Tests (`tests/e2e/`)

Four files with distinct, non-overlapping purposes:

**`app.spec.ts`** — full behavioural coverage of every user-facing feature across the complete flow.

**`critical-ui.spec.ts`** — **25 tests** (13 unique + 13 data-driven menu item tests) on the highest-risk journeys, each with an explicit severity level (`blocker` or `critical`) and Allure annotations. Critically, CUI-02 is **data-driven**: each of the 13 menu items gets its own independent test. 

**`regression.spec.ts`** — **12 tests** covering edge cases and boundary conditions: category filter reset, decrement-to-zero removes item, cart line total updates on increment, free delivery boundary (just below ₹500), empty cart state after removing all items, back-from-checkout preserves cart, all three delivery errors fire simultaneously, invalid email format, insufficient funds error message, decline-then-retry success, multi-category subtotal accuracy, Order Again session reset.

**`accessibility.spec.ts`** — **10 tests** verifying WCAG 2.1 AA compliance using axe-core: no accessibility violations on all pages (menu, cart, checkout, confirmation), keyboard navigation functionality, color contrast standards, image alt text, form label associations, heading hierarchy, and accessible names for interactive elements.

All E2E tests run across **Chromium, Firefox, and mobile Chrome** in CI.

---

## Observability

### Structured Logging — Pino

Every API route is instrumented with [Pino](https://getpino.io). Named child loggers add a `module` field to every log line for filtering in any log aggregation platform.

| Environment | Level | Format |
|---|---|---|
| `development` | `debug` | Pretty-printed, colourised |
| `production` | `info` | Structured JSON |
| `test` | `warn` | Structured JSON — no noise in test output |

Every route logs: request received (debug), validation failures (warn), payment declines (warn), unhandled exceptions (error), successful outcomes (info).

### Test Reporting — Allure

All five test layers feed into a unified Allure report:

- Jest results → `allure-results/jest/`
- Playwright results → `allure-results/e2e/`

In CI, results from all jobs are merged and a single report is generated and **published to GitHub Pages** on every push to `main`.

Playwright captures on every CI failure:
- Full trace zip (`trace: 'on-first-retry'`)
- Screenshot (`screenshot: 'only-on-failure'`)
- Video (`video: 'retain-on-failure'`)

---

## CI/CD Pipeline

### CI/CD Pipeline Overview(GitHub Actions)

The pipeline (`ci.yml`) ensures the app is **deployed first**, then all tests run:

1. **Unit & Integration Tests** → Run on code checkout
2. **Build Artifact** → Build production bundle
3. **Deploy App** → Start server (both for API tests and E2E)
4. **Run All Tests** → Only after deployment succeeds
   - API tests against deployed server
   - E2E tests (Chrome, Firefox, Mobile)
   - Accessibility Tests
5. **Generate Reports** → Allure unified report
6. **Publish to GitHub Pages** → On main branch only

```
Push / PR
    │
    ├── unit-and-integration ──────── Fast gate. Blocks everything if red.
    │   Jest, coverage upload,         Runs in ~10s.
    │   Allure results upload
    │
    ├── quality ───────────────────── TypeScript + lint.
    │   tsc --noEmit                   Non-blocking lint.
    │   eslint
    │
    ├── api-tests ─────────────────── Needs: unit-and-integration.
    │   Build → start server           
    │   wait-on → supertest            PAYMENT_DELAY_MS=0 for speed.
    │
    ├── e2e [chromium] ─┐
    ├── e2e [firefox]   ├──────────── Needs: unit-and-integration.
    ├── e2e [mobile]   ─┘             Runs sequentially in CI for deterministic stability. Retries: 2 in CI.
    ├── accessibility 
    │   Playwright report +            Trace/screenshot/video on failure.
    │   Allure results uploaded
    │
    ├── allure-report ─────────────── Needs: unit-and-integration, e2e.
    │   Merges all results             Runs always (if: always()).
    │   Publishes to GitHub Pages      Main branch only.
    │
    └── build ─────────────────────── Needs: unit-and-integration, quality.
        npm run build                  Production Next.js build.
        .next/ uploaded as artefact
```

The pipeline is ordered by speed and risk. Fast, cheap tests gate slow, expensive ones. Nothing reaches E2E if unit tests are red. The Allure report always runs — even on failure — so there is always a report to read.

---

## Key Decisions

| Decision | Why It Matters |
|---|---|
| **Pure functions for business logic** | `order-utils.ts` has zero framework dependencies. Unit-testable in milliseconds with no setup. |
| **Thin API handlers** | Plain async functions. Import directly in tests without a server. Full coverage at unit-test speed. |
| **`data-testid` on all UI elements** | Tests never break from CSS or layout changes. Stable selectors by design. |
| **Deterministic payment mocking** | Card numbers trigger specific outcomes. No `jest.mock()`. Same cards work across all test layers. |
| **Injected clock in `isCardExpired`** | No hidden dependency on system time. Tests pin a fixed date for precise boundary testing. |
| **Injectable `PAYMENT_DELAY_MS`** | Set to `0` in tests to eliminate 800ms artificial wait. No code changes needed. |
| **Event-driven triggers** | **The current pipeline is event-triggered.** PR opens → smoke tests run; merge to `main` → full regression; deploy to staging → API tests |
| **Data-driven critical tests** | Each menu item gets its own test. Failures are immediately identifiable, not cryptic. |
| **Structured logging from day one** | Domain-scoped child loggers. Environment-aware levels. Production-ready JSON output. |
| **Page Object Model (POM) design pattern** | POM is implemented for all Playwright tests to improve readability, maintainability, and reusability. Each page (Menu, Cart, Checkout, Confirmation) is a class with methods like `addItemToCart()`, `proceedToCheckout()`, `fillDeliveryDetails()`. |
| **Locators and actions are encapsulated** | Single Source of truth - any UI change requires updating one place instead of 20 test files. |


---

## What Is Missing and Why It Is Not Here

I believe in being honest about gaps. These are the things I would add before this went to production, and the reason each one is not in this submission.

### Parallel Execution
Playwright E2E tests are configured to run with reduced parallelism in CI for deterministic stability and to avoid shared-state interference. In a real environment, tests can be parallelized once isolated test data and environment reset hooks are introduced.

### Contract Testing Gaps
Contract testing using **Pact** was explored as part of this assessment. However, since the current application is a single-repo monolith without a separately versioned consumer/provider API boundary, **Pact** is not enforced in this submission. In a real production SaaS setup with independently deployed services, **Pact** would be introduced as part of the CI/CD pipeline

### Security Testing Gaps

**SAST (Static Application Security Testing).**
No static code analysis for security vulnerabilities (SQL injection, XSS, hardcoded secrets, insecure dependencies). In production I would integrate **Snyk** or **SonarQube** into the CI pipeline to scan every commit. Not included because it requires external service configuration and is out of scope for a demo project focused on test strategy.

**DAST (Dynamic Application Security Testing).**
No runtime security scanning against a deployed instance. In production I would use **OWASP ZAP** or **Burp Suite** to scan for vulnerabilities like CSRF, insecure headers, and authentication bypasses. Not included because DAST requires a deployed environment and adds 10-15 minutes to the pipeline — inappropriate for a demo.

### Performance and Resiliency Testing Gaps

**Performance testing.**
No load tests, stress tests, or performance baselines exist for the API routes. In production I would use **JMeter** or **OctoPerf** to establish response time SLAs (e.g. p95 < 200ms for `/api/menu`, p99 < 1s for `/api/payment`) and run these tests in parallel with E2E tests in CI to catch performance regressions early. Not included because meaningful performance tests require a production-like environment with realistic data volumes and network conditions.

**Resiliency testing (chaos engineering).**
No tests for how the system behaves under failure conditions: database connection loss, payment gateway timeout, network partition, memory exhaustion. In production I would use **Chaos Mesh** or **Gremlin** to inject faults and verify graceful degradation. Not included because resiliency testing requires infrastructure (Kubernetes, service mesh) that does not exist in this demo.

### Observability Gaps

**Distributed tracing — Jaeger + OpenTelemetry.**
No request tracing across the UI → API → payment processor flow. In production I would instrument the application with **OpenTelemetry** and export traces to **Jaeger** to visualise latency bottlenecks and dependency failures. The `apiLogger` calls would include trace IDs and span IDs for correlation. Not included because distributed tracing requires a collector, storage backend, and UI — infrastructure overhead inappropriate for a demo.

**AI-powered test analysis — ReportPortal.**
Allure provides static HTML reports. In production I would integrate **ReportPortal** to get ML-based failure categorisation (product bug vs flaky test vs environment issue), historical trend analysis, and auto-triaging of known failures. ReportPortal learns from past runs and surfaces actionable insights that Allure cannot. Not included because ReportPortal requires a PostgreSQL database, RabbitMQ, and Elasticsearch — a non-trivial deployment.

### Application Feature Gaps

**React component tests (RTL).**
The UI layer has no unit/component coverage. E2E tests cover it behaviourally, but component tests catch regressions faster and cheaper. Not included because the brief asked for breadth of test strategy, not depth of UI coverage.

**Visual regression tests.**
Layout and styling changes are invisible to the current suite. Not included because it requires a baseline image store and a visual diffing service (Percy or Playwright screenshots) — infrastructure decision out of scope.

**Real database and authentication.**
The in-memory order store loses all data on server restart. Not included because the brief was about testing, not application completeness. The architecture is designed so that swapping the in-memory store for a real database requires changing exactly one file and zero tests.

**Real payment gateway.**
The mock processor is for demonstration only. In production this would be Stripe with webhook handling, idempotency keys, and PCI-compliant card tokenisation.

**AI-powered customer assistant bot.**
No conversational UI to guide customers through the ordering flow. In production I would add a chatbot (powered by Amazon Lex or Dialogflow) on the homepage that:
- Explains the app and navigation ("Click 'Starters' to see appetizers")
- Highlights current promotions and discounts ("20% off pizzas today!")
- Surfaces new menu items ("Try our new Vegan Burger")
- Recommends popular choices based on order history ("Most customers pair the Burger with Lemonade")
- Answers FAQs ("Free delivery on orders over ₹500")

This would improve conversion rates and reduce support tickets. Not included because conversational AI requires intent training data, NLU model tuning, and integration with a backend knowledge base — significant scope beyond a test strategy demo.

---

## Non-Technical Test Strategy

A one-page plain-English summary of what is tested, what is not, the risks, and what is needed before shipping to real customers is available at [`docs/test-strategy.md`](docs/test-strategy.md).

This document is written for product managers, engineering leadership, and stakeholders who need to make go/no-go decisions without reading code.

---

## Repository Structure and Production-Grade Improvements

**For this assessment, all test code and application code reside in a single repository.** In an ideal production scenario, I would structure this differently:

- **Dev code + unit tests + integration tests** → one repository (owned by the product engineering team)
- **API tests + E2E tests + regression suite** → separate test framework repository (owned by the QE team)
- **Both repositories feed into a single unified CI/CD pipeline** with shared Allure reporting and quality gates

This separation keeps the product team's repository fast and focused while giving the QE team full ownership of the broader test infrastructure without coupling deployment cycles.

### CI/CD Improvements 

- **Nightly regression runs** with full E2E coverage across all browsers and devices
- **Parallel ephemeral test execution**: spin up isolated test agents (Docker containers or Kubernetes pods) for each test suite, run in parallel, tear down on completion — reducing total execution time from 15+ minutes to under 5 minutes

---

## Team Rollout Strategy

### Start with Business Logic, Not E2E

Most teams start with E2E tests because they look like the real thing. However, E2E tests are slow, flaky, and give no signal about where something broke.

**Week 1-2: Unit tests on business logic**
- Pair with engineers on `order-utils.ts` functions they already own
- Tests run in milliseconds, never flake, tight feedback loop
- Goal: change the habit, not hit coverage targets
- Once engineers see unit tests catch real bugs, they ask for more

**Week 3-6: Make quality a team property**
- PR templates with testing checklist
- Definition of done requires tests for new behaviour
- Shared Allure dashboard everyone can read (including leadership)
- Monthly 30-min test review: identify gaps, pick one to close

**Week 7+: Add layers incrementally**
- Integration tests → api tests → regression suite
- Follow Test Pyramid Structure: unit tests build confidence, integration tests clarify boundaries, E2E becomes safety net
- Don't introduce Pact to a team that's never written a unit test

---

## AI Use

Amazon Q was used this project as a reviewer and gap-finder:

- Identifying the truncated E2E spec, absent logging, and no API test layer
- Generating edge cases for payment validation, cart quantity limits, and delivery threshold boundary conditions
- Reviewing test structure and identifying missing suites (payment failures, accessibility, critical path separation)
- Shaping the Playwright helper abstractions to reduce duplication
- Reviewing Pact interaction design and matcher selection
- Suggesting the addition of SAST/DAST, resiliency testing, distributed tracing, ReportPortal, and the AI customer assistant bot as production-grade improvements

AI accelerates the gap-finding and scaffolding work. It does not replace judgement about what risks matter, how to sequence a test strategy, or how to build a quality culture in a team. Those are leadership decisions.
