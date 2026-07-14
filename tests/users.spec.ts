import { test, expect } from '@fixtures/api-fixtures';
import { createValidUser } from '@factories/user-factory';
import { UserBuilder } from '@builders/user-builder';

test.describe('Users API', () => {
  test('creates a new user', { tag: '@smoke' }, async ({ usersClient }) => {
    const payload = createValidUser();
    const response = await usersClient.create(payload);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ ...payload } as Record<string, unknown>);
  });

  test('creates a user with a full profile (nested address and company)', async ({
    usersClient,
  }) => {
    const payload = new UserBuilder()
      .withUsername('janedoe')
      .withPhone('555-1234')
      .withWebsite('jane.dev')
      .withAddress({
        street: 'Main St',
        suite: 'Apt 1',
        city: 'Metropolis',
        zipcode: '12345',
        geo: { lat: '0', lng: '0' },
      })
      .withCompany({ name: 'Acme', catchPhrase: 'We do things', bs: 'synergize' })
      .build();

    const response = await usersClient.create(payload);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ ...payload } as Record<string, unknown>);
  });

  test('fetches a user by id', { tag: '@smoke' }, async ({ usersClient }) => {
    const response = await usersClient.getById(1);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('id', 1);
  });

  test('returns 404 for a missing user', async ({ usersClient }) => {
    const response = await usersClient.getById(999999);

    expect(response.status()).toBe(404);
  });

  test('returns 404 for a non-numeric id', async ({ usersClient }) => {
    const response = await usersClient.getById('abc');

    expect(response.status()).toBe(404);
  });

  test('returns 404 for id zero', async ({ usersClient }) => {
    const response = await usersClient.getById(0);

    expect(response.status()).toBe(404);
  });

  test('returns 404 for a negative id', async ({ usersClient }) => {
    const response = await usersClient.getById(-1);

    expect(response.status()).toBe(404);
  });

  test('lists users filtered by id', async ({ usersClient }) => {
    const response = await usersClient.list({ id: 1 });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toHaveProperty('id', 1);
  });

  test('returns an empty array when filtering by a non-existent id', async ({ usersClient }) => {
    const response = await usersClient.list({ id: 999999 });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  test('deletes a user by id', async ({ usersClient }) => {
    const response = await usersClient.deleteById(1);

    expect(response.status()).toBe(200);
  });

  test('returns 200 (not 404) when deleting a non-existent user', async ({ usersClient }) => {
    // Pins JSONPlaceholder's actual behavior: unlike GET, DELETE on a
    // missing id does not 404 — don't assume 404-on-missing generalizes
    // across verbs without checking.
    const response = await usersClient.deleteById(999999);

    expect(response.status()).toBe(200);
  });

  test('partially updates a user', async ({ usersClient }) => {
    const response = await usersClient.update(1, { email: 'updated@example.com' });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id: 1, email: 'updated@example.com' });
  });

  test('returns 200 (not 404) when partially updating a non-existent user', async ({
    usersClient,
  }) => {
    // Same quirk as delete above — PATCH on a missing id also returns 200.
    const response = await usersClient.update(999999, { name: 'ghost' });

    expect(response.status()).toBe(200);
  });

  test('replaces a user', async ({ usersClient }) => {
    const payload = createValidUser({ name: 'Replaced Name' });
    const response = await usersClient.replace(1, payload);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ...payload } as Record<string, unknown>);
  });
});
