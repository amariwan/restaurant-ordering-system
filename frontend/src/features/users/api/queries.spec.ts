import { describe, it, expect, vi } from 'vitest';

vi.mock('./service', () => ({
  getUsers: vi.fn()
}));

import { userKeys, usersQueryOptions } from './queries';
import { getUsers } from './service';

describe('userKeys', () => {
  it('has all key', () => {
    expect(userKeys.all).toEqual(['users']);
  });

  it('generates list key with filters', () => {
    const filters = { page: 1, limit: 10 };
    expect(userKeys.list(filters)).toEqual(['users', 'list', filters]);
  });

  it('generates detail key', () => {
    expect(userKeys.detail(3)).toEqual(['users', 'detail', 3]);
  });
});

describe('usersQueryOptions', () => {
  it('returns query options with correct key and fn', () => {
    const filters = { page: 2, limit: 20 };
    const options = usersQueryOptions(filters);

    expect(options.queryKey).toEqual(['users', 'list', filters]);
    expect(typeof options.queryFn).toBe('function');
  });

  it('queryFn calls getUsers with filters', () => {
    const filters = { page: 1, limit: 10, search: 'test' };
    const options = usersQueryOptions(filters);

    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    (options.queryFn as any)({});

    expect(getUsers).toHaveBeenCalledWith(filters);
  });
});
