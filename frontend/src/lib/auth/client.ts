import { authLogin } from '@/features/restaurant/api/service';
import { clearAuth, setToken, setUser } from '@/features/restaurant/lib/auth-store';

// Note: refresh token is set as an HttpOnly cookie by the server.
// The client should not set the cookie directly for security reasons.

export async function signIn(
  provider: string,
  options: { email: string; password: string; redirect?: boolean }
) {
  if (provider !== 'credentials') {
    return { error: 'Unsupported provider' };
  }

  try {
    const response = await authLogin({
      email: options.email,
      password: options.password
    });

    setToken(response.token);
    setUser(response.user);

    // Set cookie so middleware can read it during server-side navigation
    if (typeof document !== 'undefined') {
      document.cookie = `restaurant_token=${response.token}; path=/; max-age=${60 * 60 * 8}; samesite=lax`;
    }

    if (options.redirect) {
      return { ok: true };
    }

    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Login failed' };
  }
}

export function signOut(options?: { redirectTo?: string }) {
  // Revoke refresh token on the server (best-effort)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { authLogout } =
      require('@/features/restaurant/api/service') as typeof import('@/features/restaurant/api/service');
    authLogout().catch(() => {});
  } catch {
    // ignore
  }

  clearAuth();

  if (typeof document !== 'undefined') {
    document.cookie = 'restaurant_token=; path=/; max-age=0';
  }

  if (typeof window !== 'undefined' && options?.redirectTo) {
    window.location.href = options.redirectTo;
  }
}
