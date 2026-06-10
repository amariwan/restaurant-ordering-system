import { describe, it, expect } from 'vitest';
import { getSortingStateParser, getFiltersStateParser } from './parsers';

describe('getSortingStateParser', () => {
  it('parses valid sorting JSON', () => {
    const parser = getSortingStateParser();
    const result = parser.parse('[{"id":"name","desc":false}]');
    expect(result).toEqual([{ id: 'name', desc: false }]);
  });

  it('returns null for invalid JSON', () => {
    const parser = getSortingStateParser();
    expect(parser.parse('not-json')).toBeNull();
  });

  it('returns null for invalid structure', () => {
    const parser = getSortingStateParser();
    expect(parser.parse('[{"foo":"bar"}]')).toBeNull();
  });

  it('validates against allowed column IDs', () => {
    const parser = getSortingStateParser(['name', 'age']);
    expect(parser.parse('[{"id":"invalid","desc":false}]')).toBeNull();
  });

  it('serializes to JSON', () => {
    const parser = getSortingStateParser();
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const result = parser.serialize([{ id: 'name', desc: true } as any]);
    expect(result).toBe('[{"id":"name","desc":true}]');
  });

  it('equality check returns true for identical arrays', () => {
    const parser = getSortingStateParser();
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const a = [{ id: 'name', desc: false }] as any;
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const b = [{ id: 'name', desc: false }] as any;
    expect(parser.eq!(a, b)).toBe(true);
  });

  it('equality check returns false for different arrays', () => {
    const parser = getSortingStateParser();
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const a = [{ id: 'name', desc: false }] as any;
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const b = [{ id: 'name', desc: true }] as any;
    expect(parser.eq!(a, b)).toBe(false);
  });

  it('accepts Set for columnIds', () => {
    const parser = getSortingStateParser(new Set(['name']));
    expect(parser.parse('[{"id":"name","desc":false}]')).toBeTruthy();
    expect(parser.parse('[{"id":"other","desc":false}]')).toBeNull();
  });
});

describe('getFiltersStateParser', () => {
  const validFilter = {
    id: 'name',
    value: 'test',
    variant: 'text',
    operator: 'iLike',
    filterId: 'f1'
  };

  it('parses valid filter JSON', () => {
    const parser = getFiltersStateParser();
    const result = parser.parse(JSON.stringify([validFilter]));
    expect(result).toHaveLength(1);
    expect(result![0].id).toBe('name');
  });

  it('returns null for invalid JSON', () => {
    const parser = getFiltersStateParser();
    expect(parser.parse('bad')).toBeNull();
  });

  it('returns null for invalid structure', () => {
    const parser = getFiltersStateParser();
    expect(parser.parse('[{"foo":"bar"}]')).toBeNull();
  });

  it('validates against allowed column IDs', () => {
    const parser = getFiltersStateParser(['name']);
    expect(parser.parse(JSON.stringify([{ ...validFilter, id: 'blocked' }]))).toBeNull();
  });

  it('serializes to JSON', () => {
    const parser = getFiltersStateParser();
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const result = parser.serialize([validFilter as any]);
    expect(JSON.parse(result)).toEqual([validFilter]);
  });

  it('equality returns true for identical filters', () => {
    const parser = getFiltersStateParser();
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const a = [validFilter] as any;
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const b = [validFilter] as any;
    expect(parser.eq!(a, b)).toBe(true);
  });

  it('equality returns false for different filters', () => {
    const parser = getFiltersStateParser();
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const a = [{ ...validFilter, value: 'a' }] as any;
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const b = [{ ...validFilter, value: 'b' }] as any;
    expect(parser.eq!(a, b)).toBe(false);
  });
});
