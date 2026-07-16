'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
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
import { IconPencil, IconTrash, IconPhoto, IconGripVertical } from '@tabler/icons-react';
import { useToast } from '@/components/ui/sonner';
import {
  menuCategoriesOptions,
  menuItemsOptions,
  useMenuDeleteCategoryMutation,
  useMenuDeleteItemMutation,
  useMenuReorderCategoriesMutation,
  useMenuReorderItemsMutation
} from '../api/queries';
import CategoryFormSheet from './category-form-sheet';
import MenuItemFormSheet from './menu-item-form-sheet';
import type { Category, MenuItem, ReorderItemRequest } from '../api/types';
import { useI18n } from '@/lib/i18n/context';
import { localizedValue } from '@/lib/i18n/helpers';
import { cn } from '@/lib/utils';

function SortableCategoryRow({
  category,
  onEdit,
  onDelete
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50')}
    >
      <TableCell className='w-10'>
        <button
          {...attributes}
          {...listeners}
          className='cursor-grab touch-none hover:text-foreground text-muted-foreground'
          aria-label='Drag to reorder'
          suppressHydrationWarning
        >
          <IconGripVertical className='w-4 h-4' />
        </button>
      </TableCell>
      <TableCell>{category.id}</TableCell>
      <TableCell>{category.nameEn}</TableCell>
      <TableCell>{category.nameKu}</TableCell>
      <TableCell>
        <div className='flex gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(category)}
          >
            <IconPencil />
          </Button>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => onDelete(category)}
          >
            <IconTrash />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SortableItemRow({
  item,
  onEdit,
  onDelete
}: {
  item: MenuItem;
  onEdit: (i: MenuItem) => void;
  onDelete: (i: MenuItem) => void;
}) {
  const { t, locale } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50')}
    >
      <TableCell className='w-10'>
        <button
          {...attributes}
          {...listeners}
          className='cursor-grab touch-none hover:text-foreground text-muted-foreground'
          aria-label='Drag to reorder'
          suppressHydrationWarning
        >
          <IconGripVertical className='w-4 h-4' />
        </button>
      </TableCell>
      <TableCell>{item.id}</TableCell>
      <TableCell>
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={localizedValue(item, 'name', locale)}
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
      <TableCell>{item.nameEn}</TableCell>
      <TableCell>{item.nameKu}</TableCell>
      <TableCell>{localizedValue(item, 'categoryName', locale)}</TableCell>
      <TableCell>{formatCurrency(item.price)}</TableCell>
      <TableCell>{item.available ? t.common.available : t.common.unavailable}</TableCell>
      <TableCell>
        <div className='flex gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(item)}
          >
            <IconPencil />
          </Button>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => onDelete(item)}
          >
            <IconTrash />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function MenuAdmin() {
  const { data: categories } = useSuspenseQuery(menuCategoriesOptions);
  const { data: items } = useSuspenseQuery(menuItemsOptions());
  const toast = useToast();
  const { t } = useI18n();

  const deleteCategory = useMenuDeleteCategoryMutation();
  const deleteItem = useMenuDeleteItemMutation();
  const reorderCategories = useMenuReorderCategoriesMutation();
  const reorderItems = useMenuReorderItemsMutation();

  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [catSheetOpen, setCatSheetOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleCategoryDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(categories, oldIndex, newIndex);
      const payload: ReorderItemRequest[] = reordered.map((c, i) => ({
        id: c.id,
        sortOrder: i
      }));
      reorderCategories.mutate(payload, {
        onError: (err) => toast.error(err instanceof Error ? err.message : String(err))
      });
    },
    [categories, reorderCategories, toast]
  );

  const handleItemDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const itemList = items.items;
      const oldIndex = itemList.findIndex((i) => i.id === active.id);
      const newIndex = itemList.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(itemList, oldIndex, newIndex);
      const payload: ReorderItemRequest[] = reordered.map((i, idx) => ({
        id: i.id,
        sortOrder: idx
      }));
      reorderItems.mutate(payload, {
        onError: (err) => toast.error(err instanceof Error ? err.message : String(err))
      });
    },
    [items, reorderItems, toast]
  );

  const handleDeleteCategory = useCallback(
    async (c: Category) => {
      try {
        await deleteCategory.mutateAsync(c.id);
        toast.success(t.common.success);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [deleteCategory, toast, t]
  );

  const handleDeleteItem = useCallback(
    async (it: MenuItem) => {
      try {
        await deleteItem.mutateAsync(it.id);
        toast.success(t.common.success);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [deleteItem, toast, t]
  );

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);
  const itemIds = useMemo(() => items.items.map((i) => i.id), [items]);

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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10' />
                  <TableHead>ID</TableHead>
                  <TableHead>{t.menu.nameEn}</TableHead>
                  <TableHead>{t.menu.nameKu}</TableHead>
                  <TableHead>{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <SortableCategoryRow
                    key={c.id}
                    category={c}
                    onEdit={(cat) => {
                      setEditingCategory(cat);
                      setCatSheetOpen(true);
                    }}
                    onDelete={handleDeleteCategory}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleItemDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10' />
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
                  <SortableItemRow
                    key={it.id}
                    item={it}
                    onEdit={(item) => {
                      setEditingItem(item);
                      setItemSheetOpen(true);
                    }}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </section>

      <CategoryFormSheet
        category={editingCategory}
        open={catSheetOpen}
        onOpenChange={setCatSheetOpen}
      />

      <MenuItemFormSheet item={editingItem} open={itemSheetOpen} onOpenChange={setItemSheetOpen} />
    </div>
  );
}
