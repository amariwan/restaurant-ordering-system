interface ParsedSession {
  user: {
    id: number;
    role?: string;
  };
}

// oxlint-disable-next-line @typescript-eslint/no-explicit-any
function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    const payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function auth(): Promise<ParsedSession | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    // First try: parse the JWT locally from the restaurant_token cookie
    // This mirrors what middleware.ts does and avoids backend dependency.
    const tokenCookie = cookieStore.get('restaurant_token');
    if (tokenCookie?.value) {
      const payload = parseJwt(tokenCookie.value);
      if (payload) {
        const id = parseInt(
          payload.sub ??
            payload.nameid ??
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
            payload.jti ??
            '0',
          10
        );
        const role =
          payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
          payload['role'] ||
          payload.role;
        if (id > 0) {
          return { user: { id, role } };
        }
      }
    }

    // Fallback: forward incoming cookies to backend /auth/me
    // This handles cases where auth relies on HttpOnly refresh cookies.
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const RAW_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:5000';
    const base = RAW_BASE.endsWith('/api')
      ? RAW_BASE.replace(/\/$/, '')
      : `${RAW_BASE.replace(/\/$/, '')}/api`;
    const url = `${base}/auth/me`;

    const headers: Record<string, string> = { cookie: cookieHeader };
    if (tokenCookie?.value) {
      headers['Authorization'] = `Bearer ${tokenCookie.value}`;
    }

    const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
    if (!res.ok) return null;

    const data = await res.json();
    const id = (data?.id ?? data?.user?.id) as number | undefined;
    const role = (data?.role ?? data?.user?.role) as string | undefined;
    if (!id) return null;
    return { user: { id: Number(id), role } };
  } catch {
    return null;
  }
}
