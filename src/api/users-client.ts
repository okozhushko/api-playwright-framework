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

  async deleteById(id: string | number): Promise<APIResponse> {
    return this.delete(`${this.basePath}/${id}`);
  }
}
