import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/restaurant/api/service', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    ordersGetAll: vi.fn(),
    usersGetAll: vi.fn(),
    tablesGetAll: vi.fn(),
  };
});

import { render, screen } from '../../../../tests/support/render-with-provider';
import { RestaurantDashboard } from './dashboard';
import * as service from '@/features/restaurant/api/service';
import { Suspense } from 'react';

describe('RestaurantDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (service.ordersGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        { id: 1, tableId: 1, tableNumber: 1, userId: 1, status: 'pending', items: [], createdAt: new Date().toISOString() },
        { id: 2, tableId: 2, tableNumber: 2, userId: 1, status: 'preparing', items: [], createdAt: new Date().toISOString() },
        { id: 3, tableId: 3, tableNumber: 3, userId: 2, status: 'ready', items: [], createdAt: new Date(Date.now() - 86400000).toISOString() },
      ],
      totalCount: 3, page: 1, pageSize: 20, totalPages: 1
    });
    (service.usersGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        { id: 1, name: 'Admin', email: 'a@a.com', role: 'Admin' },
        { id: 2, name: 'Waiter', email: 'w@w.com', role: 'Waiter' },
        { id: 3, name: 'Chef', email: 'c@c.com', role: 'Kitchen' },
      ],
      totalCount: 3, page: 1, pageSize: 20, totalPages: 1
    });
    (service.tablesGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, number: 1, status: 'occupied' },
      { id: 2, number: 2, status: 'occupied' },
    ]);
  });

  it('renders dashboard stats', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><RestaurantDashboard /></Suspense>);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Active Tables')).toBeInTheDocument();
  });

  it('shows user breakdown', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><RestaurantDashboard /></Suspense>);

    expect(await screen.findByText('User Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Waiter')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
  });

  it('shows recent orders', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><RestaurantDashboard /></Suspense>);

    expect(await screen.findByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });
});
