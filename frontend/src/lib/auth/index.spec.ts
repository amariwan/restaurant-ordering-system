import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

const { cookies } = await import('next/headers');

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { auth } = await import('./index');



describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('returns null when cookies throws', async () => {
    (cookies as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not in request context'));

    const result = await auth();

    expect(result).toBeNull();
  });

  it('returns null when fetch fails', async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      getAll: () => [{ name: 'restaurant_token', value: 'jwt' }],
    });
    mockFetch.mockResolvedValue({ ok: false });

    const result = await auth();

    expect(result).toBeNull();
  });

  it('returns null when response has no id', async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      getAll: () => [{ name: 'restaurant_token', value: 'jwt' }],
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'admin' }),
    });

    const result = await auth();

    expect(result).toBeNull();
  });

  it('returns user when authenticated with direct id', async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      getAll: () => [{ name: 'restaurant_token', value: 'jwt' }],
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, role: 'admin' }),
    });

    const result = await auth();

    expect(result).toEqual({ user: { id: 1, role: 'admin' } });
  });

  it('returns user when authenticated with nested user.id', async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      getAll: () => [{ name: 'restaurant_token', value: 'jwt' }],
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: 2, role: 'waiter' } }),
    });

    const result = await auth();

    expect(result).toEqual({ user: { id: 2, role: 'waiter' } });
  });

  it('forwards cookies to backend API', async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      getAll: () => [
        { name: 'restaurant_token', value: 'test-jwt' },
        { name: 'other', value: 'val' },
      ],
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    await auth();

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toContain('/auth/me');
    expect(fetchCall[1]?.headers?.cookie).toContain('restaurant_token=test-jwt');
  });
});
