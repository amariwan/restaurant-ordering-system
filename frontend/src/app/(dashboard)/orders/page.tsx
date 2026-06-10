import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ordersAllOptions } from '@/features/restaurant/api/queries';
import { OrdersListing } from '@/features/restaurant/components/orders-listing';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export const metadata = { title: 'Orders' };

export default async function OrdersPage() {
  const qc = getQueryClient();
  await qc.prefetchQuery(ordersAllOptions());

  return (
    <PageContainer
      pageTitle='Orders'
      pageDescription='View and manage restaurant orders with live status updates.'
    >
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={8} />}>
          <OrdersListing />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
