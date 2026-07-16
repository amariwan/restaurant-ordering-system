'use client';

import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import {
  reservationsAllOptions,
  useReservationsUpdateStatusMutation,
  useReservationsDeleteMutation
} from '../api/queries';
import { keys } from '../api/queries';
import type { ReservationStatus } from '../api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';

const STATUS_STYLES: Record<ReservationStatus, {badge: string; indicator: string}> = {
  pending: { badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', indicator: 'bg-yellow-400' },
  confirmed: { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', indicator: 'bg-blue-500' },
  completed: { badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', indicator: 'bg-green-500' },
  cancelled: { badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400', indicator: 'bg-gray-400' }
};

export function ReservationsListing({
  status,
  date
}: {
  status?: ReservationStatus;
  date?: string;
}) {
  const { t } = useI18n();
  const { data } = useSuspenseQuery(reservationsAllOptions({ status, date }));
  const qc = useQueryClient();
  const updateStatus = useReservationsUpdateStatusMutation();
  const deleteReservation = useReservationsDeleteMutation();

  const handleStatusChange = async (id: number, newStatus: ReservationStatus) => {
    await updateStatus.mutateAsync({ id, data: { status: newStatus } });
    qc.invalidateQueries({ queryKey: keys.reservations.all });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t.reservations.confirmDelete)) {
      await deleteReservation.mutateAsync(id);
    }
  };

  if (data.items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='rounded-full bg-muted p-4 mb-4'>
          <Icons.calendar className='w-8 h-8 text-muted-foreground/50' />
        </div>
        <p className='text-muted-foreground font-medium'>{t.reservations.noReservations}</p>
      </div>
    );
  }

  return (
    <div className='grid gap-4'>
      {data.items.map((r) => (
        <Card key={r.id} className='border-0 ring-1 ring-border shadow-sm overflow-hidden'>
          <div className={`h-1 ${STATUS_STYLES[r.status].indicator}`} />
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm'>
                  {r.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className='text-base font-semibold'>{r.customerName}</CardTitle>
                  <span className='text-xs text-muted-foreground'>{r.customerEmail}</span>
                </div>
              </div>
              <Badge className={STATUS_STYLES[r.status].badge + ' capitalize shadow-xs'}>{r.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
              <div className='bg-muted/30 rounded-lg p-2.5'>
                <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide block'>{t.reservations.guestCount}</span>
                <span className='font-semibold text-lg tabular-nums'>{r.guestCount}</span>
              </div>
              <div className='bg-muted/30 rounded-lg p-2.5'>
                <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide block'>{t.reservations.dateTime}</span>
                <span className='font-medium text-sm'>{formatDate(r.reservationTime)}</span>
              </div>
              <div className='bg-muted/30 rounded-lg p-2.5'>
                <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide block'>{t.orders.table}</span>
                <span className='font-medium text-sm'>{r.tableNumber || t.reservations.unassigned}</span>
              </div>
              <div className='bg-muted/30 rounded-lg p-2.5'>
                <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide block'>{t.reservations.customerEmail}</span>
                <span className='font-medium text-sm truncate block'>{r.customerEmail}</span>
              </div>
              {r.customerPhone && (
                <div className='bg-muted/30 rounded-lg p-2.5'>
                  <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide block'>{t.reservations.phone ?? 'Phone'}</span>
                  <span className='font-medium text-sm'>{r.customerPhone}</span>
                </div>
              )}
              {r.note && (
                <div className='col-span-full bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 ring-1 ring-amber-200/50 dark:ring-amber-500/20'>
                  <span className='text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide block mb-0.5'>{t.reservations.note}</span>
                  <span className='text-sm text-amber-800 dark:text-amber-300'>{r.note}</span>
                </div>
              )}
            </div>
            <div className='flex gap-2 mt-4 pt-3 border-t border-border/50'>
              {r.status === 'pending' && r.tableId && (
                <Button size='sm' onClick={() => handleStatusChange(r.id, 'confirmed')}>
                  {t.reservations.confirmStatus ?? 'Confirm'}
                </Button>
              )}
              {r.status === 'confirmed' && (
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => handleStatusChange(r.id, 'completed')}
                >
                  {t.reservations.complete ?? 'Complete'}
                </Button>
              )}
              {(r.status === 'pending' || r.status === 'confirmed') && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleStatusChange(r.id, 'cancelled')}
                >
                  {t.common.cancel}
                </Button>
              )}
              <Button
                size='sm'
                variant='ghost'
                className='text-destructive ml-auto hover:bg-destructive/10'
                onClick={() => handleDelete(r.id)}
              >
                {t.common.delete}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
