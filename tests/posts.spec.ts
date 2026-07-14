import { test, expect } from '@fixtures/api-fixtures';
import { createValidPost } from '@factories/post-factory';

test.describe('Posts API', () => {
  test('creates a new post', async ({ postsClient }) => {
    const payload = createValidPost();
    const response = await postsClient.create(payload);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ ...payload } as Record<string, unknown>);
  });

  test('fetches a post by id', async ({ postsClient }) => {
    const response = await postsClient.getById(1);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('id', 1);
  });

  test('returns 404 for a missing post', async ({ postsClient }) => {
    const response = await postsClient.getById(999999);

    expect(response.status()).toBe(404);
  });

  test('lists posts filtered by userId', async ({ postsClient }) => {
    const response = await postsClient.list({ userId: 1 });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(10);
    expect(body[0]).toHaveProperty('userId', 1);
  });

  test('deletes a post by id', async ({ postsClient }) => {
    const response = await postsClient.deleteById(1);

    expect(response.status()).toBe(200);
  });
});
