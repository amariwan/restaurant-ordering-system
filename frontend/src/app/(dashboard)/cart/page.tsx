'use client';

import { CartPage } from '@/features/restaurant/components/cart-page';
import { IconShoppingCart } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

export default function CartRoutePage() {
  return (
    <PageContainer
      pageTitle='Cart'
      pageDescription='Review items in the current order and enter your table number.'
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <IconShoppingCart className="w-6 h-6" />
        </div>
        <CartPage />
      </div>
    </PageContainer>
  );
}
