import { describe, it, expect } from 'vitest';
import { searchParams } from './searchparams';

describe('searchParams', () => {
  it('exports page with default 1', () => {
    expect(searchParams.page.defaultValue).toBe(1);
  });

  it('exports perPage with default 10', () => {
    expect(searchParams.perPage.defaultValue).toBe(10);
  });

  it('exports string parsers', () => {
    expect(searchParams.name).toBeDefined();
    expect(searchParams.gender).toBeDefined();
    expect(searchParams.category).toBeDefined();
    expect(searchParams.role).toBeDefined();
    expect(searchParams.sort).toBeDefined();
  });

  it('has expected keys', () => {
    const keys = Object.keys(searchParams);
    expect(keys).toEqual(['page', 'perPage', 'name', 'gender', 'category', 'role', 'sort']);
  });
});
