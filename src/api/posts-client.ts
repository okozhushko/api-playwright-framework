import { APIResponse } from '@playwright/test';
import { BaseApiClient } from './base-client';

export interface CreatePostPayload {
  title: string;
  body: string;
  userId: number;
}

export class PostsClient extends BaseApiClient {
  private readonly basePath = '/posts';

  async getById(id: string | number): Promise<APIResponse> {
    return this.get(`${this.basePath}/${id}`);
  }

  async list(params?: Record<string, string | number>): Promise<APIResponse> {
    return this.get(this.basePath, params);
  }

  async create(payload: CreatePostPayload): Promise<APIResponse> {
    return this.post(this.basePath, payload);
  }

  async deleteById(id: string | number): Promise<APIResponse> {
    return this.delete(`${this.basePath}/${id}`);
  }
}
