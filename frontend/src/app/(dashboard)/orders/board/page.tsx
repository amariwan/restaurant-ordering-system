import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ordersAllOptions, tablesAllOptions } from '@/features/restaurant/api/queries';
import KanbanBoard from '@/features/restaurant/components/kanban-board';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export const metadata = { title: 'Kanban Board' };

export default async function KanbanBoardPage() {
  const qc = getQueryClient();
  await Promise.all([
    qc.prefetchQuery(ordersAllOptions()),
    qc.prefetchQuery(tablesAllOptions()),
  ]);

  return (
    <PageContainer
      pageTitle='Board'
      pageDescription='Drag-free Kanban board for order status management.'
    >
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<DataTableSkeleton columnCount={4} rowCount={4} />}>
          <KanbanBoard />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
