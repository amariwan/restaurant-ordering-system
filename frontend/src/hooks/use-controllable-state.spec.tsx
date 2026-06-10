import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useControllableState } from './use-controllable-state';

describe('useControllableState', () => {
  it('uses defaultProp when no prop is provided', () => {
    const { result } = renderHook(() => useControllableState({ defaultProp: 'default' }));
    const [value] = result.current;
    expect(value).toBe('default');
  });

  it('uses prop when provided', () => {
    const { result } = renderHook(() =>
      useControllableState({ prop: 'controlled', defaultProp: 'default' })
    );
    const [value] = result.current;
    expect(value).toBe('controlled');
  });

  it('updates uncontrolled state with setValue', () => {
    const { result } = renderHook(() => useControllableState({ defaultProp: 'initial' }));
    expect(result.current[0]).toBe('initial');

    act(() => result.current[1]('updated'));

    expect(result.current[0]).toBe('updated');
  });

  it('does not update controlled state with setValue', () => {
    const { result } = renderHook(() => useControllableState({ prop: 'fixed' }));
    expect(result.current[0]).toBe('fixed');

    act(() => result.current[1]('changed'));

    expect(result.current[0]).toBe('fixed');
  });

  it('calls onChange when uncontrolled state changes', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultProp: 'a', onChange }));

    act(() => result.current[1]('b'));

    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('calls onChange when controlled setter provides different value', () => {
    const onChange = vi.fn();
    const { result, rerender: _rerender } = renderHook(
      ({ prop }) => useControllableState({ prop, onChange }),
      { initialProps: { prop: 'a' } }
    );

    act(() => result.current[1]('b'));

    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useControllableState({ defaultProp: 0 }));

    act(() => result.current[1]((prev: number | undefined) => (prev ?? 0) + 1));

    expect(result.current[0]).toBe(1);
  });
});
