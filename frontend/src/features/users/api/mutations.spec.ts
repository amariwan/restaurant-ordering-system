import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./service', () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

const mockInvalidateQueries = vi.fn();

vi.mock('@/lib/query-client', () => ({
  getQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

vi.mock('./queries', () => ({
  userKeys: {
    all: ['users'],
  },
}));

import { createUserMutation, updateUserMutation, deleteUserMutation } from './mutations';
import { createUser, updateUser, deleteUser } from './service';

describe('createUserMutation', () => {
  beforeEach(() => {
    mockInvalidateQueries.mockClear();
  });

  it('calls createUser service with payload', async () => {
    const payload = { name: 'Test', email: 'test@test.com' };
    await (createUserMutation.mutationFn as any)(payload);
    expect(createUser).toHaveBeenCalledWith(payload);
  });

  it('invalidates user queries on success', async () => {
    await (createUserMutation.onSuccess as any)();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] });
  });
});

describe('updateUserMutation', () => {
  beforeEach(() => {
    mockInvalidateQueries.mockClear();
  });

  it('calls updateUser service with id and values', async () => {
    await (updateUserMutation.mutationFn as any)({ id: 5, values: { role: 'Admin' } });
    expect(updateUser).toHaveBeenCalledWith(5, { role: 'Admin' });
  });

  it('invalidates user queries on success', async () => {
    await (updateUserMutation.onSuccess as any)();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] });
  });
});

describe('deleteUserMutation', () => {
  beforeEach(() => {
    mockInvalidateQueries.mockClear();
  });

  it('calls deleteUser service with id', async () => {
    await (deleteUserMutation.mutationFn as any)(10);
    expect(deleteUser).toHaveBeenCalledWith(10);
  });

  it('invalidates user queries on success', async () => {
    await (deleteUserMutation.onSuccess as any)();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] });
  });
});
