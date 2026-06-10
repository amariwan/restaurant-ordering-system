import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './use-media-query';

describe('useMediaQuery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns isOpen false initially when not matching', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as any;

    const { result } = renderHook(() => useMediaQuery());
    expect(result.current.isOpen).toBe(false);
  });

  it('returns isOpen true when media matches', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as any;

    const { result } = renderHook(() => useMediaQuery());
    expect(result.current.isOpen).toBe(true);
  });

  it('adds event listener on mount', () => {
    const addEventListener = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener,
      removeEventListener: vi.fn(),
    })) as any;

    renderHook(() => useMediaQuery());

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes event listener on unmount', () => {
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener,
    })) as any;

    const { unmount } = renderHook(() => useMediaQuery());
    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });
});
