import { describe, it, expect } from 'vitest';
import { signInSchema, signUpSchema } from './schemas';

describe('signInSchema', () => {
  it('accepts valid input', () => {
    const result = signInSchema.safeParse({ email: 'test@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = signInSchema.safeParse({ email: 'not-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = signInSchema.safeParse({ email: 'test@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('accepts valid input', () => {
    const result = signUpSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = signUpSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: '123',
      confirmPassword: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = signUpSchema.safeParse({
      name: '',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });
});
