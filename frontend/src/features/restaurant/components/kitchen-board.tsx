'use client';

import React, { useEffect } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/sonner';
import { ordersAllOptions, useOrdersUpdateStatusMutation, keys } from '../api/queries';
import { getOrderHub, startOrderHub, OrderStatus } from '../lib/signalr-store';
import LocalDate from '@/components/ui/local-date';
import { useI18n } from '@/lib/i18n/context';
import { Icons } from '@/components/icons';

const STATUS_BADGE: Record<string, 'warning' | 'info' | 'success'> = {
  pending: 'warning',
  preparing: 'info',
  ready: 'success'
};

export default function KitchenBoard() {
  const qc = useQueryClient();
  const { data: orders } = useSuspenseQuery(ordersAllOptions());
  const toast = useToast();
  const { t, locale } = useI18n();

  const mutation = useOrdersUpdateStatusMutation();

  useEffect(() => {
    const hub = getOrderHub();

    const onNew = () => {
      qc.invalidateQueries({ queryKey: keys.orders.all });
    };

    const onStatus = (_payload: { orderId: number; status: OrderStatus }) => {
      qc.invalidateQueries({ queryKey: keys.orders.all });
    };

    hub.on('NewOrder', onNew);
    hub.on('OrderStatusChanged', onStatus);

    Promise.resolve(startOrderHub()).catch(() => {});

    return () => {
      try {
        hub.off('NewOrder', onNew);
        hub.off('OrderStatusChanged', onStatus);
      } catch {}
    };
  }, [qc]);

  const kitchenOrders = orders.items.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  );

  return (
    <div className='space-y-6'>
      <Card className='border-0 ring-1 ring-border shadow-sm overflow-hidden'>
        <CardHeader className='border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20'>
              <Icons.chefHat className='size-5' />
            </div>
            <div>
              <h3 className='text-base font-semibold'>{t.kitchen.title}</h3>
              <p className='text-xs text-muted-foreground'>
                {kitchenOrders.length} active {kitchenOrders.length === 1 ? 'order' : 'orders'}
              </p>
            </div>
          </div>
          <Badge
            variant={kitchenOrders.length > 0 ? 'default' : 'secondary'}
            className='tabular-nums'
          >
            {kitchenOrders.length}
          </Badge>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/30'>
                <TableHead className='font-semibold text-foreground/70'>
                  {t.orders.orderNumber}
                </TableHead>
                <TableHead className='font-semibold text-foreground/70'>
                  {t.orders.table}
                </TableHead>
                <TableHead className='font-semibold text-foreground/70'>
                  {t.orders.items}
                </TableHead>
                <TableHead className='font-semibold text-foreground/70'>
                  {t.orders.date}
                </TableHead>
                <TableHead className='font-semibold text-foreground/70'>
                  {t.common.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kitchenOrders.map((order) => (
                <TableRow key={order.id} className='border-b border-border/30'>
                  <TableCell className='font-medium'>#{order.id}</TableCell>
                  <TableCell>
                    <span className='inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md text-xs font-medium'>
                      <Icons.table className='size-3.5' /> {t.orders.table} {order.tableNumber}
                    </span>
                  </TableCell>
                  <TableCell className='text-muted-foreground max-w-48 text-sm'>
                    <span className='line-clamp-2'>
                      {order.items
                        .map(
                          (i) =>
                            `${locale === 'ku' && i.menuItemNameKu ? i.menuItemNameKu : i.menuItemName} x${i.quantity}`
                        )
                        .join(', ')}
                    </span>
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    <LocalDate value={order.createdAt} />
                  </TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      {order.status === 'pending' && (
                        <Button
                          size='sm'
                          className='shadow-xs'
                          disabled={mutation.isPending}
                          onClick={() => {
                            mutation.mutate({ id: order.id, data: { status: 'preparing' } });
                            toast.success(
                              `${t.orders.orderNumber} ${order.id} ${t.kitchen.markPreparing}`
                            );
                          }}
                        >
                          <Icons.clock className='mr-1 size-4' /> {t.kitchen.markPreparing}
                        </Button>
                      )}

                      {order.status === 'preparing' && (
                        <Button
                          size='sm'
                          variant='secondary'
                          className='shadow-xs'
                          disabled={mutation.isPending}
                          onClick={() => {
                            mutation.mutate({ id: order.id, data: { status: 'ready' } });
                            toast.success(
                              `${t.orders.orderNumber} ${order.id} ${t.orders.status.ready}`
                            );
                          }}
                        >
                          <Icons.check className='mr-1 size-4' /> {t.kitchen.markReady}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {kitchenOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className='text-center py-16 text-muted-foreground'>
                    <div className='flex flex-col items-center gap-3'>
                      <div className='flex size-12 items-center justify-center rounded-full bg-muted/50'>
                        <Icons.chefHat className='size-6 opacity-40' />
                      </div>
                      <span className='font-medium text-sm'>{t.kitchen.noOrders}</span>
                      <span className='text-xs text-muted-foreground/60'>
                        All caught up! New orders will appear here in real time.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
