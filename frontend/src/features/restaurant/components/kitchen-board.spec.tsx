import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('@/components/ui/local-date', () => ({
  default: ({ value }: { value: string }) => <span>{value}</span>,
}));

import { render, screen } from '../../../../tests/support/render-with-provider';
import KitchenBoard from './kitchen-board';
import * as service from '@/features/restaurant/api/service';
import * as signalr from '@/features/restaurant/lib/signalr-store';
import { Suspense } from 'react';

function makeMockHub() {
  return {
    on: vi.fn(),
    off: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    state: 0,
  };
}

function makeOrder(overrides = {}) {
  return {
    id: 1,
    tableId: 5,
    tableNumber: 5,
    userId: 1,
    status: 'pending' as const,
    items: [{ id: 1, menuItemId: 1, menuItemName: 'Spring Rolls', menuItemNameKu: 'سپرینگ ڕۆڵ', price: 8.5, quantity: 2 }],
    createdAt: '2026-06-08T12:00:00Z',
    ...overrides,
  };
}

describe('KitchenBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (service.ordersGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeOrder(),
      makeOrder({ id: 2, status: 'preparing', tableNumber: 3 }),
    ]);
    (signalr.getOrderHub as unknown as ReturnType<typeof vi.fn>).mockReturnValue(makeMockHub());
  });

  it('renders pending and preparing orders', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><KitchenBoard /></Suspense>);

    expect(await screen.findByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('Table 5')).toBeInTheDocument();
    expect(screen.getByText('Table 3')).toBeInTheDocument();
  });

  it('shows action buttons based on status', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><KitchenBoard /></Suspense>);

    expect(await screen.findByText('Preparing')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows empty state when no kitchen orders', async () => {
    (service.ordersGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<Suspense fallback={<div>Loading...</div>}><KitchenBoard /></Suspense>);

    expect(await screen.findByText(/No pending or preparing orders/i)).toBeInTheDocument();
  });

  it('hides served/cancelled orders', async () => {
    (service.ordersGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeOrder({ status: 'served' }),
      makeOrder({ status: 'cancelled' }),
    ]);

    render(<Suspense fallback={<div>Loading...</div>}><KitchenBoard /></Suspense>);

    expect(await screen.findByText(/No pending or preparing orders/i)).toBeInTheDocument();
  });
});
