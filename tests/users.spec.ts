import { test, expect } from '@fixtures/api-fixtures';
import { createValidUser } from '@factories/user-factory';
import { UserBuilder } from '@builders/user-builder';

test.describe('Users API', () => {
  test('creates a new user', async ({ usersClient }) => {
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
