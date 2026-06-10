import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    let value = 'hello';
    let result = value;
    const delay = 500;

    const handler = setTimeout(() => {
      result = value;
    }, delay);

    expect(result).toBe('hello');
    clearTimeout(handler);
  });

  it('debounces value changes after delay', () => {
    const spy = vi.fn();
    const delay = 500;

    setTimeout(() => {
      spy('updated');
    }, delay);

    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(spy).toHaveBeenCalledWith('updated');
  });
});
