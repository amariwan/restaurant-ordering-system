import { describe, it, expect, vi } from 'vitest';
import { signUp } from './actions';

vi.mock('@/features/restaurant/api/service', () => ({
  authRegister: vi.fn()
}));

import { authRegister } from '@/features/restaurant/api/service';

describe('signUp', () => {
  it('returns success when registration succeeds', async () => {
    (authRegister as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await signUp('test@example.com', 'password123', 'Test User');

    expect(result).toEqual({ success: true });
    expect(authRegister).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
  });

  it('returns error message when registration throws Error', async () => {
    (authRegister as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Email already exists'));

    const result = await signUp('existing@example.com', 'password123', 'User');

    expect(result).toEqual({ error: 'Email already exists' });
  });

  it('returns generic error when registration throws non-Error', async () => {
    (authRegister as ReturnType<typeof vi.fn>).mockRejectedValue('string error');

    const result = await signUp('test@example.com', 'password123', 'User');

    expect(result).toEqual({ error: 'Registration failed' });
  });
});
