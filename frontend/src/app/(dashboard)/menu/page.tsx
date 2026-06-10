'use client';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useSearchParams } from 'next/navigation';
import { menuCategoriesOptions, menuItemsOptions } from '@/features/restaurant/api/queries';
import { MenuListing } from '@/features/restaurant/components/menu-listing';
import { IconGrillFork } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

export default function MenuPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ? Number(searchParams.get('orderId')) : undefined;
  const tableId = searchParams.get('tableId') ? Number(searchParams.get('tableId')) : undefined;
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(menuCategoriesOptions);
  void queryClient.prefetchQuery(menuItemsOptions());
  return (
    <PageContainer
      pageTitle={orderId ? `Menu — Add to Order #${orderId}` : 'Menu'}
      pageDescription={
        orderId
          ? 'Select items to add directly to the order.'
          : 'Browse available menu items and categories.'
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className='space-y-6'>
          <div className='flex items-center gap-3'>
            <IconGrillFork className='w-6 h-6' />
          </div>
          <MenuListing orderId={orderId} tableId={tableId} />
        </div>
      </HydrationBoundary>
    </PageContainer>
  );
}
