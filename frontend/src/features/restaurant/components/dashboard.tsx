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
  const { data: tables } = useSuspenseQuery(tablesAllOptions);

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

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {STAT_CARDS.map((s, i) => (
          <Card key={i}>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>{s.title}</p>
                  <p className='text-3xl font-bold mt-1'>{s.value}</p>
                </div>
                <s.icon className='w-8 h-8 text-primary' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.todaySummary}</CardTitle>
          <CardDescription>
            {t.admin.ordersPlacedToday.replace('{count}', String(todayOrders))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-2 text-sm'>
            {todayOrders > 0 ? (
              <>
                <IconTrendingUp className='w-4 h-4 text-green-600' />
                <span className='text-green-600'>{t.admin.active}</span>
              </>
            ) : (
              <span className='text-muted-foreground'>{t.admin.noOrdersToday}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconUsers className='w-5 h-5' /> {t.admin.userBreakdown}
            </CardTitle>
            <CardDescription>{t.admin.roleDistribution}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>{t.users.roles.admin}</span>
              <Badge variant='default'>{adminUsers}</Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>{t.users.roles.waiter}</span>
              <Badge variant='secondary'>{waiterUsers}</Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>{t.users.roles.kitchen}</span>
              <Badge variant='outline'>{kitchenUsers}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconClipboard className='w-5 h-5' /> {t.admin.recentActivity}
            </CardTitle>
            <CardDescription>{t.admin.recentOrdersDesc}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-1 text-sm'>
            {orders.items
              .slice(-5)
              .toReversed()
              .map((o) => (
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
                  <Badge
                    variant={
                      o.status === 'cancelled'
                        ? 'destructive'
                        : o.status === 'ready'
                          ? 'secondary'
                          : 'secondary'
                    }
                  >
                    {o.status}
                  </Badge>
                </Link>
              ))}
            {orders.items.length === 0 && (
              <div className='text-sm text-muted-foreground py-4 text-center'>
                {t.admin.noOrdersYet}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
