import { describe, it, expect } from 'vitest';
import { dataTableConfig } from './data-table';

describe('dataTableConfig', () => {
  it('has text operators', () => {
    expect(dataTableConfig.textOperators.length).toBeGreaterThan(0);
    expect(dataTableConfig.textOperators[0].label).toBe('Contains');
  });

  it('has numeric operators', () => {
    expect(dataTableConfig.numericOperators.some(o => o.value === 'gt')).toBe(true);
  });

  it('has date operators', () => {
    expect(dataTableConfig.dateOperators.some(o => o.value === 'isRelativeToToday')).toBe(true);
  });

  it('has select operators', () => {
    expect(dataTableConfig.selectOperators.some(o => o.value === 'eq')).toBe(true);
  });

  it('has multiSelect operators', () => {
    expect(dataTableConfig.multiSelectOperators.some(o => o.value === 'inArray')).toBe(true);
  });

  it('has boolean operators', () => {
    expect(dataTableConfig.booleanOperators).toHaveLength(2);
  });

  it('has sort orders', () => {
    expect(dataTableConfig.sortOrders.map(o => o.value)).toEqual(['asc', 'desc']);
  });

  it('has filter variants', () => {
    expect(dataTableConfig.filterVariants).toContain('text');
    expect(dataTableConfig.filterVariants).toContain('multiSelect');
  });

  it('has all operators listed', () => {
    expect(dataTableConfig.operators).toContain('iLike');
    expect(dataTableConfig.operators).toContain('isRelativeToToday');
  });

  it('has join operators', () => {
    expect(dataTableConfig.joinOperators).toEqual(['and', 'or']);
  });
});
