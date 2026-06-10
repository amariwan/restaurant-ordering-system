import { auth } from '.'
import { redirect } from 'next/navigation'
import { getRouteMeta } from '@/config/routes'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  return session
}

export async function requireRoles(roles: string[] = []) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  if (roles.length > 0) {
    const userRole = session.user.role ?? ''
    const ok = roles.some((r) => r.toLowerCase() === (userRole ?? '').toLowerCase())
    if (!ok) redirect('/403')
  }
  return session
}

/**
 * Enforce route access on the server-side for a given pathname.
 * Pages or layouts can call this with their known pathname (e.g. '/dashboard').
 */
export async function requireRouteAccess(pathname: string) {
  const meta = getRouteMeta(pathname)
  if (!meta) return null

  if (meta.isPublic) return null
  if (meta.requiresAuth) {
    const session = await requireAuth()
    if (meta.requiredRoles && meta.requiredRoles.length > 0) {
      const userRole = session.user.role ?? ''
      const ok = meta.requiredRoles.some((r) => r.toLowerCase() === (userRole ?? '').toLowerCase())
      if (!ok) redirect('/403')
    }
    return session
  }
  return null
}
