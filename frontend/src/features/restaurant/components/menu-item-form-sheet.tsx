'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { useSuspenseQuery } from '@tanstack/react-query';
import { menuCategoriesOptions } from '../api/queries';
import type { MenuItem } from '../api/types';
import { useMenuCreateItemMutation, useMenuUpdateItemMutation } from '../api/queries';
import * as service from '../api/service';
import { useI18n } from '@/lib/i18n/context';
import { localizedValue } from '@/lib/i18n/helpers';

interface Props {
  item?: MenuItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MenuItemFormSheet({ item, open, onOpenChange }: Props) {
  const isEdit = !!item;
  const { data: categories } = useSuspenseQuery(menuCategoriesOptions);
  const { t, locale } = useI18n();
  const [categoryId, setCategoryId] = useState<number | null>(item?.categoryId ?? (categories[0]?.id ?? null));
  const [nameEn, setNameEn] = useState(item?.nameEn ?? '');
  const [nameKu, setNameKu] = useState(item?.nameKu ?? '');
  const [price, setPrice] = useState(item?.price ?? 0);
  const [available, setAvailable] = useState(item?.available ?? true);
  const [descriptionEn, setDescriptionEn] = useState(item?.descriptionEn ?? '');
  const [descriptionKu, setDescriptionKu] = useState(item?.descriptionKu ?? '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const createMutation = useMenuCreateItemMutation();
  const updateMutation = useMenuUpdateItemMutation();

  useEffect(() => {
    if (item) {
      setCategoryId(item.categoryId);
      setNameEn(item.nameEn);
      setNameKu(item.nameKu);
      setPrice(item.price);
      setAvailable(item.available);
      setDescriptionEn(item.descriptionEn ?? '');
      setDescriptionKu(item.descriptionKu ?? '');
      setImageUrl(item.imageUrl ?? '');
    } else if (categories && categories.length > 0) {
      setCategoryId(categories[0].id);
      setNameEn('');
      setNameKu('');
      setPrice(0);
      setAvailable(true);
      setDescriptionEn('');
      setDescriptionKu('');
      setImageUrl('');
    }
  }, [item, open, categories]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await service.menuUploadImage(file);
      setImageUrl(res.url);
      toast.success(t.common.success);
    } catch (err: any) {
      toast.error(err?.message ?? t.common.failed);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!nameEn.trim() || !nameKu.trim()) return toast.error(t.errors.required);
      if (!categoryId) return toast.error(t.errors.required);

      const payload = {
        categoryId,
        nameEn: nameEn.trim(),
        nameKu: nameKu.trim(),
        price: Number(price),
        available,
        descriptionEn: descriptionEn || undefined,
        descriptionKu: descriptionKu || undefined,
        imageUrl: imageUrl || undefined
      } as const;

      if (isEdit && item) {
        await updateMutation.mutateAsync({ id: item.id, data: payload });
        toast.success(t.common.success);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t.common.success);
      }

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? t.common.failed);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right'>
        <SheetHeader>
          <SheetTitle>{isEdit ? t.menu.editItem : t.menu.addItem}</SheetTitle>
          <SheetDescription>{isEdit ? 'Update item details.' : 'Create a new menu item.'}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4 pt-2'>
          <div>
            <label className='mb-1 block text-sm font-medium'>{t.menu.category}</label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className='w-full rounded-md border border-input px-3 py-2 bg-transparent'
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {localizedValue(c, 'name', locale)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium'>{t.menu.nameEn}</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className='w-full rounded-md border border-input px-3 py-2 bg-transparent' placeholder='e.g. Margherita Pizza' />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium'>{t.menu.nameKu}</label>
            <input value={nameKu} onChange={(e) => setNameKu(e.target.value)} className='w-full rounded-md border border-input px-3 py-2 bg-transparent' placeholder='بۆ نموونە پیتزای مارگەریتا' />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium'>{t.menu.descriptionEn}</label>
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={2}
              className='w-full rounded-md border border-input px-3 py-2 bg-transparent resize-none'
              placeholder='e.g. Fresh mozzarella, basil, tomato sauce'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium'>{t.menu.descriptionKu}</label>
            <textarea
              value={descriptionKu}
              onChange={(e) => setDescriptionKu(e.target.value)}
              rows={2}
              className='w-full rounded-md border border-input px-3 py-2 bg-transparent resize-none'
              placeholder='بۆ نموونە مۆزاریێڵای تازە، ڕیحان، سۆسی تەماتە'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium'>{t.menu.price}</label>
            <input type='number' step='0.01' value={price} onChange={(e) => setPrice(Number(e.target.value))} className='w-full rounded-md border border-input px-3 py-2 bg-transparent' />
          </div>

          <div className='flex items-center gap-3'>
            <input id='available' type='checkbox' checked={available} onChange={(e) => setAvailable(e.target.checked)} />
            <label htmlFor='available' className='text-sm'>{t.menu.available}</label>
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium'>{t.menu.image}</label>
            <input type='file' accept='image/*' onChange={handleUpload} className='w-full' />
            {imageUrl && (
              <div className='mt-2'>
                <img src={imageUrl} alt='preview' className='h-28 w-full object-cover rounded-md' />
              </div>
            )}
          </div>

          <SheetFooter>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => onOpenChange(false)} type='button'>
                {t.common.cancel}
              </Button>
              <Button type='submit' isLoading={createMutation.isPending || updateMutation.isPending || uploading}>
                {isEdit ? t.common.update : t.common.create}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function MenuItemFormSheetTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Item</Button>
      <MenuItemFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
