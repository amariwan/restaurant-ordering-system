'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  IconClipboard,
  IconClock,
  IconCircleCheck,
  IconGrillFork,
  IconUsers,
  IconTrendingUp
} from '@tabler/icons-react';
import Link from 'next/link';
import {
  ordersAllOptions,
  usersAllOptions,
  tablesAllOptions
} from '@/features/restaurant/api/queries';
import { useI18n } from '@/lib/i18n/context';

export function RestaurantDashboard() {
  const { t } = useI18n();
  const { data: orders } = useSuspenseQuery(ordersAllOptions());
  const { data: users } = useSuspenseQuery(usersAllOptions);
  const { data: tables } = useSuspenseQuery(tablesAllOptions());

  const pending = orders.items.filter((o) => ['pending', 'preparing'].includes(o.status)).length;
  const ready = orders.items.filter((o) => o.status === 'ready').length;
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const kitchenUsers = users.items.filter((u) => u.role === 'Kitchen').length;
  const waiterUsers = users.items.filter((u) => u.role === 'Waiter').length;
  const adminUsers = users.items.filter((u) => u.role === 'Admin').length;
  const todayOrders = orders.items.filter((o) => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const STAT_CARDS = [
    { icon: IconClipboard, title: t.admin.totalOrders, value: orders.items.length },
    { icon: IconClock, title: t.orders.status.pending, value: pending },
    { icon: IconCircleCheck, title: t.orders.status.ready, value: ready },
    { icon: IconGrillFork, title: t.admin.activeTables, value: occupiedTables }
  ];

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl font-semibold mb-2'>{t.admin.title}</h1>
        <p className='text-muted-foreground'>{t.admin.overviewSubtitle}</p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
        {STAT_CARDS.map((s, i) => (
          <Card key={i} className='border-0 ring-1 ring-border shadow-sm hover:shadow-md transition-all duration-200'>
            <CardContent className='pt-6'>
              <div className='flex items-start justify-between'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground/70 tracking-wide uppercase'>{s.title}</p>
                  <p className='text-3xl font-bold tracking-tight tabular-nums'>{s.value}</p>
                </div>
                <div className='rounded-xl bg-primary/10 p-3 ring-1 ring-primary/10'>
                  <s.icon className='w-5 h-5 text-primary' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
        <Card className='border-0 ring-1 ring-border shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <div className='rounded-lg bg-green-100 p-1.5'>
                <IconTrendingUp className='w-4 h-4 text-green-600' />
              </div>
              {t.admin.todaySummary}
            </CardTitle>
            <CardDescription>
              {t.admin.ordersPlacedToday.replace('{count}', String(todayOrders))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2 text-sm'>
              {todayOrders > 0 ? (
                <>
                  <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-primary transition-all duration-500'
                      style={{ width: `${Math.min((todayOrders / (orders.items.length || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className='text-green-600 font-medium shrink-0 tabular-nums'>{todayOrders}</span>
                </>
              ) : (
                <span className='text-muted-foreground'>{t.admin.noOrdersToday}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 ring-1 ring-border shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <div className='rounded-lg bg-blue-100 p-1.5'>
                <IconUsers className='w-4 h-4 text-blue-600' />
              </div>
              {t.admin.userBreakdown}
            </CardTitle>
            <CardDescription>{t.admin.roleDistribution}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {[
              { label: t.users.roles.admin, count: adminUsers, variant: 'default' as const, color: 'bg-primary' },
              { label: t.users.roles.waiter, count: waiterUsers, variant: 'secondary' as const, color: 'bg-blue-500' },
              { label: t.users.roles.kitchen, count: kitchenUsers, variant: 'outline' as const, color: 'bg-amber-500' }
            ].map(({ label, count, color }) => (
              <div key={label} className='flex items-center justify-between gap-3 py-1.5'>
                <span className='text-muted-foreground'>{label}</span>
                <div className='flex items-center gap-2'>
                  <div className='h-1.5 w-24 rounded-full bg-muted overflow-hidden'>
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${users.items.length ? (count / users.items.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className='font-semibold tabular-nums text-foreground w-6 text-right'>{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className='border-0 ring-1 ring-border shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <div className='rounded-lg bg-amber-100 p-1.5'>
                <IconClipboard className='w-4 h-4 text-amber-600' />
              </div>
              {t.admin.recentActivity}
            </CardTitle>
            <CardDescription>{t.admin.recentOrdersDesc}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-0.5 text-sm'>
            {orders.items
              .slice(-5)
              .toReversed()
              .map((o) => (
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
                  <Badge
                    variant={
                      o.status === 'cancelled'
                        ? 'destructive'
                        : o.status === 'ready'
                          ? 'default'
                          : 'secondary'
                    }
                    className='shrink-0 capitalize'
                  >
                    {o.status}
                  </Badge>
                </Link>
              ))}
            {orders.items.length === 0 && (
              <div className='text-sm text-muted-foreground py-6 text-center'>
                {t.admin.noOrdersYet}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
