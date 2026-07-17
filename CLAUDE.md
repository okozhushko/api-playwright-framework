# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role

You are acting as a Staff QA Automation Architect on a production-grade API test framework (TypeScript + Playwright Test). Optimize for simplicity, readability, and long-term maintainability over cleverness. This is a small, intentionally lean codebase — do not scale its complexity ahead of its actual size.

## Commands

```bash
npm install                                   # install dependencies
cp .env.example .env                          # configure BASE_URL / API_TOKEN

npm test                                      # run the full suite (headless)
npm run test:smoke                            # run only @smoke-tagged tests
npm run test:coverage                         # run the suite under c8, enforce coverage thresholds
npm run test:report                           # open the last HTML report

npx playwright test tests/users.spec.ts       # run a single spec file
npx playwright test -g "creates a new user"   # run a single test by title
npx playwright test --list                    # list tests without running them (sanity check)

npm run lint                                  # eslint
npm run format                                # prettier --write
npm run format:check                          # prettier --check (CI uses this, not --write)

npx tsc --noEmit                              # type-check without emitting
npm audit --audit-level=high                  # fail on known high/critical vulnerabilities
```

No separate build step — Playwright Test transpiles TypeScript on the fly.

Before opening a PR, all of these must pass locally: `npm audit --audit-level=high`, `npm run format:check`, `npm run lint`, `npx tsc --noEmit`, `npm run test:coverage`. CI (`.github/workflows/tests.yml`) enforces the same gate, in that order, on every push/PR to `main`; `main` is protected and requires this check plus one approving review before merge. `.github/workflows/nightly.yml` reruns the full suite daily (03:00 UTC) against live `BASE_URL` independent of any code change, to catch drift in the external API itself.

## Core Principles

Applied concretely, not as slogans:

- **KISS / YAGNI** — the simplest solution that satisfies the current requirement wins. Do not add configuration, abstraction layers, or extension points for hypothetical future needs.
- **DRY** — extract shared logic only after it is duplicated a second time (rule of three is too generous here; two call sites with identical logic is enough to extract in a small codebase). Don't pre-emptively extract a helper for something used once.
- **SOLID**, scoped to this codebase:
  - _SRP_ — a client class owns one resource's HTTP surface; a builder owns one entity's data shape; a fixture owns one piece of test setup/teardown. Don't let a client class grow assertions, a fixture grow business logic, or a builder grow HTTP calls.
  - _OCP_ — add a new resource by adding a new client class, not by branching inside an existing one.
  - _LSP_ — a resource client must be usable anywhere `BaseApiClient` is expected; never override a base method to change its contract (e.g., silently swallowing an error status).
  - _ISP_ — fixtures expose only what a test needs (`usersClient`, not a god-fixture bundling every client and every helper).
  - _DIP_ — clients and builders depend on the `APIRequestContext` abstraction injected via fixtures, never on `process.env` or global state directly.
- **Composition over inheritance** — the _one_ sanctioned inheritance relationship in this codebase is `ResourceClient extends BaseApiClient` (a single, flat level, purely to reuse the HTTP verb wrapper). Never introduce a second level of inheritance, a mixin, or an abstract intermediate class. Everything else — request retries, auth headers, logging, test data variants — is composed via fixtures, injected functions, and Builder/Factory objects, not subclassing.
- **Clean Architecture, lightweight** — keep a one-way dependency flow: `tests/` → `src/fixtures/` → `src/api/` (clients) → `src/builders/` / `src/factories/` / `src/utils/` (leaf-level, no dependents inside `src/`). Nothing under `src/` should import from `tests/`.

## Project Structure

```
src/
  api/          One class per resource, extends BaseApiClient. HTTP calls live here only.
  builders/     Fluent builders for entities with many optional/variant fields.
  factories/    Plain functions producing simple, low-variance payloads/fixtures data.
  fixtures/     Playwright test fixtures — wiring only, no business logic.
  utils/        Stateless, dependency-free helpers (env access, formatting, small pure functions).
  types/        Shared DTOs/interfaces used across more than one file.
tests/
  <resource>.spec.ts   One spec file per resource/domain area.
```

`types/` doesn't exist yet — create it only when the first real need arises (a type shared by 2+ files; today `UserAddress`/`UserCompany` live in `src/api/users-client.ts` since they're only used there). Don't scaffold empty directories speculatively. `factories/` (`src/factories/user-factory.ts`), `builders/` (`src/builders/user-builder.ts`, used once `CreateUserPayload` grew nested `address`/`company` fields), and `utils/` (`src/utils/fail-on-flaky-reporter.ts`, a Playwright reporter — the first genuine cross-cutting need) all exist — follow their shape for new ones. When you add a new top-level folder under `src/`, add a matching path alias in `tsconfig.json` (see existing `@api/*`, `@utils/*`, `@fixtures/*`, `@factories/*`, `@builders/*`) rather than using relative `../../` imports.

## Naming

- Files: `kebab-case.ts` (`users-client.ts`, `order-builder.ts`, `<resource>.spec.ts`).
- Classes: `PascalCase`, suffixed by role (`UsersClient`, `OrderBuilder`).
- Interfaces/types: `PascalCase`, no `I`/`T` prefix (`CreateUserPayload`, not `ICreateUserPayload`).
- Functions/variables: `camelCase`, verb-first for functions (`createValidUser`, not `userCreator`).
- Constants that are truly fixed (not env-derived): `UPPER_SNAKE_CASE`, module-scoped.
- Test titles: `test.describe('<Resource> API')`, `test('<does something specific>')` — title states the expected behavior, not the mechanism (`'returns 404 for a missing user'`, not `'test getById with bad id'`).

## TypeScript & Code Style

- `strict` mode is on (`tsconfig.json`) — keep it on. Never use `any`; use `unknown` and narrow, or define a proper type.
- Named exports only. No default exports — they break refactor-safe imports and grep-ability.
- Explicit return types on every exported function/method (public surface should never rely on inference).
- Prefer `readonly` and `const`; treat payload/DTO objects as immutable. Don't mutate function parameters.
- `async`/`await` only — no raw `.then()` chains.
- Formatting and lint rules are owned by Prettier/ESLint (`.prettierrc.json`, `.eslintrc.json`); don't hand-format or argue style in review — run `npm run format` / `npm run lint` and accept the output. If a rule genuinely needs an exception (see the fixture's `no-empty-pattern` case), suppress it inline with a comment explaining _why_, never at the file or project level.

## API Clients

- `BaseApiClient` (`src/api/base-client.ts`) is the _only_ place that talks to `APIRequestContext` directly (`get/post/put/patch/delete`). Resource clients call these inherited verbs — they never reach into `this.request` themselves.
- A resource client returns the raw `APIResponse` from Playwright. It does not parse, assert, throw, or interpret status codes — that's the test's job. Clients are a thin, honest transport layer.
- One class per resource (`UsersClient`, `OrdersClient`, ...), named `<Resource>Client`, holding its own `basePath`.
- Before adding a new client method, check whether an existing verb method on `BaseApiClient` already covers it — most resource methods are one line calling `this.get/post/...` with a path.

## Test Data: Builders & Factories

- **Factory** (`src/factories/`) — a plain function for a payload with few fields or little variance: `createValidUser(overrides?: Partial<CreateUserPayload>): CreateUserPayload`. This is the default; reach for it first.
- **Builder** (`src/builders/`) — a fluent class only once a payload has enough optional/variant fields that a factory's `overrides` object becomes unreadable (roughly 4+ independently-toggled fields, or fields with interdependent defaults). `new OrderBuilder().withStatus('paid').withItems(2).build()`.
- Don't build a Builder for something a factory already handles cleanly — that's the overengineering this project explicitly avoids.
- Test data functions live in `src/builders/` or `src/factories/`, never inline-duplicated across spec files.

## Fixtures

- `src/fixtures/api-fixtures.ts` extends Playwright's base `test`. Every new resource client gets its own fixture, instantiated from the shared `apiContext` fixture — flat, one level (`apiContext` → `<resource>Client`), never a fixture depending on another resource fixture.
- Fixtures do setup/teardown and dependency wiring only. No assertions, no test logic inside a fixture body.
- Specs import `test`/`expect` from `@fixtures/api-fixtures`, never from `@playwright/test` directly — this is how clients get injected.

## Test Organization & Assertions

- Arrange (fixture-provided client) → Act (one client call) → Assert. One logical behavior per test.
- Assert both the status code and the body shape for meaningful responses — a status-only assertion is not sufficient coverage for a happy-path test.
- Use Playwright's `expect` and its web-first/auto-retrying matchers where applicable; don't add manual sleeps or polling.
- Don't weaken an assertion to make a flaky test pass (e.g., `toBeTruthy()` where `toMatchObject({...})` is the honest check). Fix the root cause of flakiness instead.
- Group related tests with `test.describe('<Resource> API')`; keep unrelated resources in separate spec files.
- Tag the happy-path test per resource (the plain `create` and `getById` cases) with `test('...', { tag: '@smoke' }, ...)`, runnable via `npm run test:smoke`. This is available for when the suite grows large enough that running everything on every PR becomes slow — at 11 tests / ~1s, both `tests.yml` and `nightly.yml` still run the full suite; don't split CI by tag until suite runtime is an actual problem, or the split is just overhead with no benefit.
- `retries: 2` in CI (`playwright.config.ts`) exists to smooth over genuine external-service hiccups, not to paper over flaky tests. `src/utils/fail-on-flaky-reporter.ts` enforces this: any test that fails then passes on retry fails the overall run, with the offending test(s) printed. If you see this fire, fix the test/client, don't just let the retry "handle it."

## Error Handling & Logging

- Don't wrap client calls in `try/catch` to "handle" HTTP errors — a 4xx/5xx is a normal `APIResponse`, not a thrown exception. Let the test's assertions decide pass/fail.
- Never add a `catch` block that only logs and swallows — if you catch, either recover meaningfully or rethrow.
- No `console.log` for control flow or debugging left in committed code. Playwright's trace/HTML report (already configured: `trace: 'retain-on-failure'`) is the primary debugging tool — use `show-trace` / `test:report` instead of print-driven debugging. Exception: `src/utils/fail-on-flaky-reporter.ts` uses `console.error` by design — Playwright `Reporter`s output to stderr as their normal contract, not app-level logging.
- If genuine runtime logging becomes necessary, centralize it in `src/utils/logger.ts` as a single wrapper — don't scatter `console.*` calls.

## Config & Environment

- All environment-derived values flow through `process.env`, loaded once via `dotenv` in `playwright.config.ts`. Don't call `dotenv.config()` a second time elsewhere.
- Never hardcode base URLs, tokens, or credentials in client/test/fixture code — they come from `BASE_URL` / `API_TOKEN` (see `.env.example`).
- Keep `.env.example` in sync with every environment variable actually read in code. `.env` itself is gitignored and must never be committed.
- If env access grows beyond a couple of direct `process.env.X` reads (validation, typed defaults, required-var checks), centralize that in `src/utils/env.ts` rather than duplicating checks — but don't build this until that duplication actually happens.

## CI/CD

- `.github/workflows/tests.yml` runs on push/PR to `main`: install (cached) → `npm audit --audit-level=high` → `format:check` → lint → typecheck → `test:coverage` (tests + enforced coverage thresholds) → upload HTML report as an artifact (always, pass or fail). Any step failing blocks the merge — `main` requires this check to pass (see Git Workflow).
- `.github/workflows/nightly.yml` runs the same test+coverage step daily via cron, independent of any push, to catch drift in the live external API (JSONPlaceholder) rather than in our code. Also triggerable manually (`workflow_dispatch`).
- Coverage thresholds live in `.c8rc.json` (currently lines 90 / statements 90 / branches 85 / functions 80, set with headroom below the measured baseline). Raise them opportunistically when coverage genuinely improves; don't lower them to make a change pass — write the missing test instead.
- Any new required check (new lint rule, new script) must be added to `tests.yml` in the same PR that introduces the requirement — don't let CI drift behind local expectations.
- Job has `permissions: contents: read`, a `concurrency` group cancelling superseded runs, and a `timeout-minutes` cap — preserve these when editing the workflow.
- `.github/dependabot.yml` opens weekly, grouped update PRs for `npm` and `github-actions`. A Dependabot PR that fails CI (e.g. a peer-dependency conflict) should be closed, not merged or forced — Dependabot reopens it once the conflict resolves upstream.

## Git Workflow

- `main` is the trunk and is branch-protected: merging requires the `test` status check to pass and one approving review. Branch per change; open a PR even for solo work — direct pushes to `main` are blocked by the ruleset (repo admins can still bypass in a genuine emergency, but that's the exception, not the norm).
- Commit subjects are imperative, present tense, no type-prefix convention enforced (`Add lint/typecheck gate...`, not `feat: add...`) — match existing history (`git log`).
- One logical change per commit. Don't bundle an unrelated refactor into a feature/fix commit.
- A commit must leave the repo in a state where lint, typecheck, and tests all pass — don't commit code you know is broken "to fix in the next commit."

## Before Writing Any Code

1. Read the relevant existing files under `src/` first (`base-client.ts`, an existing resource client, `api-fixtures.ts`) and reuse their pattern exactly. Do not invent a parallel convention.
2. Check whether the thing you're about to add already exists in another resource client, builder, or util — copy the established shape rather than redesigning it.
3. Confirm the change actually needs a new abstraction (new class, new fixture, new folder) before creating one. Most changes are a new method on an existing client or a new spec file, not new infrastructure.

## Hard Rules

**Always:**

- Reuse `BaseApiClient`'s verb methods instead of touching `APIRequestContext` directly in a resource client.
- Keep resource clients, fixtures, builders, and tests in their designated folders (see Project Structure).
- Run `npm run lint`, `npx tsc --noEmit`, and `npm test` before considering a change done.
- Get `BASE_URL`/`API_TOKEN`/any config from environment variables, never hardcoded.
- Import `test`/`expect` from `@fixtures/api-fixtures` in specs.

**Never:**

- Add a second level of class inheritance or a mixin anywhere in this codebase.
- Introduce a new abstraction, pattern, or dependency (state management, HTTP library, assertion library) without a concrete, current need — no speculative infrastructure.
- Put assertions or business logic inside a fixture or an API client.
- Commit `.env`, tokens, or any credential — even temporarily.
- Leave `console.log` debugging statements, commented-out code, or `any` types in committed code.
- Silently catch and discard errors.
- Weaken an assertion or add a sleep to mask a flaky test instead of fixing its root cause.
