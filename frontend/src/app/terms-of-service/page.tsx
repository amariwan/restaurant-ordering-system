import type { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import TermsPageClient from '@/features/static-pages/terms-page';

export const metadata: Metadata = { title: 'Terms of Service', robots: { index: false } };

export default function TermsOfServicePage() {
  return (
    <PageContainer
      pageTitle='Terms of Service'
      pageDescription='Terms for using the restaurant ordering system and the permitted restaurant workflows.'
    >
      <TermsPageClient />
    </PageContainer>
  );
}
