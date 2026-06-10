'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/sonner';
import { useReservationsCreateMutation, useReservationsUpdateMutation } from '../api/queries';
import type { Reservation } from '../api/types';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  reservation?: Reservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReservationFormSheet({ reservation, open, onOpenChange }: Props) {
  const isEdit = !!reservation;
  const toast = useToast();
  const { t } = useI18n();
  const createMutation = useReservationsCreateMutation();
  const updateMutation = useReservationsUpdateMutation();

  const [customerName, setCustomerName] = useState(reservation?.customerName ?? '');
  const [customerEmail, setCustomerEmail] = useState(reservation?.customerEmail ?? '');
  const [customerPhone, setCustomerPhone] = useState(reservation?.customerPhone ?? '');
  const [guestCount, setGuestCount] = useState(reservation?.guestCount ?? 2);
  const [reservationTime, setReservationTime] = useState(
    reservation?.reservationTime ? reservation.reservationTime.slice(0, 16) : ''
  );
  const [note, setNote] = useState(reservation?.note ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isEdit && reservation) {
        await updateMutation.mutateAsync({
          id: reservation.id,
          data: {
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            customerPhone: customerPhone.trim() || undefined,
            guestCount,
            reservationTime: new Date(reservationTime).toISOString(),
            note: note.trim() || undefined
          }
        });
        toast.success(t.reservations.updated ?? 'Reservation updated');
      } else {
        await createMutation.mutateAsync({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
          guestCount,
          reservationTime: new Date(reservationTime).toISOString(),
          note: note.trim() || undefined
        });
        toast.success(t.reservations.created ?? 'Reservation created');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right'>
        <SheetHeader>
          <SheetTitle>{isEdit ? t.reservations.editTitle : t.reservations.newTitle}</SheetTitle>
          <SheetDescription>{t.reservations.formDescription}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4 pt-4'>
          <div className='grid gap-2'>
            <Label htmlFor='name'>{t.reservations.customerName}</Label>
            <Input
              id='name'
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='email'>{t.reservations.customerEmail}</Label>
            <Input
              id='email'
              type='email'
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='phone'>{t.reservations.phone ?? 'Phone'}</Label>
            <Input
              id='phone'
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='guests'>{t.reservations.guestCount}</Label>
            <Input
              id='guests'
              type='number'
              min={1}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='time'>{t.reservations.dateTime}</Label>
            <Input
              id='time'
              type='datetime-local'
              value={reservationTime}
              onChange={(e) => setReservationTime(e.target.value)}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='note'>{t.reservations.note}</Label>
            <Input id='note' value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <SheetFooter className='pt-4'>
            <Button variant='outline' onClick={() => onOpenChange(false)} type='button'>
              {t.common.cancel}
            </Button>
            <Button type='submit' isLoading={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? t.common.update : t.common.create}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function ReservationFormSheetTrigger() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <>
      <Button onClick={() => setOpen(true)}>{t.reservations.makeReservation}</Button>
      <ReservationFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
