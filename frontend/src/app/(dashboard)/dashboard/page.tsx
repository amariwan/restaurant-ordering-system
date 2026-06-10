import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import { ordersAllOptions, tablesAllOptions, menuItemsOptions, usersAllOptions } from '@/features/restaurant/api/queries';
import { requireRouteAccess } from '@/lib/auth/guard';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const DashboardOverview = dynamic(() => import('@/features/restaurant/components/dashboard-overview'));
const WaiterDashboard = dynamic(() => import('@/features/restaurant/components/waiter-dashboard'));
const KitchenBoard = dynamic(() => import('@/features/restaurant/components/kitchen-board'));

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await requireRouteAccess('/dashboard');
  if (!session) redirect('/login');

  const role = (session.user.role ?? '').toLowerCase();
  const qc = getQueryClient();

  if (role === 'admin') {
    await Promise.all([
      qc.prefetchQuery(ordersAllOptions()),
      qc.prefetchQuery(menuItemsOptions()),
      qc.prefetchQuery(tablesAllOptions),
      qc.prefetchQuery(usersAllOptions),
    ]);
    return (
      <PageContainer pageTitle='Dashboard' pageDescription='Overview and metrics for your restaurant'>
        <HydrationBoundary state={dehydrate(qc)}>
          <DashboardOverview />
        </HydrationBoundary>
      </PageContainer>
    );
  }

  if (role === 'kitchen') {
    await qc.prefetchQuery(ordersAllOptions());
    return (
      <PageContainer pageTitle='Kitchen' pageDescription='Realtime kitchen board for pending and preparing orders.'>
        <HydrationBoundary state={dehydrate(qc)}>
          <KitchenBoard />
        </HydrationBoundary>
      </PageContainer>
    );
  }

  // Waiter (default for authenticated staff)
  await Promise.all([
    qc.prefetchQuery(ordersAllOptions()),
    qc.prefetchQuery(tablesAllOptions),
  ]);
  return (
    <PageContainer pageTitle='Dashboard' pageDescription='Your active orders and table overview.'>
      <HydrationBoundary state={dehydrate(qc)}>
        <WaiterDashboard />
      </HydrationBoundary>
    </PageContainer>
  );
}
