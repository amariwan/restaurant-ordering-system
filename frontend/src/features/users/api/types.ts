// User types — connected to restaurant backend
import type { UserRole } from '@/features/restaurant/api/types';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
}

export type { UserRole };

export type UserFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

// For backwards compat with the starter's users-table component
export type UsersResponse = {
  users: User[];
  total_users: number;
  offset: number;
  limit: number;
};

export type UserMutationPayload = {
  role?: UserRole;
  name?: string;
  email?: string;
};

export type CreateUserPayload = UserMutationPayload & {
  first_name?: string;
  last_name?: string;
};
