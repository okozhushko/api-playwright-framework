# api-playwright-framework

API test automation framework built on [Playwright Test](https://playwright.dev/docs/api-testing).

## Structure

```
src/
  api/          API clients (one class per resource, extends BaseApiClient)
  builders/     Fluent builders for payloads with many optional/nested fields
  factories/    Plain functions for simple, low-variance payloads
  fixtures/     Playwright test fixtures (apiContext, per-resource clients)
tests/          Test specs
```

## Setup

```bash
npm install
cp .env.example .env   # fill in BASE_URL / API_TOKEN
```

## Running tests

```bash
npm test                # run all tests
npm run test:coverage   # run all tests under c8, enforcing coverage thresholds
npm run test:report     # open the last HTML report
```

## Adding a new API resource

1. Add a client in `src/api/<resource>-client.ts` extending `BaseApiClient`.
2. Expose it as a fixture in `src/fixtures/api-fixtures.ts`.
3. Write specs in `tests/<resource>.spec.ts` using the fixture.

## CI

`.github/workflows/tests.yml` runs on every push/PR to `main`: `npm audit`, format check, lint, typecheck, then the test suite with enforced coverage thresholds, uploading the HTML report as an artifact. `main` requires this check plus one approving review before merge. `.github/workflows/nightly.yml` reruns the suite daily to catch drift in the external API independent of code changes. `.github/dependabot.yml` opens weekly update PRs for npm and GitHub Actions dependencies.
