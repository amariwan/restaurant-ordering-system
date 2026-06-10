import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import DashboardOverview from '@/features/restaurant/components/dashboard-overview';
import { ordersAllOptions } from '@/features/restaurant/api/queries';
import { requireRouteAccess } from '@/lib/auth/guard';

export const metadata = {
  title: 'Dashboard Overview'
};

export default async function Dashboard() {
  await requireRouteAccess('/admin');
  const qc = getQueryClient();
  await qc.prefetchQuery(ordersAllOptions());

  return (
    <PageContainer pageTitle='Dashboard' pageDescription='Overview and metrics for your restaurant'>
      <HydrationBoundary state={dehydrate(qc)}>
        {/* DashboardOverview is a client component */}
        <DashboardOverview />
      </HydrationBoundary>
    </PageContainer>
  );
}
