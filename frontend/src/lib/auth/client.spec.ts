import { describe, it, expect, vi } from 'vitest';
import { signIn } from './client';

vi.mock('@/features/restaurant/api/service', () => ({
  authLogin: vi.fn(),
  authLogout: vi.fn()
}));

vi.mock('@/features/restaurant/lib/auth-store', () => ({
  setToken: vi.fn(),
  setUser: vi.fn(),
  clearAuth: vi.fn()
}));

import { authLogin } from '@/features/restaurant/api/service';
import { setToken, setUser } from '@/features/restaurant/lib/auth-store';

describe('signIn', () => {
  it('returns error for unsupported provider', async () => {
    const result = await signIn('google', { email: '', password: '' });
    expect(result).toEqual({ error: 'Unsupported provider' });
  });

  it('returns ok on successful login', async () => {
    (authLogin as ReturnType<typeof vi.fn>).mockResolvedValue({
      token: 'jwt-token',
      user: { id: 1, name: 'Test', email: 'test@test.com', role: 'Waiter' }
    });

    const result = await signIn('credentials', {
      email: 'test@test.com',
      password: 'pass123',
      redirect: false
    });

    expect(result).toEqual({ ok: true });
    expect(setToken).toHaveBeenCalledWith('jwt-token');
    expect(setUser).toHaveBeenCalledWith({
      id: 1,
      name: 'Test',
      email: 'test@test.com',
      role: 'Waiter'
    });
  });

  it('returns ok on successful login with redirect', async () => {
    (authLogin as ReturnType<typeof vi.fn>).mockResolvedValue({
      token: 'jwt-token',
      user: { id: 1, name: 'Test', email: 'test@test.com', role: 'Waiter' }
    });

    const result = await signIn('credentials', {
      email: 'test@test.com',
      password: 'pass123',
      redirect: true
    });

    expect(result).toEqual({ ok: true });
  });

  it('returns error message on Error', async () => {
    (authLogin as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid credentials'));

    const result = await signIn('credentials', {
      email: 'test@test.com',
      password: 'wrong'
    });

    expect(result).toEqual({ error: 'Invalid credentials' });
  });

  it('returns generic error on non-Error', async () => {
    (authLogin as ReturnType<typeof vi.fn>).mockRejectedValue('string error');

    const result = await signIn('credentials', {
      email: 'test@test.com',
      password: 'wrong'
    });

    expect(result).toEqual({ error: 'Login failed' });
  });
});
