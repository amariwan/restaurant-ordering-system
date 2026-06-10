import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCallbackRef } from './use-callback-ref';

describe('useCallbackRef', () => {
  it('returns a stable function reference', () => {
    const { result, rerender } = renderHook(() => useCallbackRef(vi.fn()));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('calls the latest callback', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }) => useCallbackRef(cb),
      { initialProps: { cb: fn1 } }
    );

    result.current();
    expect(fn1).toHaveBeenCalledTimes(1);

    rerender({ cb: fn2 });
    result.current();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('handles undefined callback', () => {
    const { result } = renderHook(() => useCallbackRef(undefined));

    expect(() => result.current()).not.toThrow();
  });

  it('passes arguments through', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useCallbackRef(fn));

    result.current('a', 1, true);
    expect(fn).toHaveBeenCalledWith('a', 1, true);
  });
});
