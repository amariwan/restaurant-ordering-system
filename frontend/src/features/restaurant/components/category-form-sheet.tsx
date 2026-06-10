'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/sonner';
import type { Category } from '../api/types';
import { useMenuCreateCategoryMutation, useMenuUpdateCategoryMutation } from '../api/queries';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  category?: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CategoryFormSheet({ category, open, onOpenChange }: Props) {
  const isEdit = !!category;
  const [nameEn, setNameEn] = useState(category?.nameEn ?? '');
  const [nameKu, setNameKu] = useState(category?.nameKu ?? '');
  const toast = useToast();
  const { t } = useI18n();

  const createMutation = useMenuCreateCategoryMutation();
  const updateMutation = useMenuUpdateCategoryMutation();

  useEffect(() => {
    if (category) {
      setNameEn(category.nameEn);
      setNameKu(category.nameKu);
    } else {
      setNameEn('');
      setNameKu('');
    }
  }, [category, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!nameEn.trim() || !nameKu.trim()) {
        toast.error(t.errors.required);
        return;
      }

      if (isEdit && category) {
        await updateMutation.mutateAsync({ id: category.id, data: { nameEn: nameEn.trim(), nameKu: nameKu.trim() } });
        toast.success(t.common.success);
      } else {
        await createMutation.mutateAsync({ nameEn: nameEn.trim(), nameKu: nameKu.trim() });
        toast.success(t.common.success);
        setNameEn('');
        setNameKu('');
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
          <SheetTitle>{isEdit ? t.menu.editCategory : t.menu.addCategory}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update category names.' : 'Create a new menu category.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4 pt-2'>
          <div>
            <label className='mb-1 block text-sm font-medium'>{t.menu.categoryNameEn}</label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className='w-full rounded-md border border-input px-3 py-2 bg-transparent'
              placeholder='e.g. Starters'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium'>{t.menu.categoryNameKu}</label>
            <input
              value={nameKu}
              onChange={(e) => setNameKu(e.target.value)}
              className='w-full rounded-md border border-input px-3 py-2 bg-transparent'
              placeholder='بۆ نموونە پێشەکی'
            />
          </div>

          <SheetFooter>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => onOpenChange(false)} type='button'>
                {t.common.cancel}
              </Button>
              <Button type='submit' isLoading={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? t.common.update : t.common.create}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function CategoryFormSheetTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Category</Button>
      <CategoryFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
