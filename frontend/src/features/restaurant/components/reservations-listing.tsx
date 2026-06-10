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
import { formatDate } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
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
      <p className='text-muted-foreground py-8 text-center'>{t.reservations.noReservations}</p>
    );
  }

  return (
    <div className='grid gap-4'>
      {data.items.map((r) => (
        <Card key={r.id}>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg'>{r.customerName}</CardTitle>
              <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm'>
              <div>
                <span className='text-muted-foreground'>{t.reservations.guestCount}:</span>{' '}
                {r.guestCount}
              </div>
              <div>
                <span className='text-muted-foreground'>{t.reservations.dateTime}:</span>{' '}
                {formatDate(r.reservationTime)}
              </div>
              <div>
                <span className='text-muted-foreground'>{t.orders.table}:</span>{' '}
                {r.tableNumber || t.reservations.unassigned}
              </div>
              <div>
                <span className='text-muted-foreground'>{t.reservations.customerEmail}:</span>{' '}
                {r.customerEmail}
              </div>
              {r.customerPhone && (
                <div>
                  <span className='text-muted-foreground'>{t.reservations.phone ?? 'Phone'}:</span>{' '}
                  {r.customerPhone}
                </div>
              )}
              {r.note && (
                <div className='col-span-full'>
                  <span className='text-muted-foreground'>{t.reservations.note}:</span> {r.note}
                </div>
              )}
            </div>
            <div className='flex gap-2 mt-4'>
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
                className='text-destructive ml-auto'
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
