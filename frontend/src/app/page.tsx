import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPageClient from './landing-page-client';

function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!base64) return null;
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

const ROLE_ROUTES: Record<string, string> = {
  Admin: '/orders',
  Waiter: '/orders',
  Kitchen: '/kitchen',
};

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('restaurant_token')?.value;

  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload['role'] || '';
      const route = ROLE_ROUTES[role] || '/orders';
      redirect(route);
    }
  }

  return <LandingPageClient />;
}
