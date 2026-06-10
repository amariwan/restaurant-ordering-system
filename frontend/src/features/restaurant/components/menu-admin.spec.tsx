import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/restaurant/api/service', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    menuGetCategories: vi.fn(),
    menuGetItems: vi.fn(),
    menuCreateCategory: vi.fn(),
    menuUpdateCategory: vi.fn(),
    menuDeleteCategory: vi.fn(),
    menuCreateItem: vi.fn(),
    menuUpdateItem: vi.fn(),
    menuDeleteItem: vi.fn(),
  };
});

vi.mock('./category-form-sheet', () => ({
  default: ({ category, open, onOpenChange }: { category: any; open: boolean; onOpenChange: (v: boolean) => void }) =>
    open ? <div data-testid="category-form-sheet" /> : null,
}));

vi.mock('./menu-item-form-sheet', () => ({
  default: ({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (v: boolean) => void }) =>
    open ? <div data-testid="menu-item-form-sheet" /> : null,
}));

import { render, screen } from '../../../../tests/support/render-with-provider';
import MenuAdmin from './menu-admin';
import * as service from '@/features/restaurant/api/service';
import { Suspense } from 'react';

const mockCategories = [
  { id: 1, nameEn: 'Appetizers', nameKu: 'پێشەکی' },
  { id: 2, nameEn: 'Mains', nameKu: 'سەرەکی' },
];

const mockItems = [
  { id: 1, categoryId: 1, categoryNameEn: 'Appetizers', categoryNameKu: 'پێشەکی', nameEn: 'Spring Rolls', nameKu: 'سپرینگ ڕۆڵ', price: 8.5, available: true },
  { id: 2, categoryId: 2, categoryNameEn: 'Mains', categoryNameKu: 'سەرەکی', nameEn: 'Steak', nameKu: 'ستیك', price: 24, available: true },
  { id: 3, categoryId: 2, categoryNameEn: 'Mains', categoryNameKu: 'سەرەکی', nameEn: 'Burger', nameKu: 'بێرگەر', price: 15, available: false },
];

describe('MenuAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (service.menuGetCategories as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);
    (service.menuGetItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockItems);
  });

  it('renders categories and items', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><MenuAdmin /></Suspense>);

    expect(await screen.findByText('Appetizers')).toBeInTheDocument();
    expect(screen.getByText('پێشەکی')).toBeInTheDocument();
    expect(screen.getByText('Spring Rolls')).toBeInTheDocument();
    expect(screen.getByText('ستیك')).toBeInTheDocument();
  });

  it('shows unavailable items', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><MenuAdmin /></Suspense>);

    expect(await screen.findByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('بێرگەر')).toBeInTheDocument();
  });

  it('shows add buttons', async () => {
    render(<Suspense fallback={<div>Loading...</div>}><MenuAdmin /></Suspense>);

    expect(await screen.findByText('Add Category')).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });
});
