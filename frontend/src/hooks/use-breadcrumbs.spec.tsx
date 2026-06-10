import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBreadcrumbs } from './use-breadcrumbs';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}));

import { usePathname } from 'next/navigation';

describe('useBreadcrumbs', () => {
  it('returns custom mapping for /orders', () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/orders');

    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toEqual([{ title: 'Orders', link: '/orders' }]);
  });

  it('generates breadcrumbs from path segments', () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/orders/123');

    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toHaveLength(2);
    expect(result.current[0]).toEqual({ title: 'Orders', link: '/orders' });
    expect(result.current[1]).toEqual({ title: '123', link: '/orders/123' });
  });

  it('handles root path', () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/');

    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toEqual([]);
  });

  it('handles single segment', () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/about');

    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toEqual([{ title: 'About', link: '/about' }]);
  });
});
