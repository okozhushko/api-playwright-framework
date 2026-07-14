import { CreateUserPayload } from '@api/users-client';

export function createValidUser(overrides?: Partial<CreateUserPayload>): CreateUserPayload {
  return {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    ...overrides,
  };
}
