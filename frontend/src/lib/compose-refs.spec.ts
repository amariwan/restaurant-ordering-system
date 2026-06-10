import { describe, it, expect, vi } from 'vitest';
import { composeRefs, useComposedRefs } from './compose-refs';
import { renderHook } from '@testing-library/react';

describe('composeRefs', () => {
  it('calls callback refs with node', () => {
    const ref1 = vi.fn();
    const ref2 = vi.fn();
    const composed = composeRefs(ref1, ref2);
    const node = document.createElement('div');

    composed(node);

    expect(ref1).toHaveBeenCalledWith(node);
    expect(ref2).toHaveBeenCalledWith(node);
  });

  it('sets object refs', () => {
    const ref = { current: null };
    const composed = composeRefs(ref);
    const node = document.createElement('span');

    composed(node as unknown as null);

    expect(ref.current).toBe(node);
  });

  it('handles undefined refs', () => {
    const ref1 = vi.fn();
    const composed = composeRefs(ref1, undefined);
    const node = document.createElement('div');

    composed(node);

    expect(ref1).toHaveBeenCalledWith(node);
  });

  it('returns cleanup function when callback returns cleanup', () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const composed = composeRefs(ref);
    const node = document.createElement('div');

    const cleanupFn = composed(node);
    cleanupFn!();

    expect(cleanup).toHaveBeenCalled();
  });
});

describe('useComposedRefs', () => {
  it('returns a memoized callback ref', () => {
    const ref1 = { current: null };
    const ref2 = vi.fn();
    const { result, rerender } = renderHook(() => useComposedRefs(ref1, ref2));

    const composed = result.current;
    const node = document.createElement('div');
    composed(node);

    expect(ref1.current).toBe(node);
    expect(ref2).toHaveBeenCalledWith(node);

    rerender();
    // Should be same function reference when deps haven't changed
    expect(result.current).toBe(composed);
  });
});
