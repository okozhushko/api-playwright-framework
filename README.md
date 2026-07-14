# api-playwright-framework

API test automation framework built on [Playwright Test](https://playwright.dev/docs/api-testing).

## Structure

```
src/
  api/          API clients (one class per resource, extends BaseApiClient)
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
npm run test:report     # open the last HTML report
```

## Adding a new API resource

1. Add a client in `src/api/<resource>-client.ts` extending `BaseApiClient`.
2. Expose it as a fixture in `src/fixtures/api-fixtures.ts`.
3. Write specs in `tests/<resource>.spec.ts` using the fixture.

## CI

`.github/workflows/tests.yml` runs the suite on every push/PR to `main` and uploads the HTML report as an artifact.
