import { describe, it, expect, vi } from 'vitest';

vi.mock('@/features/restaurant/api/service', () => ({
  menuGetCategories: vi.fn(),
  menuGetItems: vi.fn(),
  tablesGetAll: vi.fn(),
  ordersGetAll: vi.fn(),
  ordersGetById: vi.fn(),
  paymentsGetByOrder: vi.fn(),
  usersGetAll: vi.fn(),
  menuCreateCategory: vi.fn(),
  menuUpdateCategory: vi.fn(),
  menuDeleteCategory: vi.fn(),
  menuCreateItem: vi.fn(),
  menuUpdateItem: vi.fn(),
  menuDeleteItem: vi.fn(),
  tablesUpdate: vi.fn(),
  tablesDelete: vi.fn(),
  ordersUpdateStatus: vi.fn(),
  ordersCreate: vi.fn(),
  paymentsCreate: vi.fn(),
  usersUpdate: vi.fn(),
  usersDelete: vi.fn()
}));

import {
  keys,
  menuCategoriesOptions,
  menuItemsOptions,
  tablesAllOptions,
  ordersAllOptions,
  ordersDetailOptions,
  paymentsByOrderOptions,
  usersAllOptions
} from './queries';

describe('keys', () => {
  it('has root restaurant key', () => {
    expect(keys.all).toEqual(['restaurant']);
  });

  it('has menu sub-keys', () => {
    expect(keys.menu.all).toEqual(['restaurant', 'menu']);
    expect(keys.menu.categories).toEqual(['restaurant', 'menu', 'categories']);
    expect(keys.menu.items).toEqual(['restaurant', 'menu', 'items']);
  });

  it('has tables sub-keys', () => {
    expect(keys.tables.all).toEqual(['restaurant', 'tables']);
    expect(keys.tables.byId(5)).toEqual(['restaurant', 'tables', 5]);
  });

  it('has orders sub-keys', () => {
    expect(keys.orders.all).toEqual(['restaurant', 'orders']);
    expect(keys.orders.list({ status: 'pending' })).toEqual([
      'restaurant',
      'orders',
      'list',
      { status: 'pending' }
    ]);
    expect(keys.orders.detail(3)).toEqual(['restaurant', 'orders', 'detail', 3]);
  });

  it('has payments sub-keys', () => {
    expect(keys.payments.all).toEqual(['restaurant', 'payments']);
    expect(keys.payments.byOrder(10)).toEqual(['restaurant', 'payments', 10]);
  });

  it('has users all key', () => {
    expect(keys.users.all).toEqual(['restaurant', 'users']);
  });
});

describe('menuCategoriesOptions', () => {
  it('returns query options with correct key', () => {
    const options = menuCategoriesOptions;
    expect(options.queryKey).toEqual(['restaurant', 'menu', 'categories']);
  });

  it('refers to menuGetCategories queryFn', () => {
    expect(typeof menuCategoriesOptions.queryFn).toBe('function');
  });
});

describe('menuItemsOptions', () => {
  it('returns query options with filters in key', () => {
    const filters = { categoryId: 2, available: true };
    const options = menuItemsOptions(filters);
    expect(options.queryKey).toEqual(['restaurant', 'menu', 'items', filters]);
  });

  it('works without filters', () => {
    const options = menuItemsOptions();
    expect(options.queryKey).toEqual(['restaurant', 'menu', 'items', undefined]);
  });

  it('refers to menuGetItems queryFn', () => {
    const opts = menuItemsOptions({ categoryId: 1 });
    expect(typeof opts.queryFn).toBe('function');
  });
});

describe('tablesAllOptions', () => {
  it('returns query options for all tables', () => {
    const options = tablesAllOptions;
    expect(options.queryKey).toEqual(['restaurant', 'tables']);
    expect(typeof options.queryFn).toBe('function');
  });
});

describe('ordersAllOptions', () => {
  it('includes filters in list key', () => {
    const filters = { status: 'preparing' as const, tableId: 3 };
    const options = ordersAllOptions(filters);
    expect(options.queryKey).toEqual(['restaurant', 'orders', 'list', filters]);
    expect(typeof options.queryFn).toBe('function');
  });

  it('works with undefined filters', () => {
    const options = ordersAllOptions();
    expect(options.queryKey).toEqual(['restaurant', 'orders', 'list', undefined]);
  });
});

describe('ordersDetailOptions', () => {
  it('includes order id in key', () => {
    const options = ordersDetailOptions(7);
    expect(options.queryKey).toEqual(['restaurant', 'orders', 'detail', 7]);
    expect(typeof options.queryFn).toBe('function');
  });
});

describe('paymentsByOrderOptions', () => {
  it('includes order id in key', () => {
    const options = paymentsByOrderOptions(42);
    expect(options.queryKey).toEqual(['restaurant', 'payments', 42]);
    expect(typeof options.queryFn).toBe('function');
  });
});

describe('usersAllOptions', () => {
  it('returns query options for all users', () => {
    const options = usersAllOptions;
    expect(options.queryKey).toEqual(['restaurant', 'users']);
    expect(typeof options.queryFn).toBe('function');
  });
});
