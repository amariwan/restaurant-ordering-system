import { NextResponse, NextRequest } from 'next/server';
import { getRouteMeta } from './config/routes';

function base64UrlDecode(input: string) {
  try {
    const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
    const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob === 'function') {
      // Edge/browser runtime
      return decodeURIComponent(escape(atob(b64)));
    }
    // Node runtime
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const decoded = base64UrlDecode(parts[1]);
    if (!decoded) return null;
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // find route meta (if available)
  const meta = getRouteMeta(pathname);

  // If route explicitly public, allow
  if (meta?.isPublic) {
    return NextResponse.next();
  }

  // Allow guests to view individual order pages (e.g. /orders/42)
  if (/^\/orders\/\d+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Determine if this request should be protected
  const protectedPrefixes = ['/orders', '/kitchen', '/admin', '/profile'];
  const shouldProtect = meta?.requiresAuth ?? protectedPrefixes.some((p) => pathname.startsWith(p));

  if (!shouldProtect) {
    return NextResponse.next();
  }

  const token = request.cookies.get('restaurant_token')?.value;
  const refresh = request.cookies.get('restaurant_refresh')?.value;

  // API requests should receive JSON 401/403 responses, pages should redirect
  const isApi = pathname.startsWith('/api');

  if (!token) {
    // If we have an HttpOnly refresh cookie, try to validate user by calling backend /auth/me
    if (refresh) {
      try {
        const RAW_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:5000';
        const base = RAW_BASE.endsWith('/api')
          ? RAW_BASE.replace(/\/$/, '')
          : `${RAW_BASE.replace(/\/$/, '')}/api`;
        const url = `${base}/auth/me`;
        const cookieHeader = request.headers.get('cookie') || '';
        const res = await fetch(url, {
          method: 'GET',
          headers: { cookie: cookieHeader },
          cache: 'no-store'
        });
        if (!res.ok) {
          if (isApi) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
          return NextResponse.redirect(new URL('/login', request.url));
        }

        const user = await res.json();
        // If route requires roles, enforce using user.role
        if (meta?.requiredRoles && meta.requiredRoles.length > 0) {
          const role = (user?.role ?? '').toString();
          const allowed = meta.requiredRoles.some((r) => r.toLowerCase() === role.toLowerCase());
          if (!allowed) {
            if (isApi) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            return NextResponse.redirect(new URL('/403', request.url));
          }
        }

        return NextResponse.next();
      } catch {
        if (isApi) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    if (isApi) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = parseJwt(token);
  if (!payload) {
    if (isApi) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role check
  if (meta?.requiredRoles && meta.requiredRoles.length > 0) {
    const roleClaim =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload['role'];
    const role = typeof roleClaim === 'string' ? roleClaim : String(roleClaim ?? '');
    const allowed = meta.requiredRoles.some((r) => r.toLowerCase() === role.toLowerCase());
    if (!allowed) {
      if (isApi) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*[.](?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/api/(.*)'
  ]
};
