import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedCallback } from './use-debounced-callback';

describe('useDebouncedCallback', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a function', () => {
    const { result } = renderHook(() => useDebouncedCallback(() => {}, 100));
    expect(typeof result.current).toBe('function');
  });

  it('calls the callback after the delay', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 100));

    act(() => result.current());
    expect(fn).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(100));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('debounces multiple rapid calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 100));

    act(() => result.current());
    act(() => result.current());
    act(() => result.current());
    expect(fn).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(100));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to the callback', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 100));

    act(() => result.current('arg1', 42));
    act(() => vi.advanceTimersByTime(100));

    expect(fn).toHaveBeenCalledWith('arg1', 42);
  });

  it('clears timer on unmount', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 100));

    act(() => result.current());
    unmount();
    act(() => vi.advanceTimersByTime(100));

    expect(fn).not.toHaveBeenCalled();
  });
});
