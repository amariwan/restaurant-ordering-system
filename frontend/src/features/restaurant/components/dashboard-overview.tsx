'use client';

import React, { useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { Icons } from '@/components/icons';
import { ordersAllOptions, tablesAllOptions, usersAllOptions } from '../api/queries';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useI18n } from '@/lib/i18n/context';

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

function StatCard({
  title,
  desc,
  value,
  icon: Icon,
  gradient
}: {
  title: string;
  desc: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}) {
  return (
    <Card className='border-0 ring-1 ring-border shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md'>
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between'>
          <div className='min-w-0'>
            <CardTitle className='text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider'>
              {title}
            </CardTitle>
            {desc && (
              <CardDescription className='text-xs mt-0.5 truncate'>{desc}</CardDescription>
            )}
          </div>
          <div className='rounded-lg bg-primary/10 p-2 ring-1 ring-primary/10 shrink-0'>
            <Icon className='w-4 h-4 text-primary' />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold tracking-tight tabular-nums sm:text-3xl'>{value}</div>
      </CardContent>
    </Card>
  );
}

export default function DashboardOverview() {
  const { t } = useI18n();
  const { data: orders } = useSuspenseQuery(ordersAllOptions());
  const { data: tables } = useSuspenseQuery(tablesAllOptions());
  const { data: users } = useSuspenseQuery(usersAllOptions);

  const totals = useMemo(() => {
    const ordersByStatus: Record<string, number> = {};
    let revenue = 0;
    const itemCounts: Record<string, number> = {};
    const daily: Record<string, number> = {};

    for (const o of orders.items) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;

      const subtotal = o.items.reduce((s, it) => s + it.price * it.quantity, 0);
      if (o.status === 'served' || o.status === 'ready') revenue += subtotal;

      const day = new Date(o.createdAt).toISOString().slice(0, 10);
      daily[day] = (daily[day] ?? 0) + subtotal;

      for (const it of o.items) {
        const name = it.menuItemNameKu || it.menuItemName;
        itemCounts[name] = (itemCounts[name] ?? 0) + it.quantity;
      }
    }

    const topItems = Object.entries(itemCounts)
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, qty]) => ({ name, qty }));

    const dailySeries = Object.entries(daily)
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    const statusSeries = Object.entries(ordersByStatus).map(([status, count], i) => ({
      name: status,
      value: count,
      color: COLORS[i % COLORS.length]
    }));

    const occupied = tables.filter((t) => t.status === 'occupied').length;

    return {
      ordersCount: orders.items.length,
      revenue,
      topItems,
      dailySeries,
      statusSeries,
      occupied,
      tablesCount: tables.length,
      usersCount: users.items.length
    };
  }, [orders, tables, users]);

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <StatCard
          title={t.admin.totalOrders}
          desc={''}
          value={totals.ordersCount}
          icon={Icons.post}
          gradient='from-blue-500/10 to-transparent'
        />
        <StatCard
          title={t.admin.totalRevenue}
          desc={''}
          value={formatCurrency(totals.revenue)}
          icon={Icons.creditCard}
          gradient='from-green-500/10 to-transparent'
        />
        <StatCard
          title={t.admin.activeTables}
          desc={`${t.tables.status.occupied} / ${t.common.total}`}
          value={`${totals.occupied} / ${totals.tablesCount}`}
          icon={Icons.table}
          gradient='from-amber-500/10 to-transparent'
        />
        <StatCard
          title={t.admin.totalUsers}
          desc={t.users.title}
          value={totals.usersCount}
          icon={Icons.teams}
          gradient='from-purple-500/10 to-transparent'
        />
      </div>

      <div className='grid grid-cols-1 gap-5 lg:grid-cols-3'>
        <Card className='border-0 ring-1 ring-border shadow-sm transition-shadow duration-300 hover:shadow-md'>
          <CardHeader>
            <CardTitle className='text-sm font-semibold'>{t.admin.recentActivity}</CardTitle>
            <CardDescription className='text-xs'>Daily revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={totals.dailySeries}>
                  <XAxis dataKey='date' tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  />
                  <Line
                    type='monotone'
                    dataKey='value'
                    stroke={COLORS[0]}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 ring-1 ring-border shadow-sm transition-shadow duration-300 hover:shadow-md'>
          <CardHeader>
            <CardTitle className='text-sm font-semibold'>
              {t.orders.title} {t.common.status}
            </CardTitle>
            <CardDescription className='text-xs'>Distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={totals.statusSeries}
                    dataKey='value'
                    nameKey='name'
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {totals.statusSeries.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    iconType='circle'
                    formatter={(value: string) => (
                      <span className='text-xs capitalize'>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 ring-1 ring-border shadow-sm transition-shadow duration-300 hover:shadow-md'>
          <CardHeader>
            <CardTitle className='text-sm font-semibold'>{t.menu.title}</CardTitle>
            <CardDescription className='text-xs'>Top items</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={totals.topItems} layout='vertical'>
                  <XAxis
                    type='number'
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type='category'
                    dataKey='name'
                    width={130}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  />
                  <Bar dataKey='qty' fill={COLORS[2]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
