import { CreateUserPayload, UserAddress, UserCompany } from '@api/users-client';

export class UserBuilder {
  private payload: CreateUserPayload = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
  };

  withName(name: string): this {
    this.payload.name = name;
    return this;
  }

  withEmail(email: string): this {
    this.payload.email = email;
    return this;
  }

  withUsername(username: string): this {
    this.payload.username = username;
    return this;
  }

  withPhone(phone: string): this {
    this.payload.phone = phone;
    return this;
  }

  withWebsite(website: string): this {
    this.payload.website = website;
    return this;
  }

  withAddress(address: UserAddress): this {
    this.payload.address = address;
    return this;
  }

  withCompany(company: UserCompany): this {
    this.payload.company = company;
    return this;
  }

  build(): CreateUserPayload {
    return { ...this.payload };
  }
}
