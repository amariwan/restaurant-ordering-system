'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  tablesAllOptions,
  menuCategoriesOptions,
  menuItemsOptions,
  useOrdersCreateMutation
} from '@/features/restaurant/api/queries';
import { useCartStore } from '@/features/restaurant/lib/cart-store';
import { useToast } from '@/components/ui/sonner';
import { useI18n } from '@/lib/i18n/context';
import { localizedValue } from '@/lib/i18n/helpers';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { IconGrillFork, IconPhoto, IconPlus, IconMinus, IconTrash } from '@tabler/icons-react';
import type { Table } from '@/features/restaurant/api/types';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

type Step = 'select-table' | 'menu' | 'success';

export default function SelfOrderPage() {
  const [step, setStep] = useState<Step>('select-table');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);

  const { t, locale: localeRaw } = useI18n();
  const locale = localeRaw as Locale;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  const st = (t as Record<string, any>).selfOrder as Record<string, string>;
  const toast = useToast();
  const mutation = useOrdersCreateMutation();

  const { data: tables, isLoading: tablesLoading } = useQuery(tablesAllOptions);
  const { data: categories } = useQuery(menuCategoriesOptions);
  const { data: menuData, isLoading: menuLoading } = useQuery(menuItemsOptions());

  const { items, addItem, clear, total, setTableId: setCartTableId } = useCartStore();

  const filteredItems = useMemo(() => {
    if (!menuData?.items) return [];
    return menuData.items
      .filter((i) => i.available)
      .filter((i) => (selectedCategory ? i.categoryId === selectedCategory : true));
  }, [menuData, selectedCategory]);

  const cartTotal = total();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  function handleSelectTable(table: Table) {
    setSelectedTable(table);
    setCartTableId(table.id);
    clear();
    setStep('menu');
  }

  function handlePlaceOrder() {
    if (!selectedTable) return;
    mutation.mutate(
      {
        tableId: selectedTable.id,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          note: i.note ?? ''
        }))
      },
      {
        onSuccess: (order) => {
          clear();
          setPlacedOrderId(order.id);
          setCartOpen(false);
          setStep('success');
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : t.common.failed);
        }
      }
    );
  }

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      {/* Header */}
      <header className='sticky top-0 z-40 border-b bg-background/95 backdrop-blur'>
        <div className='mx-auto flex h-14 max-w-7xl items-center justify-between px-4'>
          <div className='flex items-center gap-3'>
            <IconGrillFork className='size-5 text-primary' />
            <span className='text-base font-semibold'>Restaurant</span>
            {selectedTable && step === 'menu' && (
              <>
                <Separator orientation='vertical' className='h-4' />
                <Badge variant='outline' className='gap-1 text-xs'>
                  <Icons.table className='size-3' />
                  {st.yourTable} {selectedTable.number}
                </Badge>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 px-2 text-xs text-muted-foreground'
                  onClick={() => {
                    clear();
                    setSelectedTable(null);
                    setStep('select-table');
                  }}
                >
                  {st.changeTable}
                </Button>
              </>
            )}
          </div>

          <div className='flex items-center gap-2'>
            <LanguageSwitcher />
            {step === 'menu' && (
              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button variant='outline' size='sm' className='relative gap-2'>
                    <Icons.cart className='size-4' />
                    {itemCount > 0 && (
                      <span className='absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                        {itemCount}
                      </span>
                    )}
                    <span className='hidden sm:inline'>{t.cart.title}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side='right' className='flex w-full flex-col sm:max-w-sm'>
                  <SheetHeader className='pb-4'>
                    <SheetTitle className='flex items-center gap-2'>
                      <Icons.cart className='size-4' />
                      {t.cart.title}
                    </SheetTitle>
                  </SheetHeader>
                  <div className='flex-1 overflow-hidden'>
                    <CartContent
                      st={st}
                      t={t}
                      locale={locale}
                      cartTotal={cartTotal}
                      mutation={mutation}
                      handlePlaceOrder={handlePlaceOrder}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>

      <main className='mx-auto w-full max-w-7xl flex-1 px-4 py-6'>
        {/* ── Step 1: Table Selection ── */}
        {step === 'select-table' && (
          <div className='mx-auto max-w-2xl'>
            <div className='mb-8 text-center'>
              <h1 className='text-2xl font-bold tracking-tight'>{st.title}</h1>
              <p className='mt-2 text-muted-foreground'>{st.subtitle}</p>
            </div>

            <div className='mb-4'>
              <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
                {st.selectTable}
              </h2>
              <p className='mt-1 text-sm text-muted-foreground'>{st.selectTableDesc}</p>
            </div>

            {tablesLoading ? (
              <div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5'>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className='aspect-square animate-pulse rounded-xl bg-muted' />
                ))}
              </div>
            ) : (
              <div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5'>
                {(tables ?? []).map((table) => {
                  const isFree = table.status === 'free';
                  return (
                    <button
                      key={table.id}
                      disabled={!isFree}
                      onClick={() => handleSelectTable(table)}
                      className={cn(
                        'flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-center transition-all',
                        isFree
                          ? 'cursor-pointer border-border bg-card hover:border-primary hover:bg-primary/5 hover:shadow-md active:scale-95'
                          : 'cursor-not-allowed border-dashed border-muted bg-muted/30 opacity-60'
                      )}
                    >
                      <Icons.table
                        className={cn(
                          'size-6 mb-1',
                          isFree ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <span className='text-lg font-bold leading-none'>{table.number}</span>
                      <span
                        className={cn(
                          'mt-1 text-[10px] font-medium uppercase tracking-wide',
                          isFree ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                        )}
                      >
                        {isFree ? st.free : table.status === 'reserved' ? st.reserved : st.occupied}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Menu + Cart ── */}
        {step === 'menu' && (
          <>
            {/* ── Mobile layout ── */}
            <div className='lg:hidden'>
              {/* Horizontal category scroll */}
              <div className='mb-4 flex gap-2 overflow-x-auto pb-1'>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                    selectedCategory === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-muted border-border'
                  )}
                >
                  {t.common.all}
                </button>
                {(categories ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      'shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                      selectedCategory === c.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-muted border-border'
                    )}
                  >
                    {localizedValue(c, 'name', locale)}
                  </button>
                ))}
              </div>
              <MenuGrid
                items={filteredItems}
                isLoading={menuLoading}
                locale={locale}
                imageErrors={imageErrors}
                setImageErrors={setImageErrors}
                onAdd={(item) => {
                  addItem({
                    menuItemId: item.id,
                    menuItemName: item.nameEn,
                    menuItemNameKu: item.nameKu,
                    price: item.price,
                    quantity: 1
                  });
                  toast.success(`${localizedValue(item, 'name', locale)} ${t.menu.addedToCart}`);
                }}
                noItemsLabel={t.menu.noItems}
                addLabel={t.menu.add}
              />
            </div>

            {/* ── Desktop layout: category sidebar | menu grid | cart sidebar ── */}
            <div className='hidden lg:flex lg:gap-6'>
              <aside className='w-44 shrink-0 space-y-1.5'>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  {t.menu.categories}
                </p>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-1.5 text-left text-sm font-medium transition-colors',
                    selectedCategory === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-muted border-border'
                  )}
                >
                  {t.common.all}
                </button>
                {(categories ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-1.5 text-left text-sm font-medium transition-colors',
                      selectedCategory === c.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-muted border-border'
                    )}
                  >
                    {localizedValue(c, 'name', locale)}
                  </button>
                ))}
              </aside>

              <div className='min-w-0 flex-1'>
                <MenuGrid
                  items={filteredItems}
                  isLoading={menuLoading}
                  locale={locale}
                  imageErrors={imageErrors}
                  setImageErrors={setImageErrors}
                  onAdd={(item) => {
                    addItem({
                      menuItemId: item.id,
                      menuItemName: item.nameEn,
                      menuItemNameKu: item.nameKu,
                      price: item.price,
                      quantity: 1
                    });
                    toast.success(`${localizedValue(item, 'name', locale)} ${t.menu.addedToCart}`);
                  }}
                  noItemsLabel={t.menu.noItems}
                  addLabel={t.menu.add}
                />
              </div>

              <aside className='w-72 shrink-0'>
                <div className='sticky top-20 rounded-xl border bg-card p-4 shadow-sm'>
                  <div className='mb-4 flex items-center gap-2'>
                    <Icons.cart className='size-4 text-primary' />
                    <span className='font-semibold'>{t.cart.title}</span>
                    {itemCount > 0 && (
                      <Badge variant='secondary' className='ml-auto text-xs'>
                        {itemCount}
                      </Badge>
                    )}
                  </div>
                  <div
                    style={{ maxHeight: 'calc(100vh - 220px)' }}
                    className='flex flex-col overflow-hidden'
                  >
                    <CartContent
                      st={st}
                      t={t}
                      locale={locale}
                      cartTotal={cartTotal}
                      mutation={mutation}
                      handlePlaceOrder={handlePlaceOrder}
                    />
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        {/* ── Step 3: Success ── */}
        {step === 'success' && (
          <div className='mx-auto max-w-md py-16 text-center'>
            <div className='mb-6 flex justify-center'>
              <div className='flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                <Icons.circleCheck className='size-10 text-green-600 dark:text-green-400' />
              </div>
            </div>
            <h1 className='mb-2 text-2xl font-bold'>{st.orderSuccess}</h1>
            <p className='mb-2 text-muted-foreground'>{st.orderSuccessDesc}</p>
            {placedOrderId && (
              <p className='mb-8 text-sm font-medium'>
                {st.orderRef} #{placedOrderId}
              </p>
            )}
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
              {placedOrderId && (
                <Button asChild>
                  <Link href={`/orders/${placedOrderId}`}>{st.trackOrder}</Link>
                </Button>
              )}
              <Button
                variant='outline'
                onClick={() => {
                  setStep('select-table');
                  setSelectedTable(null);
                  setPlacedOrderId(null);
                  setSelectedCategory(null);
                }}
              >
                {st.newOrder}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Extracted menu grid to avoid duplication ──
interface MenuGridProps {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  isLoading: boolean;
  locale: Locale;
  imageErrors: Set<number>;
  setImageErrors: React.Dispatch<React.SetStateAction<Set<number>>>;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd: (item: any) => void;
  noItemsLabel: string;
  addLabel: string;
  _loadingLabel: string;
}

interface CartContentProps {
  st: Record<string, string>;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  locale: Locale;
  cartTotal: number;
  mutation: ReturnType<typeof useOrdersCreateMutation>;
  handlePlaceOrder: () => void;
}

function CartContent({ st, t, locale, cartTotal, mutation, handlePlaceOrder }: CartContentProps) {
  const { items, updateQuantity, removeItem, updateNote } = useCartStore();

  return (
    <div className='flex h-full flex-col'>
      {items.length === 0 ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground'>
          <Icons.cart className='size-10 opacity-30' />
          <p className='text-sm font-medium'>{st.cartEmpty}</p>
          <p className='text-xs'>{st.cartEmptyDesc}</p>
        </div>
      ) : (
        <>
          <ScrollArea className='flex-1'>
            <div className='space-y-3 p-1'>
              {items.map((item) => (
                <div key={item.menuItemId} className='rounded-lg border bg-card p-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium'>
                        {locale === 'ku' ? item.menuItemNameKu : item.menuItemName}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className='flex items-center gap-1 shrink-0'>
                      <Button
                        variant='outline'
                        size='icon'
                        className='h-6 w-6'
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                      >
                        <IconMinus className='size-3' />
                      </Button>
                      <span className='w-5 text-center text-sm'>{item.quantity}</span>
                      <Button
                        variant='outline'
                        size='icon'
                        className='h-6 w-6'
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                      >
                        <IconPlus className='size-3' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6 text-muted-foreground hover:text-destructive'
                        onClick={() => removeItem(item.menuItemId)}
                      >
                        <IconTrash className='size-3' />
                      </Button>
                    </div>
                  </div>
                  <Input
                    className='mt-2 h-7 text-xs'
                    placeholder={(t.cart as Record<string, string>).addNote}
                    value={item.note ?? ''}
                    onChange={(e) => updateNote(item.menuItemId, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className='border-t pt-4 space-y-3'>
            <div className='flex items-center justify-between text-sm font-semibold'>
              <span>{(t.cart as Record<string, string>).total}</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <Button
              className='w-full'
              size='lg'
              disabled={items.length === 0 || mutation.isPending}
              isLoading={mutation.isPending}
              onClick={handlePlaceOrder}
            >
              {(t.cart as Record<string, string>).placeOrder}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuGrid({
  items,
  isLoading,
  locale,
  imageErrors,
  setImageErrors,
  onAdd,
  noItemsLabel,
  addLabel,
  _loadingLabel
}: MenuGridProps) {
  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='animate-pulse rounded-xl bg-muted h-52' />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
        <IconGrillFork className='mb-3 size-10 opacity-30' />
        <p className='text-sm'>{noItemsLabel}</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {items.map((item) => (
        <Card key={item.id} className='overflow-hidden transition-shadow hover:shadow-md'>
          <div className='relative h-36 bg-muted'>
            {imageErrors.has(item.id) || !item.imageUrl ? (
              <div className='flex h-full items-center justify-center text-muted-foreground'>
                <IconPhoto className='size-8' />
              </div>
            ) : (
              <Image
                loading='lazy'
                src={item.imageUrl}
                alt={localizedValue(item, 'name', locale)}
                fill
                className='object-cover'
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                onError={() => setImageErrors((prev) => new Set(prev).add(item.id))}
              />
            )}
          </div>
          <CardContent className='p-3'>
            <h3 className='truncate text-sm font-semibold'>
              {localizedValue(item, 'name', locale)}
            </h3>
            <p className='text-xs text-muted-foreground'>
              {localizedValue(item, 'categoryName', locale)}
            </p>
            {localizedValue(item, 'description', locale) && (
              <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
                {localizedValue(item, 'description', locale)}
              </p>
            )}
            <div className='mt-3 flex items-center justify-between'>
              <span className='text-sm font-bold'>{formatCurrency(item.price)}</span>
              <Button size='sm' className='h-8 gap-1' onClick={() => onAdd(item)}>
                <IconPlus className='size-3' />
                {addLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
