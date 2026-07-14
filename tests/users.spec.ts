import { test, expect } from '@fixtures/api-fixtures';

test.describe('Users API', () => {
  test('creates a new user', async ({ usersClient }) => {
    const response = await usersClient.create({
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ name: 'Jane Doe', email: 'jane.doe@example.com' });
  });

  test('fetches a user by id', async ({ usersClient }) => {
    const response = await usersClient.getById(1);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('id', 1);
  });

  test('returns 404 for a missing user', async ({ usersClient }) => {
    const response = await usersClient.getById(999999);

    expect(response.status()).toBe(404);
  });
});
