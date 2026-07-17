import { test, expect } from '@fixtures/api-fixtures';
import { createValidPost } from '@factories/post-factory';
import { CreatePostPayload } from '@api/posts-client';

// NOTE: JSONPlaceholder (the test backend) doesn't persist mutations, so tests using fixed resource IDs
// (e.g., id=1) are safe to run in parallel. Each worker gets an independent, stateless mock response.
test.describe('Posts API', () => {
  test('creates a new post', { tag: '@smoke' }, async ({ postsClient }) => {
    const payload = createValidPost();
    const response = await postsClient.create(payload);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ ...payload } as Record<string, unknown>);
  });

  test('round-trips unicode and special characters in the payload', async ({ postsClient }) => {
    const payload = createValidPost({ title: 'Тарас <script>alert(1)</script> 🚀' });
    const response = await postsClient.create(payload);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.title).toBe(payload.title);
  });

  test('creates a post from a minimal payload without required-field validation', async ({
    postsClient,
  }) => {
    // Deliberately violates CreatePostPayload's required fields to pin
    // actual JSONPlaceholder behavior: it does not validate required
    // fields — an empty payload still succeeds. Document this instead of
    // assuming a real API would behave the same way.
    const response = await postsClient.create({} as CreatePostPayload);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });

  test('fetches a post by id', { tag: '@smoke' }, async ({ postsClient }) => {
    const response = await postsClient.getById(1);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('id', 1);
  });

  test('returns 404 for a missing post', async ({ postsClient }) => {
    const response = await postsClient.getById(999999);

    expect(response.status()).toBe(404);
  });

  test('returns 404 for a non-numeric id', async ({ postsClient }) => {
    const response = await postsClient.getById('abc');

    expect(response.status()).toBe(404);
  });

  test('returns 404 for id zero', async ({ postsClient }) => {
    const response = await postsClient.getById(0);

    expect(response.status()).toBe(404);
  });

  test('returns 404 for a negative id', async ({ postsClient }) => {
    const response = await postsClient.getById(-1);

    expect(response.status()).toBe(404);
  });

  test('lists posts filtered by userId', async ({ postsClient }) => {
    const response = await postsClient.list({ userId: 1 });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(10);
    expect(body[0]).toHaveProperty('userId', 1);
  });

  test('returns an empty array when filtering by a non-existent userId', async ({
    postsClient,
  }) => {
    const response = await postsClient.list({ userId: 999999 });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  test('deletes a post by id', async ({ postsClient }) => {
    const response = await postsClient.deleteById(1);

    expect(response.status()).toBe(200);
  });

  test('returns 200 (not 404) when deleting a non-existent post', async ({ postsClient }) => {
    // Pins JSONPlaceholder's actual behavior: unlike GET, DELETE on a
    // missing id does not 404 — don't assume 404-on-missing generalizes
    // across verbs without checking.
    const response = await postsClient.deleteById(999999);

    expect(response.status()).toBe(200);
  });

  test('partially updates a post', async ({ postsClient }) => {
    const response = await postsClient.update(1, { title: 'updated title' });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id: 1, title: 'updated title' });
  });

  test('returns 200 (not 404) when partially updating a non-existent post', async ({
    postsClient,
  }) => {
    // Same quirk as delete above — PATCH on a missing id also returns 200.
    const response = await postsClient.update(999999, { title: 'ghost' });

    expect(response.status()).toBe(200);
  });

  test('replaces a post', async ({ postsClient }) => {
    const payload = createValidPost({ title: 'replaced title' });
    const response = await postsClient.replace(1, payload);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ...payload } as Record<string, unknown>);
  });

  test('returns 500 when replacing a non-existent post', async ({ postsClient }) => {
    // Unlike PATCH/DELETE (which return 200 on a missing id, see above),
    // PUT on a missing id hits an unhandled error in JSONPlaceholder's
    // underlying server — a genuine bug in the mock, not a design choice.
    // Pinned here so a future fix upstream is a visible, deliberate change.
    const payload = createValidPost();
    const response = await postsClient.replace(999999, payload);

    expect(response.status()).toBe(500);
  });
});
