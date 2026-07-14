import { APIResponse } from '@playwright/test';
import { BaseApiClient } from './base-client';

export interface UserGeo {
  lat: string;
  lng: string;
}

export interface UserAddress {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: UserGeo;
}

export interface UserCompany {
  name: string;
  catchPhrase: string;
  bs: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  username?: string;
  phone?: string;
  website?: string;
  address?: UserAddress;
  company?: UserCompany;
}

export class UsersClient extends BaseApiClient {
  private readonly basePath = '/users';

  async getById(id: string | number): Promise<APIResponse> {
    return this.get(`${this.basePath}/${id}`);
  }

  async list(params?: Record<string, string | number>): Promise<APIResponse> {
    return this.get(this.basePath, params);
  }

  async create(payload: CreateUserPayload): Promise<APIResponse> {
    return this.post(this.basePath, payload);
  }

  async update(id: string | number, payload: Partial<CreateUserPayload>): Promise<APIResponse> {
    return this.patch(`${this.basePath}/${id}`, payload);
  }

  async replace(id: string | number, payload: CreateUserPayload): Promise<APIResponse> {
    return this.put(`${this.basePath}/${id}`, payload);
  }

  async deleteById(id: string | number): Promise<APIResponse> {
    return this.delete(`${this.basePath}/${id}`);
  }
}
