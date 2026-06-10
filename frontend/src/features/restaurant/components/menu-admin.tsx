'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { IconPencil, IconTrash, IconPhoto } from '@tabler/icons-react';
import { useToast } from '@/components/ui/sonner';
import {
  menuCategoriesOptions,
  menuItemsOptions,
  useMenuDeleteCategoryMutation,
  useMenuDeleteItemMutation
} from '../api/queries';
import CategoryFormSheet from './category-form-sheet';
import MenuItemFormSheet from './menu-item-form-sheet';
import type { Category, MenuItem } from '../api/types';
import { useI18n } from '@/lib/i18n/context';
import { localizedValue } from '@/lib/i18n/helpers';

export default function MenuAdmin() {
  const { data: categories } = useSuspenseQuery(menuCategoriesOptions);
  const { data: items } = useSuspenseQuery(menuItemsOptions());
  const toast = useToast();
  const { t, locale } = useI18n();

  const deleteCategory = useMenuDeleteCategoryMutation();
  const deleteItem = useMenuDeleteItemMutation();

  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [catSheetOpen, setCatSheetOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);

  return (
    <div className='space-y-6'>
      <section>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>{t.menu.categories}</h2>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => {
                setEditingCategory(undefined);
                setCatSheetOpen(true);
              }}
            >
              {t.menu.addCategory}
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t.menu.nameEn}</TableHead>
              <TableHead>{t.menu.nameKu}</TableHead>
              <TableHead>{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.nameEn}</TableCell>
                <TableCell>{c.nameKu}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setEditingCategory(c);
                        setCatSheetOpen(true);
                      }}
                    >
                      <IconPencil />
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={async () => {
                        try {
                          await deleteCategory.mutateAsync(c.id);
                          toast.success(t.common.success);
                        } catch (err: unknown) {
                          toast.error(err instanceof Error ? err.message : String(err));
                        }
                      }}
                    >
                      <IconTrash />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>{t.menu.title}</h2>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => {
                setEditingItem(undefined);
                setItemSheetOpen(true);
              }}
            >
              {t.menu.addItem}
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t.menu.image}</TableHead>
              <TableHead>{t.menu.nameEn}</TableHead>
              <TableHead>{t.menu.nameKu}</TableHead>
              <TableHead>{t.menu.category}</TableHead>
              <TableHead>{t.menu.price}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead>{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.id}</TableCell>
                <TableCell>
                  {it.imageUrl ? (
                    <Image
                      src={it.imageUrl}
                      alt={localizedValue(it, 'name', locale)}
                      width={80}
                      height={48}
                      className='h-12 w-20 object-cover rounded-md'
                    />
                  ) : (
                    <div className='h-12 w-20 flex items-center justify-center bg-muted rounded-md'>
                      <IconPhoto />
                    </div>
                  )}
                </TableCell>
                <TableCell>{it.nameEn}</TableCell>
                <TableCell>{it.nameKu}</TableCell>
                <TableCell>{localizedValue(it, 'categoryName', locale)}</TableCell>
                <TableCell>{formatCurrency(it.price)}</TableCell>
                <TableCell>{it.available ? t.common.available : t.common.unavailable}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setEditingItem(it);
                        setItemSheetOpen(true);
                      }}
                    >
                      <IconPencil />
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={async () => {
                        try {
                          await deleteItem.mutateAsync(it.id);
                          toast.success(t.common.success);
                        } catch (err: unknown) {
                          toast.error(err instanceof Error ? err.message : String(err));
                        }
                      }}
                    >
                      <IconTrash />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Sheets */}
      {/** Category sheet **/}
      <CategoryFormSheet
        category={editingCategory}
        open={catSheetOpen}
        onOpenChange={setCatSheetOpen}
      />

      {/** Item sheet **/}
      <MenuItemFormSheet item={editingItem} open={itemSheetOpen} onOpenChange={setItemSheetOpen} />
    </div>
  );
}
