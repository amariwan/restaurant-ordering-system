import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when window width is desktop size', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as any;

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true when window width is mobile size', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as any;

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('adds event listener on mount', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    const addEventListener = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener,
      removeEventListener: vi.fn(),
    })) as any;

    renderHook(() => useIsMobile());

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes event listener on unmount', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener,
    })) as any;

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });
});
