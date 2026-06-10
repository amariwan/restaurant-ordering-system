import { describe, it, expect } from 'vitest';
import type { ExtendedColumnFilter } from '@/types/data-table';
import { getFilterOperators, getDefaultFilterOperator, getValidFilters } from './data-table';

describe('getFilterOperators', () => {
  it('returns text operators for text variant', () => {
    const operators = getFilterOperators('text');
    expect(operators).toBeDefined();
    expect(operators.length).toBeGreaterThan(0);
    expect(operators[0].value).toBe('iLike');
  });

  it('returns numeric operators for number variant', () => {
    const operators = getFilterOperators('number');
    expect(operators.some(o => o.value === 'gt')).toBe(true);
  });

  it('returns boolean operators for boolean variant', () => {
    const operators = getFilterOperators('boolean');
    expect(operators).toHaveLength(2);
    expect(operators.map(o => o.value)).toEqual(['eq', 'ne']);
  });

  it('returns select operators for select variant', () => {
    const operators = getFilterOperators('select');
    expect(operators.some(o => o.value === 'eq')).toBe(true);
  });

  it('returns multiSelect operators for multiSelect variant', () => {
    const operators = getFilterOperators('multiSelect');
    expect(operators.some(o => o.value === 'inArray')).toBe(true);
  });

  it('returns date operators for date variant', () => {
    const operators = getFilterOperators('date');
    expect(operators.some(o => o.value === 'isRelativeToToday')).toBe(true);
  });

  it('falls back to text operators for unknown variant', () => {
    const operators = getFilterOperators('unknown' as any);
    expect(operators[0].value).toBe('iLike');
  });
});

describe('getDefaultFilterOperator', () => {
  it('returns iLike for text variant', () => {
    expect(getDefaultFilterOperator('text')).toBe('iLike');
  });

  it('returns eq for number variant', () => {
    expect(getDefaultFilterOperator('number')).toBe('eq');
  });

  it('returns eq for boolean variant', () => {
    expect(getDefaultFilterOperator('boolean')).toBe('eq');
  });

  it('returns eq for select variant', () => {
    expect(getDefaultFilterOperator('select')).toBe('eq');
  });

  it('returns inArray for multiSelect variant', () => {
    expect(getDefaultFilterOperator('multiSelect')).toBe('inArray');
  });

  it('returns eq for unknown variant', () => {
    expect(getDefaultFilterOperator('unknown' as any)).toBe('iLike');
  });
});

describe('getValidFilters', () => {
  it('returns empty array for empty input', () => {
    expect(getValidFilters([])).toEqual([]);
  });

  type TestData = { name: string; tags: string[] };

  it('keeps filters with non-empty string values', () => {
    const filters: ExtendedColumnFilter<TestData>[] = [{ id: 'name', value: 'test', operator: 'eq', variant: 'text', filterId: 'f1' }];
    expect(getValidFilters(filters)).toHaveLength(1);
  });

  it('filters out empty string values', () => {
    const filters: ExtendedColumnFilter<TestData>[] = [{ id: 'name', value: '', operator: 'eq', variant: 'text', filterId: 'f1' }];
    expect(getValidFilters(filters)).toHaveLength(0);
  });

  it('filters out null values', () => {
    const filters: ExtendedColumnFilter<TestData>[] = [{ id: 'name', value: null as unknown as string, operator: 'eq', variant: 'text', filterId: 'f1' }];
    expect(getValidFilters(filters)).toHaveLength(0);
  });

  it('keeps isEmpty filters even with empty value', () => {
    const filters: ExtendedColumnFilter<TestData>[] = [{ id: 'name', value: '', operator: 'isEmpty', variant: 'text', filterId: 'f1' }];
    expect(getValidFilters(filters)).toHaveLength(1);
  });

  it('keeps isNotEmpty filters', () => {
    const filters: ExtendedColumnFilter<TestData>[] = [{ id: 'name', value: '', operator: 'isNotEmpty', variant: 'text', filterId: 'f1' }];
    expect(getValidFilters(filters)).toHaveLength(1);
  });

  it('filters out empty array values', () => {
    const filters: ExtendedColumnFilter<TestData>[] = [{ id: 'tags', value: [], operator: 'inArray', variant: 'multiSelect', filterId: 'f1' }];
    expect(getValidFilters(filters)).toHaveLength(0);
  });

  it('keeps non-empty array values', () => {
    const filters: ExtendedColumnFilter<TestData>[] = [{ id: 'tags', value: ['a', 'b'], operator: 'inArray', variant: 'multiSelect', filterId: 'f1' }];
    expect(getValidFilters(filters)).toHaveLength(1);
  });

  it('filters out undefined values', () => {
    const filters: ExtendedColumnFilter<TestData>[] = [{ id: 'name', value: undefined, operator: 'eq', variant: 'text', filterId: 'f1' } as any];
    expect(getValidFilters(filters)).toHaveLength(0);
  });
});
