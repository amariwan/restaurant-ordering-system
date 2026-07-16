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
  const { data: tables } = useSuspenseQuery(tablesAllOptions());

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
      <div className='grid grid-cols-2 gap-5 md:grid-cols-4'>
        <Card className='border-0 ring-1 ring-border shadow-sm'>
          <CardContent className='pt-6'>
            <div className='flex items-start justify-between'>
              <div className='space-y-1'>
                <p className='text-xs font-medium text-muted-foreground/70 uppercase tracking-wide'>{t.admin.todaySummary}</p>
                <p className='text-3xl font-bold tracking-tight tabular-nums'>{todayOrders.length}</p>
              </div>
              <div className='rounded-xl bg-primary/10 p-3 ring-1 ring-primary/10'>
                <Icons.post className='size-5 text-primary' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 ring-1 ring-border shadow-sm'>
          <CardContent className='pt-6'>
            <div className='flex items-start justify-between'>
              <div className='space-y-1'>
                <p className='text-xs font-medium text-muted-foreground/70 uppercase tracking-wide'>
                  {t.orders.status.pending} / {t.orders.status.preparing}
                </p>
                <p className='text-3xl font-bold tracking-tight tabular-nums'>{active}</p>
              </div>
              <div className='rounded-xl bg-yellow-100 p-3 ring-1 ring-yellow-200'>
                <Icons.clock className='size-5 text-yellow-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 ring-1 ring-border shadow-sm'>
          <CardContent className='pt-6'>
            <div className='flex items-start justify-between'>
              <div className='space-y-1'>
                <p className='text-xs font-medium text-muted-foreground/70 uppercase tracking-wide'>{t.orders.status.ready}</p>
                <p className='text-3xl font-bold tracking-tight tabular-nums'>{ready}</p>
              </div>
              <div className='rounded-xl bg-green-100 p-3 ring-1 ring-green-200'>
                <Icons.check className='size-5 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 ring-1 ring-border shadow-sm'>
          <CardContent className='pt-6'>
            <div className='flex items-start justify-between'>
              <div className='space-y-1'>
                <p className='text-xs font-medium text-muted-foreground/70 uppercase tracking-wide'>{t.admin.activeTables}</p>
                <p className='text-3xl font-bold tracking-tight tabular-nums'>
                  {occupied} <span className='text-lg font-normal text-muted-foreground'>/ {tables.length}</span>
                </p>
              </div>
              <div className='rounded-xl bg-primary/10 p-3 ring-1 ring-primary/10'>
                <Icons.table className='size-5 text-primary' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='flex gap-3'>
        <Button asChild className='shadow-sm'>
          <Link href='/menu'>
            <Icons.pizza className='me-2 size-4' />
            {t.orders.createOrder}
          </Link>
        </Button>
        <Button variant='outline' asChild className='shadow-xs'>
          <Link href='/orders'>
            <Icons.post className='me-2 size-4' />
            {t.orders.title}
          </Link>
        </Button>
      </div>

      <Card className='border-0 ring-1 ring-border shadow-sm'>
        <CardHeader>
          <CardTitle className='text-base'>{t.admin.recentActivity}</CardTitle>
          <CardDescription>{t.admin.recentOrdersDesc}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-0.5 text-sm'>
          {recent.length === 0 && (
            <p className='text-muted-foreground py-8 text-center'>{t.orders.noOrders}</p>
          )}
          {recent.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className='flex items-center justify-between gap-2 py-2.5 border-b border-border/50 last:border-b-0 hover:bg-muted/60 -mx-2 px-2 rounded-lg transition-colors'
            >
              <div className='flex items-center gap-2 min-w-0'>
                <span className='font-medium truncate'>
                  #{o.id}
                </span>
                <span className='text-muted-foreground shrink-0'>
                  {t.orders.table} {o.tableNumber}
                </span>
              </div>
              <Badge variant={STATUS_CONFIG[o.status]?.variant ?? 'secondary'} className='shrink-0 capitalize'>
                {t.orders.status[o.status]}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>


    </div>
  );
}
