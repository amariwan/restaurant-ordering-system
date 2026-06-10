'use client';

import React, { useEffect } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useToast } from '@/components/ui/sonner';
import { IconClock, IconCircleCheck } from '@tabler/icons-react';
import { ordersAllOptions, useOrdersUpdateStatusMutation, keys } from '../api/queries';
import { getOrderHub, startOrderHub, OrderStatus } from '../lib/signalr-store';
import LocalDate from '@/components/ui/local-date';
import { useI18n } from '@/lib/i18n/context';

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

  const kitchenOrders = orders.items.filter((o) => o.status === 'pending' || o.status === 'preparing');

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <h3 className='text-lg font-semibold'>{t.kitchen.title}</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.orders.orderNumber}</TableHead>
                <TableHead>{t.orders.table}</TableHead>
                <TableHead>{t.orders.items}</TableHead>
                <TableHead>{t.orders.date}</TableHead>
                <TableHead>{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kitchenOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{t.orders.table} {order.tableNumber}</TableCell>
                  <TableCell className='text-muted-foreground truncate max-w-48'>
                    {order.items.map((i) => `${locale === 'ku' && i.menuItemNameKu ? i.menuItemNameKu : i.menuItemName} x${i.quantity}`).join(', ')}
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'><LocalDate value={order.createdAt} /></TableCell>
                  <TableCell>
                    <div className='flex gap-2'>
                      {order.status === 'pending' && (
                        <Button
                          size='sm'
                          disabled={mutation.isPending}
                          onClick={() => {
                            mutation.mutate({ id: order.id, data: { status: 'preparing' } });
                            toast.success(`${t.orders.orderNumber}${order.id} ${t.kitchen.markPreparing}`);
                          }}
                        >
                          <IconClock className='mr-1 w-4 h-4' /> {t.kitchen.markPreparing}
                        </Button>
                      )}

                      {order.status === 'preparing' && (
                        <Button
                          size='sm'
                          variant='secondary'
                          disabled={mutation.isPending}
                          onClick={() => {
                            mutation.mutate({ id: order.id, data: { status: 'ready' } });
                            toast.success(`${t.orders.orderNumber}${order.id} ${t.orders.status.ready}`);
                          }}
                        >
                          <IconCircleCheck className='mr-1 w-4 h-4' /> {t.kitchen.markReady}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {kitchenOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                    {t.kitchen.noOrders}
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
