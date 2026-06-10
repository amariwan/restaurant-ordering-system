import { describe, it, expect } from 'vitest';
import { userSchema } from './user';

describe('userSchema', () => {
  it('accepts valid user data', () => {
    const result = userSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      role: 'Admin',
      status: 'Active'
    });
    expect(result.success).toBe(true);
  });

  it('rejects short first name', () => {
    const result = userSchema.safeParse({
      first_name: 'J',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      role: 'Admin',
      status: 'Active'
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = userSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'not-email',
      phone: '+1234567890',
      role: 'Admin',
      status: 'Active'
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty phone', () => {
    const result = userSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '',
      role: 'Admin',
      status: 'Active'
    });
    expect(result.success).toBe(false);
  });
});
