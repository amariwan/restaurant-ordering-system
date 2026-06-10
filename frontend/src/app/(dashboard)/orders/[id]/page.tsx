'use client';

import { useParams } from 'next/navigation';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ordersDetailOptions, paymentsByOrderOptions } from '@/features/restaurant/api/queries';
import { OrderDetail } from '@/features/restaurant/components/order-detail';
import PageContainer from '@/components/layout/page-container';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(ordersDetailOptions(orderId));
  void queryClient.prefetchQuery(paymentsByOrderOptions(orderId));

  return (
    <PageContainer
      pageTitle='Order details'
      pageDescription='Review the full order summary, payment history, and kitchen status updates.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OrderDetail />
      </HydrationBoundary>
    </PageContainer>
  );
}
