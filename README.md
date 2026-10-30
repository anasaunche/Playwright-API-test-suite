# Playwright UI + API Test Suite

[![CI](https://github.com/anasaunche/Playwright-API-test-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/anasaunche/Playwright-API-test-suite/actions/workflows/ci.yml)
![Playwright](https://img.shields.io/badge/Playwright-1.64-2EAD33?logo=playwright)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)

An end-to-end test automation framework built with **Playwright + TypeScript** that covers
the **REST API**, the **web UI**, and **cross-layer (UI ↔ API)** behaviour of a realistic
e-commerce application.

## System under test

**[Practice Software Testing – "Toolshop"](https://practicesoftwaretesting.com)**,
an open-source demo web shop built for testers (Angular front end, Laravel REST API).
I picked it over toy apps because it has the things real products have:

| Feature                                 | Covered by                   |
| --------------------------------------- | ---------------------------- |
| JWT auth, user registration, lockout    | API + UI                     |
| Paginated, sortable, filterable catalog | API + UI                     |
| Full-text search                        | API + UI + consistency check |
| Server-side shopping cart               | API + UI + consistency check |
| Multi-step checkout + invoicing         | E2E                          |
| Form validation (login, contact)        | UI                           |

- Web: <https://practicesoftwaretesting.com>
- API: <https://api.practicesoftwaretesting.com> ([Swagger](https://api.practicesoftwaretesting.com/api/documentation))

## What's inside

```
.
├── .github/workflows/ci.yml   # Lint → API tests ∥ UI+E2E tests, reports as artifacts, nightly run
├── playwright.config.ts       # Projects: api · chromium · e2e
├── scripts/start-toolshop.sh  # Boots a seeded, self-hosted Toolshop with Docker Compose
├── src/
│   ├── api/
│   │   ├── ToolshopApi.ts     # Typed API client (wraps APIRequestContext)
│   │   └── schemas.ts         # Zod contract schemas for responses
│   ├── pages/                 # Page Object Model (Header, Login, Catalog, Product, Checkout, Contact)
│   ├── fixtures/index.ts      # Custom fixtures: page objects, API clients, `signedIn` option
│   ├── data/factories.ts      # Unique test-data builders (emails, passwords, customers)
│   └── config/env.ts          # Env-driven config with safe defaults
└── tests/
    ├── api/                   # Pure API tests – no browser
    ├── ui/                    # Browser tests
    └── e2e/                   # Checkout journey and UI ↔ API consistency checks
```

### Test inventory (47 tests: 26 API · 18 UI · 3 E2E)

| Suite | Spec                      | What it verifies                                                                         |
| ----- | ------------------------- | ---------------------------------------------------------------------------------------- |
| API   | `auth.api.spec.ts`        | Login returns a valid JWT, `/users/me` needs auth, unknown or forged tokens get 401      |
| API   | `products.api.spec.ts`    | Pagination contract, no overlap between pages, sort, price/category filters, search, 404 |
| API   | `cart.api.spec.ts`        | Cart lifecycle: create → add → update qty → remove → delete; quantities add up           |
| API   | `users.api.spec.ts`       | Register → log in round trip, duplicate email (409), password policy, required email     |
| UI    | `login.spec.ts`           | Sign in/out, error messages, required-field validation, signed-in account page           |
| UI    | `catalog.spec.ts`         | Product grid, search + empty state, sort by price/name, category filter                  |
| UI    | `product.spec.ts`         | Detail page matches API data, cart badge, quantity → line total                          |
| UI    | `contact.spec.ts`         | Successful submission, min-length and required-field validation                          |
| E2E   | `checkout.e2e.spec.ts`    | Signed-in purchase: cart → address → payment → invoice number                            |
| E2E   | `consistency.e2e.spec.ts` | UI search results equal API search; item added in the UI shows up in the API cart        |

## Design decisions

- **API-first test data.** UI tests don't hard-code product ids or names, which change whenever
  the demo is reseeded. They ask the API for a product that's in stock, then drive the UI
  with it. That keeps tests stable and makes the UI-vs-API checks possible.
- **Contract testing with Zod.** Every typed API call validates the response body against a
  schema. Schemas list only the fields the suite relies on and allow extra fields, so the API
  can add fields without breaking tests, but removing or retyping a field fails with a clear diff.
- **Sign in through the API, not the UI.** The real login form is tested once in
  `login.spec.ts`. Other specs set `test.use({ signedIn: true })`: a fixture gets a fresh JWT from
  the API and puts it into `localStorage` before the app boots. A saved `storageState` doesn't
  work here, because the API's tokens expire after 5 minutes and would go stale mid-run.
- **No arbitrary waits.** The catalog grid is rendered from API calls, so page objects wait for
  the matching response. The app sends its filters as the JSON body of an HTTP `QUERY`
  request, so `CatalogPage` matches on the body as well as the query string.
- **Stable locators.** The app exposes `data-test` attributes, so `testIdAttribute` is set to
  `data-test` and specs use `getByTestId()`, with role/label locators where they read better.
- **Live API, self-hosted UI.** API tests hit the public API directly. The public website sits
  behind Cloudflare bot protection, which shows a "security verification" page to headless
  browsers on CI runners. So in CI, browser tests run against a fresh, seeded instance of the
  same app (sprint 5), built from its open-source repo at a pinned commit. That also makes them
  deterministic: no shared data, nothing left over from other users.
- **Safe on a shared environment.** Every write uses unique, disposable data. Negative login
  tests use made-up emails, because wrong passwords on the shared demo account would trigger
  the app's account lockout and break everyone else's runs. Workers are capped in CI to stay
  under the demo's rate limits.
- **Tags.** `@smoke`, `@api`, `@ui` and `@e2e` let you run slices (`--grep @smoke`).

## Getting started

Requirements: Node.js 20+.

```bash
npm ci
```

```bash
npx playwright install --with-deps chromium
```

The defaults target the public demo and its published demo account, so no secrets are needed.
Copy `.env.example` to `.env` to point at another environment.

To run against your own instance (requires Docker), like CI does:

```bash
scripts/start-toolshop.sh
```

```bash
BASE_URL=http://localhost:4200 API_URL=http://localhost:8091 npm test
```

### Running tests

| Command               | Runs                                    |
| --------------------- | --------------------------------------- |
| `npm test`            | Everything                              |
| `npm run test:api`    | API tests only (no browser needed)      |
| `npm run test:ui`     | UI tests                                |
| `npm run test:e2e`    | Checkout + consistency tests            |
| `npm run test:smoke`  | Tests tagged `@smoke` across all layers |
| `npm run test:headed` | UI tests in a visible browser           |
| `npm run report`      | Open the last HTML report               |

Code quality: `npm run typecheck`, `npm run lint`, `npm run format:check`.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main`, on every pull request, **nightly**
(the demo is deployed independently, so drift gets caught even when this repo doesn't change),
and on demand:

1. **Lint & typecheck**: `tsc`, ESLint (incl. `eslint-plugin-playwright`), Prettier.
2. Then two jobs run in parallel:
   - **API tests** against the live public API.
   - **UI + E2E tests** against a Toolshop instance started in the job with Docker Compose
     (`scripts/start-toolshop.sh`). The job caches Playwright browsers per version and prints
     the app's logs if it fails.
3. HTML reports, JUnit XML, traces, screenshots and videos of failures are uploaded as
   artifacts. Failures also show up as annotations on the PR through the `github` reporter.

Manual runs (**Actions → CI → Run workflow**) accept a `grep` input such as `@smoke`.
For the API job, `BASE_URL` / `API_URL` can be overridden with repository variables.

To debug a CI failure, download the `ui-report` artifact and run
`npx playwright show-trace test-results/<test>/trace.zip`.

## License

MIT
