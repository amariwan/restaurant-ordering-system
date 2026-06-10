'use client';

import React, { useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
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

export default function DashboardOverview() {
  const { t } = useI18n();
  const { data: orders } = useSuspenseQuery(ordersAllOptions());
  const { data: tables } = useSuspenseQuery(tablesAllOptions);
  const { data: users } = useSuspenseQuery(usersAllOptions);

  // compute totals & aggregates
  const totals = useMemo(() => {
    const ordersByStatus: Record<string, number> = {};
    let revenue = 0;
    const itemCounts: Record<string, number> = {};
    const daily: Record<string, number> = {};

    for (const o of orders.items) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;

      const subtotal = o.items.reduce((s, it) => s + it.price * it.quantity, 0);
      // consider served and ready as revenue-contributing
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
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.totalOrders}</CardTitle>
            <CardDescription>{t.admin.totalOrders}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totals.ordersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.admin.totalRevenue}</CardTitle>
            <CardDescription />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(totals.revenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.admin.activeTables}</CardTitle>
            <CardDescription>
              {t.tables.status.occupied} / {t.common.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {totals.occupied} / {totals.tablesCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.admin.totalUsers}</CardTitle>
            <CardDescription>{t.users.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totals.usersCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.recentActivity}</CardTitle>
            <CardDescription />
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={totals.dailySeries}>
                  <XAxis dataKey='date' />
                  <YAxis />
                  <Tooltip />
                  <Line type='monotone' dataKey='value' stroke={COLORS[0]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t.orders.title} {t.common.status}
            </CardTitle>
            <CardDescription />
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={totals.statusSeries}
                    dataKey='value'
                    nameKey='name'
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {totals.statusSeries.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.menu.title}</CardTitle>
            <CardDescription>{t.menu.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={totals.topItems} layout='vertical'>
                  <XAxis type='number' />
                  <YAxis type='category' dataKey='name' width={140} />
                  <Tooltip />
                  <Bar dataKey='qty' fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
