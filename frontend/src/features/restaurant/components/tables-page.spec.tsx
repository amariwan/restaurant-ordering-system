import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/restaurant/api/service', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    tablesGetAll: vi.fn(),
    tablesUpdate: vi.fn(),
    tablesDelete: vi.fn(),
    getMapBackground: vi.fn()
  };
});

import { render, screen } from '../../../../tests/support/render-with-provider';
import { TablesPage } from './tables-page';
import * as service from '@/features/restaurant/api/service';
import { Suspense } from 'react';

describe('TablesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (service.getMapBackground as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ url: null });
    (service.tablesGetAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, number: 1, capacity: 4, posX: 0, posY: 0, area: null, status: 'free', shape: 'Circle', width: 72, height: 72, rotation: 0, colorHex: null, description: null, type: 'Regular', isActive: true },
      { id: 2, number: 2, capacity: 4, posX: 0, posY: 0, area: null, status: 'occupied', shape: 'Circle', width: 72, height: 72, rotation: 0, colorHex: null, description: null, type: 'Regular', isActive: true },
      { id: 3, number: 3, capacity: 4, posX: 0, posY: 0, area: null, status: 'reserved', shape: 'Circle', width: 72, height: 72, rotation: 0, colorHex: null, description: null, type: 'Regular', isActive: true }
    ]);
  });

  it('renders all tables with status badges', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <TablesPage />
      </Suspense>
    );

    expect(await screen.findByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Occupied')).toBeInTheDocument();
    expect(screen.getByText('Reserved')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(4);
    expect(screen.getAllByText('2')).toHaveLength(1);
    expect(screen.getAllByText('3')).toHaveLength(1);
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
