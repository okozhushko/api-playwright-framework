import { CreatePostPayload } from '@api/posts-client';

export function createValidPost(overrides?: Partial<CreatePostPayload>): CreatePostPayload {
  return {
    title: 'foo',
    body: 'bar',
    userId: 1,
    ...overrides,
  };
}
