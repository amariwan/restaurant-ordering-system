'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/sonner';
import { IconPlus, IconGrillFork, IconPhoto } from '@tabler/icons-react';
import { useState } from 'react';
import {
  menuItemsOptions,
  menuCategoriesOptions,
  useOrdersAddItemMutation
} from '@/features/restaurant/api/queries';
import { useCartStore } from '@/features/restaurant/lib/cart-store';
import { useI18n } from '@/lib/i18n/context';
import { localizedValue } from '@/lib/i18n/helpers';

export function MenuListing({
  categoryId: initialCategoryId,
  orderId,
  tableId: initialTableId
}: {
  categoryId?: number;
  orderId?: number;
  tableId?: number;
}) {
  const { data: categories } = useSuspenseQuery(menuCategoriesOptions);
  const { data: items } = useSuspenseQuery(
    menuItemsOptions(initialCategoryId ? { categoryId: initialCategoryId } : undefined)
  );
  const addItemToCart = useCartStore((s) => s.addItem);
  const cartTableId = useCartStore((s) => s.tableId);
  const setTableId = useCartStore((s) => s.setTableId);
  const addToOrder = useOrdersAddItemMutation();
  const toast = useToast();
  const { t, locale } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId ?? null);
  const [imageError, setImageError] = useState<Set<number>>(new Set());

  const resolvedTableId = initialTableId ?? cartTableId;

  const filtered = items.items
    .filter((i) => i.available)
    .filter((i) => (selectedCategory ? i.categoryId === selectedCategory : true));

  return (
    <div className='flex flex-col lg:flex-row gap-6'>
      <aside className='w-full lg:w-48 shrink-0 space-y-2'>
        <h2 className='text-sm font-medium text-muted-foreground mb-2'>{t.menu.categories}</h2>
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size='sm'
          className='w-full justify-start'
          onClick={() => setSelectedCategory(null)}
        >
          <IconGrillFork className='mr-2 w-4 h-4' />
          {t.common.all}
        </Button>
        {categories.map((c) => (
          <Button
            key={c.id}
            variant={selectedCategory === c.id ? 'default' : 'outline'}
            size='sm'
            className='w-full justify-start'
            onClick={() => setSelectedCategory(c.id)}
          >
            {localizedValue(c, 'name', locale)}
          </Button>
        ))}
      </aside>

      <section className='flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filtered.map((item) => (
          <Card key={item.id} className='overflow-hidden hover:shadow-md transition-shadow'>
            <CardHeader className='p-0'>
              <div className='relative overflow-hidden h-40 bg-muted'>
                {imageError.has(item.id) || !item.imageUrl ? (
                  <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
                    <IconPhoto className='w-8 h-8' />
                  </div>
                ) : (
                  <Image
                    fill
                    src={item.imageUrl}
                    alt={localizedValue(item, 'name', locale)}
                    className='object-cover'
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                    onError={() => setImageError((prev) => new Set(prev).add(item.id))}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <h3 className='text-base font-medium'>{localizedValue(item, 'name', locale)}</h3>
                <div className='text-sm text-muted-foreground'>
                  {localizedValue(item, 'categoryName', locale)}
                </div>
                {localizedValue(item, 'description', locale) && (
                  <p className='text-xs text-muted-foreground mt-1'>
                    {localizedValue(item, 'description', locale)}
                  </p>
                )}
              </div>
              <div className='flex items-center justify-between'>
                <Badge variant={item.available ? 'default' : 'secondary'}>
                  {item.available ? t.common.available : t.common.unavailable}
                </Badge>
                <div className='font-semibold'>{formatCurrency(item.price)}</div>
              </div>
              <div className='flex justify-end'>
                <Button
                  size='sm'
                  disabled={!item.available || addToOrder.isPending}
                  isLoading={addToOrder.isPending}
                  onClick={() => {
                    if (orderId) {
                      addToOrder.mutate(
                        { orderId, data: { menuItemId: item.id, quantity: 1 } },
                        {
                          onSuccess: () =>
                            toast.success(
                              `${localizedValue(item, 'name', locale)} ${t.menu.addedToOrder} #${orderId}`
                            ),
                          onError: () => toast.error(t.common.failed)
                        }
                      );
                    } else {
                      addItemToCart({
                        menuItemId: item.id,
                        menuItemName: item.nameEn,
                        menuItemNameKu: item.nameKu,
                        price: item.price,
                        quantity: 1
                      });
                      if (resolvedTableId) setTableId(resolvedTableId);
                      toast.success(
                        `${localizedValue(item, 'name', locale)} ${t.menu.addedToCart}`
                      );
                    }
                  }}
                >
                  <IconPlus className='mr-1 w-4 h-4' />
                  {orderId ? t.menu.addToOrder : t.menu.add}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className='col-span-full text-center py-12 text-muted-foreground'>
            {t.menu.noItems}
          </div>
        )}
      </section>
    </div>
  );
}
