import { test as base, request, APIRequestContext } from '@playwright/test';
import { UsersClient } from '@api/users-client';
import { PostsClient } from '@api/posts-client';
import { getBaseUrl } from '@utils/env';

interface ApiFixtures {
  apiContext: APIRequestContext;
  usersClient: UsersClient;
  postsClient: PostsClient;
}

export const test = base.extend<ApiFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the destructuring pattern to detect fixture deps
  apiContext: async ({}, use) => {
    // Untested: JSONPlaceholder ignores the Authorization header entirely, so no test
    // can currently verify this against a real 401/403. A known, accepted gap — not
    // an oversight — until BASE_URL points at an API that actually enforces auth.
    const context = await request.newContext({
      baseURL: getBaseUrl(),
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

  postsClient: async ({ apiContext }, use) => {
    await use(new PostsClient(apiContext));
  },
});

export { expect } from '@playwright/test';
