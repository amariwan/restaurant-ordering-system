import { describe, it, expect, vi } from 'vitest';
import { getUsers, updateUser, deleteUser, createUser } from './service';

vi.mock('@/features/restaurant/api/service', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  apiPost: vi.fn(),
}));

import { apiGet, apiPut, apiDelete, apiPost } from '@/features/restaurant/api/service';

describe('getUsers', () => {
  it('returns users list with pagination', async () => {
    (apiGet as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        { id: 1, name: 'Alice', email: 'alice@test.com', role: 'Waiter' },
        { id: 2, name: 'Bob', email: 'bob@test.com', role: 'Kitchen' },
      ],
      totalCount: 2, page: 1, pageSize: 10, totalPages: 1,
    });

    const result = await getUsers({ page: 1, limit: 10 });

    expect(result.users).toHaveLength(2);
    expect(result.total_users).toBe(2);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(10);
    expect(apiGet).toHaveBeenCalledWith('/users', { search: undefined, page: 1, pageSize: 10 });
  });

  it('computes offset correctly for page 2', async () => {
    (apiGet as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [], totalCount: 0, page: 2, pageSize: 20, totalPages: 0,
    });

    const result = await getUsers({ page: 2, limit: 20 });

    expect(result.offset).toBe(20);
    expect(result.limit).toBe(20);
  });

  it('handles null filters gracefully', async () => {
    (apiGet as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0,
    });

    const result = await getUsers({});

    expect(result.offset).toBe(0);
    expect(result.limit).toBe(10);
  });

  it('handles empty page filter with search', async () => {
    (apiGet as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0,
    });

    const result = await getUsers({ search: 'test' });

    expect(result.offset).toBe(0);
    expect(result.limit).toBe(10);
  });
});

describe('updateUser', () => {
  it('calls apiPut with correct path', async () => {
    (apiPut as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, role: 'Admin' });

    const result = await updateUser(1, { role: 'Admin' });

    expect(apiPut).toHaveBeenCalledWith('/users/1', { role: 'Admin' });
    expect(result).toEqual({ id: 1, role: 'Admin' });
  });
});

describe('deleteUser', () => {
  it('calls apiDelete with correct path', async () => {
    (apiDelete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await deleteUser(5);

    expect(apiDelete).toHaveBeenCalledWith('/users/5');
  });
});

describe('createUser', () => {
  it('calls apiPost with registration data', async () => {
    (apiPost as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await createUser({ name: 'New User', email: 'new@test.com', first_name: 'New', last_name: 'User' });

    expect(apiPost).toHaveBeenCalledWith('/auth/register', {
      name: 'New User',
      email: 'new@test.com',
      password: 'Password123!',
    });
  });

  it('constructs name from first and last name', async () => {
    (apiPost as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await createUser({ first_name: 'John', last_name: 'Doe', email: 'john@test.com' });

    expect(apiPost).toHaveBeenCalledWith('/auth/register', {
      name: 'John Doe',
      email: 'john@test.com',
      password: 'Password123!',
    });
  });

  it('uses fallback name when both name and first/last are empty', async () => {
    (apiPost as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await createUser({ email: 'anon@test.com' });

    expect(apiPost).toHaveBeenCalledWith('/auth/register', {
      name: 'New User',
      email: 'anon@test.com',
      password: 'Password123!',
    });
  });
});
