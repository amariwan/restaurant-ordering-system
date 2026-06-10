import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';

const mockAuth = vi.fn();
const mockGetRouteMeta = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: mockAuth
}));

vi.mock('@/config/routes', () => ({
  getRouteMeta: mockGetRouteMeta
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn()
}));

const { requireAuth, requireRoles, requireRouteAccess } = await import('./guard');

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects when no session', async () => {
    mockAuth.mockResolvedValue(null);

    await requireAuth();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('returns session when authenticated', async () => {
    const session = { user: { id: 1, role: 'admin' } };
    mockAuth.mockResolvedValue(session);

    const result = await requireAuth();

    expect(result).toEqual(session);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('requireRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects when no session', async () => {
    mockAuth.mockResolvedValue(null);

    await requireRoles();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects when role does not match', async () => {
    mockAuth.mockResolvedValue({ user: { id: 1, role: 'user' } });

    await requireRoles(['admin']);

    expect(redirect).toHaveBeenCalledWith('/403');
  });

  it('returns session when role matches', async () => {
    const session = { user: { id: 1, role: 'admin' } };
    mockAuth.mockResolvedValue(session);

    const result = await requireRoles(['admin']);

    expect(result).toEqual(session);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('returns session when no roles required', async () => {
    const session = { user: { id: 1, role: 'user' } };
    mockAuth.mockResolvedValue(session);

    const result = await requireRoles();

    expect(result).toEqual(session);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('requireRouteAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no route meta', async () => {
    mockGetRouteMeta.mockReturnValue(null);

    const result = await requireRouteAccess('/unknown');

    expect(result).toBeNull();
  });

  it('returns null for public route', async () => {
    mockGetRouteMeta.mockReturnValue({ isPublic: true });

    const result = await requireRouteAccess('/public');

    expect(result).toBeNull();
  });

  it('calls requireAuth for protected route', async () => {
    mockGetRouteMeta.mockReturnValue({ requiresAuth: true });
    const session = { user: { id: 1, role: 'admin' } };
    mockAuth.mockResolvedValue(session);

    const result = await requireRouteAccess('/dashboard');

    expect(result).toEqual(session);
  });

  it('redirects when required roles mismatch', async () => {
    mockGetRouteMeta.mockReturnValue({
      requiresAuth: true,
      requiredRoles: ['admin']
    });
    mockAuth.mockResolvedValue({ user: { id: 1, role: 'user' } });

    await requireRouteAccess('/admin');

    expect(redirect).toHaveBeenCalledWith('/403');
  });

  it('returns null when route is neither public nor requires auth', async () => {
    mockGetRouteMeta.mockReturnValue({});

    const result = await requireRouteAccess('/other');

    expect(result).toBeNull();
  });
});
