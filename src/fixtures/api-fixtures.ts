import { test as base, request, APIRequestContext } from '@playwright/test';
import { UsersClient } from '@api/users-client';

interface ApiFixtures {
  apiContext: APIRequestContext;
  usersClient: UsersClient;
}

export const test = base.extend<ApiFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the destructuring pattern to detect fixture deps
  apiContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: process.env.BASE_URL ?? 'https://api.example.com',
      extraHTTPHeaders: {
        Authorization: process.env.API_TOKEN ? `Bearer ${process.env.API_TOKEN}` : '',
      },
    });
    await use(context);
    await context.dispose();
  },

  usersClient: async ({ apiContext }, use) => {
    await use(new UsersClient(apiContext));
  },
});

export { expect } from '@playwright/test';
