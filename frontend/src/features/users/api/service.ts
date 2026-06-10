// Users service — reuse shared restaurant API helpers for DRY
import type { PaginatedResponse } from '@/features/restaurant/api/types';
import type { User } from '@/features/users/api/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/features/restaurant/api/service';

export type UserRole = 'Admin' | 'Waiter' | 'Kitchen';
export type { User };

export type UserFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export type UserMutationPayload = {
  role?: UserRole;
  name?: string;
  email?: string;
};

export async function getUsers(filters: UserFilters): Promise<{
  users: User[];
  total_users: number;
  offset: number;
  limit: number;
}> {
  const result = await apiGet<PaginatedResponse<User>>('/users', {
    search: filters.search,
    page: filters.page || 1,
    pageSize: filters.limit || 10
  });
  return {
    users: result.items,
    total_users: result.totalCount,
    offset: (result.page - 1) * result.pageSize,
    limit: result.pageSize
  };
}

export async function updateUser(id: number, data: UserMutationPayload): Promise<User> {
  return apiPut<User>(`/users/${id}`, data);
}

export async function deleteUser(id: number): Promise<void> {
  return apiDelete<void>(`/users/${id}`);
}

export type CreateUserPayload = UserMutationPayload & {
  first_name?: string;
  last_name?: string;
  password?: string;
};

export async function createUser(data: CreateUserPayload): Promise<void> {
  const name = data.name ?? `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim();
  const email = String(data.email ?? '');
  const password = data.password || 'Password123!';

  await apiPost('/auth/register', {
    name: name || 'New User',
    email,
    password
  });
}
