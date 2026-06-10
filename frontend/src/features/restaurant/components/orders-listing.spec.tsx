import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/features/restaurant/api/service', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    ordersGetAll: vi.fn(),
    ordersUpdateStatus: vi.fn(),
  };
});

vi.mock('@/features/restaurant/lib/signalr-store', () => ({
  getOrderHub: vi.fn(),
  startOrderHub: vi.fn(),
  stopOrderHub: vi.fn(),
}));

vi.mock('@/features/restaurant/lib/auth-store', () => ({
  parseRole: vi.fn(),
}));

import { render, screen } from '../../../../tests/support/render-with-provider';
import { OrdersListing } from './orders-listing';
import { Suspense } from 'react';
import * as service from '@/features/restaurant/api/service';
import * as signalrStore from '@/features/restaurant/lib/signalr-store';
import * as authStore from '@/features/restaurant/lib/auth-store';

const mockOrders = [
  {
    id: 1,
    tableId: 5,
    tableNumber: 5,
    userId: 1,
    status: 'pending' as const,
    items: [
      { id: 1, menuItemId: 1, menuItemName: 'Spring Rolls', menuItemNameKu: 'سپرینگ ڕۆڵ', price: 8.5, quantity: 2 },
    ],
    createdAt: '2026-06-08T12:00:00Z',
  },
  {
    id: 2,
    tableId: 3,
    tableNumber: 3,
    userId: 2,
    status: 'preparing' as const,
    items: [
      { id: 2, menuItemId: 2, menuItemName: 'Steak', menuItemNameKu: 'ستیك', price: 24, quantity: 1 },
      { id: 3, menuItemId: 3, menuItemName: 'Burger', menuItemNameKu: 'بێرگەر', price: 15, quantity: 2 },
    ],
    createdAt: '2026-06-08T12:30:00Z',
  },
];

describe('OrdersListing', () => {
  beforeEach(() => {
    (service.ordersGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);
    (signalrStore.getOrderHub as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      on: vi.fn(),
      off: vi.fn(),
    });
    (authStore.parseRole as unknown as ReturnType<typeof vi.fn>).mockReturnValue('Kitchen');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders order rows with status badges', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><OrdersListing /></Suspense>);

    expect(await screen.findByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('Table 5')).toBeInTheDocument();
    expect(screen.getByText('Table 3')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getAllByText('Preparing').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no orders', async () => {
    (service.ordersGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<Suspense fallback={<div>Loading...</div>}><OrdersListing /></Suspense>);

    expect(await screen.findByText(/No orders/i)).toBeInTheDocument();
  });

  it('shows kitchen action buttons based on order status', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><OrdersListing /></Suspense>);

    expect(await screen.findByText('Ready')).toBeInTheDocument();
    expect(screen.getAllByText('Preparing').length).toBe(2);
  });

  it('shows cancel button for waiter role', async () => {
    (authStore.parseRole as unknown as ReturnType<typeof vi.fn>).mockReturnValue('Waiter');

    render(<Suspense fallback={<div>Loading...</div>}><OrdersListing /></Suspense>);

    const cancelButtons = await screen.findAllByText('Cancel');
    expect(cancelButtons).toHaveLength(2);
  });
});
