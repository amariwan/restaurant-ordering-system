'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { getRouteMeta } from '@/config/routes'

export default function LayoutSelector({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  const meta = getRouteMeta(pathname)

  useEffect(() => {
    try {
      const layout = meta?.layout ?? 'dashboard'
      document.documentElement.setAttribute('data-layout', layout)
    } catch {
      // ignore
    }
  }, [meta?.layout])

  if (meta?.layout === 'auth') {
    return <div className="auth-layout">{children}</div>
  }

  if (meta?.layout === 'public') {
    return <div className="public-layout">{children}</div>
  }

  if (meta?.layout === 'none') {
    return <>{children}</>
  }

  // default to dashboard layout
  return <div className="dashboard-layout">{children}</div>
}
