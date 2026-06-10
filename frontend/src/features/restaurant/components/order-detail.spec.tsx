import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/restaurant/api/service', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    ordersGetById: vi.fn(),
    ordersUpdateStatus: vi.fn(),
    paymentsGetByOrder: vi.fn(),
    paymentsCreate: vi.fn()
  };
});

vi.mock('@/features/restaurant/lib/auth-store', () => ({
  parseRole: vi.fn()
}));

vi.mock('@/components/ui/local-date', () => ({
  default: ({ value }: { value: string }) => <span>{value}</span>
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ id: '1' })),
  useRouter: vi.fn()
}));

import { render, screen } from '../../../../tests/support/render-with-provider';
import { OrderDetail } from './order-detail';
import * as service from '@/features/restaurant/api/service';
import * as authStore from '@/features/restaurant/lib/auth-store';
import { Suspense } from 'react';

function makeOrder(overrides = {}) {
  return {
    id: 1,
    tableId: 5,
    tableNumber: 5,
    userId: 1,
    status: 'pending' as const,
    items: [
      {
        id: 1,
        menuItemId: 1,
        menuItemName: 'Spring Rolls',
        menuItemNameKu: 'سپرینگ ڕۆڵ',
        price: 8.5,
        quantity: 2
      },
      {
        id: 2,
        menuItemId: 2,
        menuItemName: 'Steak',
        menuItemNameKu: 'ستیك',
        price: 24,
        quantity: 1
      }
    ],
    createdAt: '2026-06-08T12:00:00Z',
    ...overrides
  };
}

function renderDetail() {
  return render(
    <Suspense fallback={<div>Loading...</div>}>
      <OrderDetail />
    </Suspense>
  );
}

describe('OrderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (service.ordersGetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder());
    (service.paymentsGetByOrder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (authStore.parseRole as unknown as ReturnType<typeof vi.fn>).mockReturnValue('Kitchen');
  });

  it('renders order header with id and table', async () => {
    renderDetail();

    expect(await screen.findByText('Order #1')).toBeInTheDocument();
    expect(screen.getByText(/Table 5/)).toBeInTheDocument();
  });

  it('displays order items', async () => {
    renderDetail();

    expect(await screen.findByText('Spring Rolls')).toBeInTheDocument();
    expect(screen.getByText('Steak')).toBeInTheDocument();
  });

  it('shows kitchen actions for pending orders', async () => {
    renderDetail();

    expect(await screen.findByText('Start Preparing')).toBeInTheDocument();
  });

  it('shows mark ready for preparing orders', async () => {
    (service.ordersGetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOrder({ status: 'preparing' })
    );

    renderDetail();

    expect(await screen.findByText('Mark Ready')).toBeInTheDocument();
  });

  it('shows cancel button for waiter role', async () => {
    (authStore.parseRole as unknown as ReturnType<typeof vi.fn>).mockReturnValue('Waiter');

    renderDetail();

    expect(await screen.findByText('Cancel Order')).toBeInTheDocument();
  });

  it('shows payment section when remaining is due', async () => {
    renderDetail();

    expect(await screen.findByText('Add Payment')).toBeInTheDocument();
  });

  it('shows fully paid message', async () => {
    (service.paymentsGetByOrder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, orderId: 1, amount: 41, method: 'cash', paidAt: '2026-06-08T12:05:00Z' }
    ]);

    renderDetail();

    expect(await screen.findByText(/fully paid/i)).toBeInTheDocument();
  });

  it('shows existing payments in table', async () => {
    (service.paymentsGetByOrder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, orderId: 1, amount: 20, method: 'cash', paidAt: '2026-06-08T12:05:00Z' }
    ]);

    renderDetail();

    await screen.findByText('cash');
    const tables = screen.getAllByRole('table');
    const paymentsTable = tables[tables.length - 1];
    expect(paymentsTable.textContent).toContain('$20.00');
    expect(screen.getByText('cash')).toBeInTheDocument();
  });
});
