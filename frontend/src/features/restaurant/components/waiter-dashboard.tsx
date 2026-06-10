'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ordersAllOptions, tablesAllOptions } from '@/features/restaurant/api/queries';
import { STATUS_CONFIG } from '@/features/restaurant/lib/order-status';
import { useI18n } from '@/lib/i18n/context';
import Link from 'next/link';

export default function WaiterDashboard() {
  const { t } = useI18n();
  const { data: orders } = useSuspenseQuery(ordersAllOptions());
  const { data: tables } = useSuspenseQuery(tablesAllOptions);

  const today = new Date().toDateString();
  const todayOrders = orders.items.filter((o) => new Date(o.createdAt).toDateString() === today);
  const active = orders.items.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;
  const ready = orders.items.filter((o) => o.status === 'ready').length;
  const occupied = tables.filter((tbl) => tbl.status === 'occupied').length;

  const recent = [...orders.items]
    .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>{t.admin.todaySummary}</p>
                <p className='text-3xl font-bold mt-1'>{todayOrders.length}</p>
              </div>
              <Icons.post className='size-8 text-primary' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  {t.orders.status.pending} / {t.orders.status.preparing}
                </p>
                <p className='text-3xl font-bold mt-1'>{active}</p>
              </div>
              <Icons.clock className='size-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>{t.orders.status.ready}</p>
                <p className='text-3xl font-bold mt-1'>{ready}</p>
              </div>
              <Icons.check className='size-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>{t.admin.activeTables}</p>
                <p className='text-3xl font-bold mt-1'>
                  {occupied} / {tables.length}
                </p>
              </div>
              <Icons.table className='size-8 text-primary' />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='flex gap-3'>
        <Button asChild>
          <Link href='/menu'>
            <Icons.pizza className='me-2 size-4' />
            {t.orders.createOrder}
          </Link>
        </Button>
        <Button variant='outline' asChild>
          <Link href='/orders'>
            <Icons.post className='me-2 size-4' />
            {t.orders.title}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.recentActivity}</CardTitle>
          <CardDescription>{t.admin.recentOrdersDesc}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-1 text-sm'>
          {recent.length === 0 && (
            <p className='text-muted-foreground py-4 text-center'>{t.orders.noOrders}</p>
          )}
          {recent.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className='flex items-center justify-between gap-2 py-2 border-b last:border-b-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors'
            >
              <div>
                <span className='font-medium'>
                  {t.orders.orderNumber}
                  {o.id}
                </span>
                <span className='text-muted-foreground ml-2'>
                  {t.orders.table} {o.tableNumber}
                </span>
              </div>
              <Badge variant={STATUS_CONFIG[o.status]?.variant ?? 'secondary'}>
                {t.orders.status[o.status]}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
