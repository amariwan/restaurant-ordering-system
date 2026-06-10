'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LocalDate from '@/components/ui/local-date';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/sonner';
import { Icons } from '@/components/icons';
import { keys, ordersAllOptions, useOrdersUpdateStatusMutation } from '@/features/restaurant/api/queries';
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

  const filtered = filter === 'all' ? orders.items : orders.items.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Select value={filter} onValueChange={(v) => setFilter(v as OrderStatusType | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t.common.all} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.all}</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t.orders.status[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.orders.orderNumber}</TableHead>
              <TableHead>{t.orders.table}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead>{t.orders.items}</TableHead>
              <TableHead className="text-right">{t.orders.total}</TableHead>
              <TableHead>{t.orders.date}</TableHead>
              <TableHead>{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <span className="font-medium">#{order.id}</span>
                </TableCell>
                <TableCell>{t.orders.table} {order.tableNumber}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_CONFIG[order.status]?.variant ?? 'default'}>
                    {t.orders.status[order.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground truncate max-w-48">
                  {order.items.map((i) => `${locale === 'ku' && i.menuItemNameKu ? i.menuItemNameKu : i.menuItemName} x${i.quantity}`).join(', ')}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.items.reduce((s, i) => s + i.price * i.quantity, 0))}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <LocalDate value={order.createdAt} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Icons.externalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                    {role === 'Kitchen' && (
                      <>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            disabled={mutation.isPending}
                            onClick={() => {
                              mutation.mutate({ id: order.id, data: { status: 'preparing' } });
                              toast.success(`${t.orders.orderNumber}${order.id} — ${t.orders.status.preparing}`);
                            }}
                          >
                            <Icons.clock className="mr-1 w-4 h-4" />
                            {t.orders.startPreparing}
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={mutation.isPending}
                            onClick={() => {
                              mutation.mutate({ id: order.id, data: { status: 'ready' } });
                              toast.success(`${t.orders.orderNumber}${order.id} — ${t.orders.status.ready}`);
                            }}
                          >
                            <Icons.circleCheck className="mr-1 w-4 h-4" />
                            {t.orders.markReady}
                          </Button>
                        )}
                      </>
                    )}
                    {(role === 'Waiter' || role === 'Admin') && order.status !== 'cancelled' && order.status !== 'served' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={mutation.isPending}
                        onClick={() => {
                          mutation.mutate({ id: order.id, data: { status: 'cancelled' } });
                          toast.error(`${t.orders.orderNumber}${order.id} — ${t.orders.status.cancelled}`);
                        }}
                      >
                        <Icons.circleX className="mr-1 w-4 h-4" />
                        {t.common.cancel}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t.orders.noOrders}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
