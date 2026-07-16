'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LocalDate from '@/components/ui/local-date';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/sonner';
import { Icons } from '@/components/icons';
import {
  keys,
  ordersAllOptions,
  useOrdersUpdateStatusMutation
} from '@/features/restaurant/api/queries';
import { getOrderHub, startOrderHub, OrderStatus } from '@/features/restaurant/lib/signalr-store';
import { parseRole } from '@/features/restaurant/lib/auth-store';
import { STATUS_CONFIG } from '@/features/restaurant/lib/order-status';
import { formatCurrency } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import type { OrderStatus as OrderStatusType } from '@/features/restaurant/api/types';

const ALL_STATUSES: OrderStatusType[] = ['pending', 'preparing', 'ready', 'served', 'cancelled'];

export function OrdersListing() {
  const { data: orders } = useSuspenseQuery(ordersAllOptions());
  const role = parseRole();
  const toast = useToast();
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<OrderStatusType | 'all'>('all');

  const qc = useQueryClient();
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
      hub.off('NewOrder', onNew);
      hub.off('OrderStatusChanged', onStatus);
    };
  }, [qc]);

  const filtered =
    filter === 'all' ? orders.items : orders.items.filter((o) => o.status === filter);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {filtered.length} of {orders.items.length} orders
        </p>
        <Select value={filter} onValueChange={(v) => setFilter(v as OrderStatusType | 'all')}>
          <SelectTrigger className='w-40'>
            <SelectValue placeholder={t.common.all} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t.common.all}</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t.orders.status[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className='border-0 ring-1 ring-border shadow-sm overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/30'>
              <TableHead className='font-semibold text-foreground/70'>{t.orders.orderNumber}</TableHead>
              <TableHead className='font-semibold text-foreground/70'>{t.orders.table}</TableHead>
              <TableHead className='font-semibold text-foreground/70'>{t.common.status}</TableHead>
              <TableHead className='font-semibold text-foreground/70'>{t.orders.items}</TableHead>
              <TableHead className='text-right font-semibold text-foreground/70'>{t.orders.total}</TableHead>
              <TableHead className='font-semibold text-foreground/70'>{t.orders.date}</TableHead>
              <TableHead className='font-semibold text-foreground/70'>{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id} className='border-b border-border/30'>
                <TableCell>
                  <span className='font-medium'>#{order.id}</span>
                </TableCell>
                <TableCell>
                  <span className='inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md text-xs font-medium'>
                    <Icons.table className='size-3.5' /> {t.orders.table} {order.tableNumber}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_CONFIG[order.status]?.variant ?? 'default'} className='capitalize shadow-xs'>
                    {t.orders.status[order.status]}
                  </Badge>
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
                <TableCell className='text-right font-semibold tabular-nums'>
                  {formatCurrency(order.items.reduce((s, i) => s + i.price * i.quantity, 0))}
                </TableCell>
                <TableCell className='text-xs text-muted-foreground'>
                  <LocalDate value={order.createdAt} />
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Link href={`/orders/${order.id}`}>
                      <Button size='icon' variant='ghost' className='h-8 w-8'>
                        <Icons.externalLink className='size-4' />
                      </Button>
                    </Link>
                    {role === 'Kitchen' && (
                      <>
                        {order.status === 'pending' && (
                          <Button
                            size='sm'
                            className='shadow-xs'
                            disabled={mutation.isPending}
                            onClick={() => {
                              mutation.mutate({ id: order.id, data: { status: 'preparing' } });
                              toast.success(
                                `${t.orders.orderNumber} ${order.id} — ${t.orders.status.preparing}`
                              );
                            }}
                          >
                            <Icons.clock className='mr-1 size-4' />
                            {t.orders.startPreparing}
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
                                `${t.orders.orderNumber} ${order.id} — ${t.orders.status.ready}`
                              );
                            }}
                          >
                            <Icons.check className='mr-1 size-4' />
                            {t.orders.markReady}
                          </Button>
                        )}
                      </>
                    )}
                    {(role === 'Waiter' || role === 'Admin') && order.status === 'ready' && (
                      <Button
                        size='sm'
                        variant='default'
                        className='shadow-xs'
                        disabled={mutation.isPending}
                        onClick={() => {
                          mutation.mutate({ id: order.id, data: { status: 'served' } });
                          toast.success(
                            `${t.orders.orderNumber} ${order.id} — ${t.orders.status.served}`
                          );
                        }}
                      >
                        <Icons.check className='mr-1 size-4' />
                        {t.orders.markServed}
                      </Button>
                    )}
                    {(role === 'Waiter' || role === 'Admin') &&
                      order.status !== 'cancelled' &&
                      order.status !== 'served' && (
                        <Button
                          size='sm'
                          variant='destructive'
                          className='shadow-xs'
                          disabled={mutation.isPending}
                          onClick={() => {
                            mutation.mutate({ id: order.id, data: { status: 'cancelled' } });
                            toast.error(
                              `${t.orders.orderNumber} ${order.id} — ${t.orders.status.cancelled}`
                            );
                          }}
                        >
                          <Icons.circleX className='mr-1 size-4' />
                          {t.common.cancel}
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-16 text-muted-foreground'>
                  <div className='flex flex-col items-center gap-3'>
                    <div className='flex size-12 items-center justify-center rounded-full bg-muted/50'>
                      <Icons.post className='size-6 opacity-40' />
                    </div>
                    <span className='font-medium text-sm'>{t.orders.noOrders}</span>
                    <span className='text-xs text-muted-foreground/60'>
                      {filter === 'all'
                        ? 'No orders have been created yet.'
                        : `No orders with status "${filter}" found.`}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
