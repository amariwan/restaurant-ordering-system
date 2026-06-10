import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import KitchenBoard from '@/features/restaurant/components/kitchen-board';
import { ordersAllOptions } from '@/features/restaurant/api/queries';
import { requireRouteAccess } from '@/lib/auth/guard';

export const metadata = {
  title: 'Dashboard: Kitchen'
};

export default async function KitchenPage() {
  await requireRouteAccess('/kitchen');
  const qc = getQueryClient();
  await qc.prefetchQuery(ordersAllOptions());

  return (
    <PageContainer
      pageTitle='Kitchen'
      pageDescription='Realtime kitchen board for pending and preparing orders.'
    >
      <HydrationBoundary state={dehydrate(qc)}>
        <KitchenBoard />
      </HydrationBoundary>
    </PageContainer>
  );
}
