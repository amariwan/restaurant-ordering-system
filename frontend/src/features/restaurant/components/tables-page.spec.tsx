import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/restaurant/api/service', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    tablesGetAll: vi.fn(),
    tablesUpdate: vi.fn(),
    tablesDelete: vi.fn()
  };
});

import { render, screen } from '../../../../tests/support/render-with-provider';
import { TablesPage } from './tables-page';
import * as service from '@/features/restaurant/api/service';
import { Suspense } from 'react';

describe('TablesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (service.tablesGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, number: 1, status: 'free' },
      { id: 2, number: 2, status: 'occupied' },
      { id: 3, number: 3, status: 'reserved' }
    ]);
  });

  it('renders all tables with status badges', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <TablesPage />
      </Suspense>
    );

    expect(await screen.findByText('Table 1')).toBeInTheDocument();
    expect(screen.getByText('Table 2')).toBeInTheDocument();
    expect(screen.getByText('Table 3')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Occupied')).toBeInTheDocument();
    expect(screen.getByText('Reserved')).toBeInTheDocument();
  });

  it('shows empty state when no tables', async () => {
    (service.tablesGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <TablesPage />
      </Suspense>
    );

    expect(await screen.findByText(/No tables found/i)).toBeInTheDocument();
  });
});
