'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/sonner';
import {
  Kanban,
  KanbanBoard as KanbanBoardDnd,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay,
} from '@/components/ui/kanban';
import { ordersAllOptions, tablesAllOptions, useOrdersUpdateStatusMutation, keys } from '../api/queries';
import { getOrderHub, startOrderHub } from '../lib/signalr-store';
import { parseRole } from '../lib/auth-store';
import { STATUS_CONFIG } from '../lib/order-status';
import { formatCurrency } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import { Icons } from '@/components/icons';
import LocalDate from '@/components/ui/local-date';
import type { Order, OrderStatus as OrderStatusType, PaginatedResponse, Table } from '../api/types';
import type { DragEndEvent } from '@dnd-kit/core';

const COLUMNS: OrderStatusType[] = ['pending', 'preparing', 'ready', 'served'];

const TRANSITION_RULES: Record<
  OrderStatusType,
  { next: OrderStatusType; allowedRoles: string[] }
> = {
  pending: { next: 'preparing', allowedRoles: ['Kitchen', 'Admin'] },
  preparing: { next: 'ready', allowedRoles: ['Kitchen', 'Admin'] },
  ready: { next: 'served', allowedRoles: ['Waiter', 'Admin'] },
  served: { next: 'served' as OrderStatusType, allowedRoles: [] },
  cancelled: { next: 'cancelled' as OrderStatusType, allowedRoles: [] },
};

function isTransitionAllowed(
  current: OrderStatusType,
  target: OrderStatusType,
  role: string | null
): boolean {
  if (!role) return false;
  const rule = TRANSITION_RULES[current];
  if (!rule || rule.allowedRoles.length === 0) return false;
  return target === rule.next && rule.allowedRoles.includes(role);
}

const COLUMN_ICONS: Record<OrderStatusType, keyof typeof Icons> = {
  pending: 'clock',
  preparing: 'chefHat',
  ready: 'circleCheck',
  served: 'check',
  cancelled: 'close',
};

function groupOrders(data: PaginatedResponse<Order>) {
  return COLUMNS.reduce(
    (acc, status) => {
      acc[status] = data.items.filter((o) => o.status === status);
      return acc;
    },
    {} as Record<string, Order[]>
  );
}

export default function KanbanBoard() {
  const { data: orders } = useSuspenseQuery(ordersAllOptions());
  const { data: tables } = useSuspenseQuery(tablesAllOptions());
  const role = parseRole();
  const qc = useQueryClient();
  const mutation = useOrdersUpdateStatusMutation();
  const toast = useToast();
  const { t, locale } = useI18n();

  const [tableFilter, setTableFilter] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = orders.items;
    if (tableFilter !== 'all') {
      list = list.filter((o) => o.tableId === tableFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toString().includes(q) ||
          o.items.some((i) => i.menuItemName.toLowerCase().includes(q))
      );
    }
    return { ...orders, items: list };
  }, [orders, tableFilter, search]);

  const [columns, setColumns] = useState<Record<string, Order[]>>(() =>
    groupOrders(filtered)
  );

  useEffect(() => {
    setColumns(groupOrders(filtered));
  }, [filtered]);

  useEffect(() => {
    const hub = getOrderHub();
    const invalidate = () => qc.invalidateQueries({ queryKey: keys.orders.all });
    hub.on('NewOrder', invalidate);
    hub.on('OrderStatusChanged', invalidate);
    Promise.resolve(startOrderHub()).catch(() => {});
    return () => {
      try {
        hub.off('NewOrder', invalidate);
        hub.off('OrderStatusChanged', invalidate);
      } catch {}
    };
  }, [qc]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const orderId = Number(active.id);
      if (isNaN(orderId)) return;

      let targetStatus: OrderStatusType | null = null;

      if (COLUMNS.includes(over.id as OrderStatusType)) {
        targetStatus = over.id as OrderStatusType;
      } else {
        for (const col of Object.keys(columns)) {
          const items = columns[col];
          if (items && items.some((o) => o.id === Number(over.id))) {
            targetStatus = col as OrderStatusType;
            break;
          }
        }
      }

      if (!targetStatus) return;

      let order: Order | undefined;
      for (const col of Object.values(columns)) {
        order = col.find((o) => o.id === orderId);
        if (order) break;
      }

      if (!order || order.status === targetStatus) return;

      if (!isTransitionAllowed(order.status, targetStatus, role)) {
        toast.error(t.errors.forbidden);
        qc.invalidateQueries({ queryKey: keys.orders.all });
        return;
      }

      mutation.mutate(
        { id: orderId, data: { status: targetStatus } },
        {
          onError: () => {
            toast.error(t.common.error);
            qc.invalidateQueries({ queryKey: keys.orders.all });
          },
        }
      );
    },
    [columns, role, mutation, qc, toast, t]
  );

  return (
    <Kanban
      value={columns}
      onValueChange={setColumns}
      getItemValue={(order: Order) => order.id}
      onDragEnd={handleDragEnd}
    >
      <div className='flex items-center gap-3 mb-4'>
        <div className='relative flex-1 max-w-sm'>
          <Icons.search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search order # or item...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-8 h-9'
          />
        </div>
        <Select
          value={String(tableFilter)}
          onValueChange={(v) => setTableFilter(v === 'all' ? 'all' : Number(v))}
        >
          <SelectTrigger className='w-36 h-9'>
            <SelectValue placeholder='All tables' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All tables</SelectItem>
            {tables.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                Table {t.number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className='text-sm text-muted-foreground ml-auto'>
          {filtered.items.length} of {orders.items.length} orders
        </p>
      </div>
      <KanbanBoardDnd asChild>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {COLUMNS.map((status) => {
            const items = columns[status] ?? [];
            const cfg = STATUS_CONFIG[status];
            const iconKey = COLUMN_ICONS[status];
            const IconComp = Icons[iconKey];

            return (
              <KanbanColumn
                key={status}
                value={status}
                className='flex flex-col gap-3 !border-0 !bg-transparent !p-0'
              >
                <div className='flex items-center gap-2 px-1'>
                  <div
                    className={`flex size-7 items-center justify-center rounded-md ${
                      status === 'pending'
                        ? 'bg-amber-500/10 text-amber-600'
                        : status === 'preparing'
                          ? 'bg-blue-500/10 text-blue-600'
                          : status === 'ready'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <IconComp className='size-4' />
                  </div>
                  <h3 className='text-sm font-semibold capitalize'>{cfg.label}</h3>
                  <Badge variant='secondary' className='ml-auto tabular-nums'>
                    {items.length}
                  </Badge>
                </div>

                <div className='flex flex-col gap-2 min-h-[200px]'>
                  {items.length === 0 && (
                    <div className='flex items-center justify-center rounded-lg border-2 border-dashed border-border/50 p-6 text-center'>
                      <span className='text-xs text-muted-foreground/60'>
                        No orders
                      </span>
                    </div>
                  )}
                  {items.map((order) => (
                    <KanbanItem key={order.id} value={order.id} asHandle>
                      <Card className='border-0 ring-1 ring-border shadow-sm'>
                        <CardHeader className='flex flex-row items-center justify-between gap-2 p-3 pb-0'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-semibold'>
                              #{order.id}
                            </span>
                            <span className='inline-flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5 text-xs font-medium text-muted-foreground'>
                              <Icons.table className='size-3' />{' '}
                              {order.tableNumber}
                            </span>
                          </div>
                          <LocalDate value={order.createdAt} />
                        </CardHeader>
                        <CardContent className='p-3 pt-2'>
                          <p className='line-clamp-2 text-xs text-muted-foreground'>
                            {order.items
                              .map(
                                (i) =>
                                  `${locale === 'ku' && i.menuItemNameKu ? i.menuItemNameKu : i.menuItemName} x${i.quantity}`
                              )
                              .join(', ')}
                          </p>
                          <div className='mt-2 flex items-center justify-between'>
                            <span className='text-sm font-semibold tabular-nums'>
                              {formatCurrency(
                                order.items.reduce(
                                  (s, i) => s + i.price * i.quantity,
                                  0
                                )
                              )}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </KanbanItem>
                  ))}
                </div>
              </KanbanColumn>
            );
          })}
        </div>
      </KanbanBoardDnd>
      <KanbanOverlay>
        {({ value }) => {
          const order = Object.values(columns)
            .flat()
            .find((o) => o.id === Number(value));
          if (!order) return null;
          return (
            <Card className='border-0 ring-1 ring-border shadow-lg opacity-90'>
              <CardHeader className='flex flex-row items-center justify-between gap-2 p-3 pb-0'>
                <span className='text-sm font-semibold'>#{order.id}</span>
              </CardHeader>
              <CardContent className='p-3 pt-2'>
                <p className='text-xs text-muted-foreground'>
                  {order.items.map((i) => i.menuItemName).join(', ')}
                </p>
                <p className='mt-1 text-sm font-semibold tabular-nums'>
                  {formatCurrency(
                    order.items.reduce((s, i) => s + i.price * i.quantity, 0)
                  )}
                </p>
              </CardContent>
            </Card>
          );
        }}
      </KanbanOverlay>
    </Kanban>
  );
}
