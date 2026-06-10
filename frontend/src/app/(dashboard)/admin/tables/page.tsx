'use client';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { tablesAllOptions } from '@/features/restaurant/api/queries';
import { TablesPage } from '@/features/restaurant/components/tables-page';
import { IconMapPin } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

export default function TablesRoutePage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tablesAllOptions);
  return (
    <PageContainer
      pageTitle='Tables'
      pageDescription='Manage restaurant table availability and assignments.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className='space-y-6'>
          <div className='flex items-center gap-3'>
            <IconMapPin className='w-6 h-6' />
          </div>
          <TablesPage />
        </div>
      </HydrationBoundary>
    </PageContainer>
  );
}
