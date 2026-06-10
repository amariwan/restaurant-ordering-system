'use client';

import { useState } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { reservationsAllOptions } from '@/features/restaurant/api/queries';
import { ReservationsListing } from '@/features/restaurant/components/reservations-listing';
import { ReservationFormSheetTrigger } from '@/features/restaurant/components/reservation-form-sheet';
import PageContainer from '@/components/layout/page-container';
import type { ReservationStatus } from '@/features/restaurant/api/types';

const ALL_STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function ReservationsPage() {
  const [status, setStatus] = useState('');
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(reservationsAllOptions());

  return (
    <PageContainer
      pageTitle='Reservations'
      pageDescription='Manage table reservations.'
      pageHeaderAction={<ReservationFormSheetTrigger />}
    >
      <div className='mb-6 flex items-center gap-3'>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className='w-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50'
        >
          <option value=''>All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ReservationsListing status={status ? (status as ReservationStatus) : undefined} />
      </HydrationBoundary>
    </PageContainer>
  );
}
