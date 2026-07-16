import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { tablesAllOptions } from '@/features/restaurant/api/queries';
import { TablesPage } from '@/features/restaurant/components/tables-page';
import PageContainer from '@/components/layout/page-container';

export default async function TablesRoutePage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tablesAllOptions());
  return (
    <PageContainer
      pageTitle='Tables'
      pageDescription='Visual floor plan with drag-to-position, table management, and availability tracking.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TablesPage />
      </HydrationBoundary>
    </PageContainer>
  );
}
