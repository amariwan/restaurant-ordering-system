import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/features/restaurant/api/service', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    menuGetCategories: vi.fn(),
    menuGetItems: vi.fn(),
  };
});

import { render, screen, fireEvent } from '../../../../tests/support/render-with-provider';
import { MenuListing } from './menu-listing';
import { Suspense } from 'react';
import * as service from '@/features/restaurant/api/service';

const mockCategories = [
  { id: 1, nameEn: 'Appetizers', nameKu: 'پێشەکی' },
  { id: 2, nameEn: 'Mains', nameKu: 'سەرەکی' },
];

const mockItems = [
  { id: 1, categoryId: 1, categoryNameEn: 'Appetizers', categoryNameKu: 'پێشەکی', nameEn: 'Spring Rolls', nameKu: 'سپرینگ ڕۆڵ', price: 8.5, available: true, imageUrl: 'https://example.com/sr.jpg' },
  { id: 2, categoryId: 2, categoryNameEn: 'Mains', categoryNameKu: 'سەرەکی', nameEn: 'Steak', nameKu: 'ستیك', price: 24, available: true },
  { id: 3, categoryId: 2, categoryNameEn: 'Mains', categoryNameKu: 'سەرەکی', nameEn: 'Burger', nameKu: 'بێرگەر', price: 15, available: false },
];

describe('MenuListing', () => {
  beforeEach(() => {
    (service.menuGetCategories as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);
    (service.menuGetItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockItems);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders available menu items', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><MenuListing /></Suspense>);

    expect(await screen.findByText('Spring Rolls')).toBeInTheDocument();
    expect(screen.getByText('Steak')).toBeInTheDocument();
    expect(screen.queryByText('Burger')).not.toBeInTheDocument();
  });

  it('shows empty state when no items available', async () => {
    (service.menuGetItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<Suspense fallback={<div>Loading...</div>}><MenuListing /></Suspense>);

    expect(await screen.findByText(/No menu items found/i)).toBeInTheDocument();
  });

  it('filters items by category', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><MenuListing /></Suspense>);

    expect(await screen.findByText('Spring Rolls')).toBeInTheDocument();
    expect(screen.getByText('Steak')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Appetizers' }));

    expect(screen.getByText('Spring Rolls')).toBeInTheDocument();
    expect(screen.queryByText('Steak')).not.toBeInTheDocument();
  });
});
