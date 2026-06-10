import PageContainer from '@/components/layout/page-container';
import MenuAdmin from '@/features/restaurant/components/menu-admin';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { menuCategoriesOptions, menuItemsOptions } from '@/features/restaurant/api/queries';

export const metadata = {
  title: 'Dashboard: Manage Menu'
};

export default function MenuManagePage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(menuCategoriesOptions);
  void queryClient.prefetchQuery(menuItemsOptions());

  return (
    <PageContainer
      pageTitle='Manage Menu'
      pageDescription='Create, update and delete menu categories and items.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MenuAdmin />
      </HydrationBoundary>
    </PageContainer>
  );
}
