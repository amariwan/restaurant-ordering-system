import React from 'react';
import { Heading } from '../ui/heading';
import type { InfobarContent } from '@/components/ui/infobar';

function PageSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-5 p-4 md:px-6'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <div className='bg-muted h-7 w-44 animate-pulse rounded-md' />
          <div className='bg-muted h-4 w-72 animate-pulse rounded-md' />
        </div>
      </div>
      <div className='grid grid-cols-1 gap-5 md:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='bg-muted h-28 animate-pulse rounded-xl' />
        ))}
      </div>
      <div className='bg-muted h-64 animate-pulse rounded-xl' />
    </div>
  );
}

export default function PageContainer({
  children,
  isLoading = false,
  access = true,
  accessFallback,
  pageTitle,
  pageDescription,
  infoContent,
  pageHeaderAction
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  access?: boolean;
  accessFallback?: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  infoContent?: InfobarContent;
  pageHeaderAction?: React.ReactNode;
}) {
  if (!access) {
    return (
      <div className='flex flex-1 items-center justify-center p-4 md:px-6'>
        {accessFallback ?? (
          <div className='text-muted-foreground text-center text-lg'>
            You do not have access to this page.
          </div>
        )}
      </div>
    );
  }

  const content = isLoading ? <PageSkeleton /> : children;

  const hasHeader = pageTitle || pageHeaderAction;

  return (
    <div className='flex flex-1 flex-col px-4 pt-3 pb-6 md:px-6 md:pt-5'>
      {hasHeader && (
        <div className='mb-6 flex items-start justify-between gap-4'>
          <Heading
            title={pageTitle ?? ''}
            description={pageDescription ?? ''}
            infoContent={infoContent}
          />
          {pageHeaderAction && <div className='shrink-0'>{pageHeaderAction}</div>}
        </div>
      )}
      {content}
    </div>
  );
}
