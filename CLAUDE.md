# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                                   # install dependencies
cp .env.example .env                          # configure BASE_URL / API_TOKEN

npm test                                      # run the full suite (headless)
npm run test:headed                           # run with a visible browser context
npm run test:report                           # open the last HTML report

npx playwright test tests/users.spec.ts       # run a single spec file
npx playwright test -g "creates a new user"   # run a single test by title
npx playwright test --list                    # list tests without running them (sanity check)

npm run lint                                  # eslint
npm run format                                # prettier --write

npx tsc --noEmit                              # type-check without emitting
```

No separate build step: Playwright Test transpiles TypeScript on the fly, so specs and source under `src/` run directly.

## Architecture

This is an API-only test framework (no browser UI testing) built on `@playwright/test`'s `APIRequestContext`.

**Layering**: `src/api/base-client.ts` defines `BaseApiClient`, a thin wrapper around an injected `APIRequestContext` exposing `get/post/put/patch/delete`. Resource-specific clients (e.g. `src/api/users-client.ts`'s `UsersClient`) extend it and add typed, resource-scoped methods (`getById`, `create`, ...) that call the base HTTP verbs with the resource's path. New resources follow this same pattern: one class per resource extending `BaseApiClient`.

**Fixture wiring**: `src/fixtures/api-fixtures.ts` extends Playwright's base `test` with two custom fixtures:
- `apiContext` — creates a single `APIRequestContext` per test via `request.newContext()`, reading `BASE_URL` and `API_TOKEN` from the environment (loaded from `.env` via `dotenv` in `playwright.config.ts`), and disposes it after the test.
- `usersClient` — instantiates `UsersClient` from `apiContext`.

Specs must import `test`/`expect` from `@fixtures/api-fixtures` (not from `@playwright/test` directly) to get access to the injected clients — see `tests/users.spec.ts`.

**Adding a new resource** (the standard extension point):
1. Add `src/api/<resource>-client.ts` extending `BaseApiClient`.
2. Add a corresponding fixture in `src/fixtures/api-fixtures.ts` (instantiated from `apiContext`, same as `usersClient`).
3. Add `tests/<resource>.spec.ts`, importing `test`/`expect` from `@fixtures/api-fixtures`.

**Path aliases** (`tsconfig.json`): `@api/*` → `src/api/*`, `@utils/*` → `src/utils/*`, `@fixtures/*` → `src/fixtures/*`.

**Config** (`playwright.config.ts`): `testDir` is `./tests`; `baseURL` comes from `BASE_URL` env var; traces are retained on failure only; CI runs get 2 retries and 2 workers, local runs are unbounded/no-retry.

**CI**: `.github/workflows/tests.yml` runs `npx playwright test` on push/PR to `main` using `vars.BASE_URL` and `secrets.API_TOKEN`, then uploads the HTML report as an artifact regardless of pass/fail.
