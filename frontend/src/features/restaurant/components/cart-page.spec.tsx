import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/features/restaurant/api/service', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    tablesGetAll: vi.fn(),
    ordersCreate: vi.fn(),
  };
});

import { render, screen } from '../../../../tests/support/render-with-provider';
import { CartPage } from './cart-page';
import { Suspense } from 'react';
import { useCartStore } from '@/features/restaurant/lib/cart-store';
import * as service from '@/features/restaurant/api/service';

const mockTables = [
  { id: 1, number: 1, status: 'free' },
  { id: 2, number: 2, status: 'occupied' },
  { id: 3, number: 3, status: 'free' },
];

describe('CartPage', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    (service.tablesGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockTables);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty cart message', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><CartPage /></Suspense>);

    expect(await screen.findByText(/Your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
  });

  it('displays cart items with calculated total', async () => {
    useCartStore.setState({
      items: [
        { menuItemId: 1, menuItemName: 'Spring Rolls', menuItemNameKu: 'سپرینگ ڕۆڵ', price: 8.5, quantity: 2 },
        { menuItemId: 2, menuItemName: 'Steak', menuItemNameKu: 'ستیك', price: 24, quantity: 1 },
      ],
    });

    render(<Suspense fallback={<div>Loading...</div>}><CartPage /></Suspense>);

    expect(await screen.findByText('Spring Rolls')).toBeInTheDocument();
    expect(screen.getByText('Steak')).toBeInTheDocument();
    expect(screen.getByText(/\$41\.00/)).toBeInTheDocument();
  });
});
