import { APIRequestContext, APIResponse } from '@playwright/test';

export class BaseApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  async get(url: string, params?: Record<string, string | number>): Promise<APIResponse> {
    return this.request.get(url, { params });
  }

  async post(url: string, data?: unknown): Promise<APIResponse> {
    return this.request.post(url, { data });
  }

  async put(url: string, data?: unknown): Promise<APIResponse> {
    return this.request.put(url, { data });
  }

  async patch(url: string, data?: unknown): Promise<APIResponse> {
    return this.request.patch(url, { data });
  }

  async delete(url: string): Promise<APIResponse> {
    return this.request.delete(url);
  }
}
