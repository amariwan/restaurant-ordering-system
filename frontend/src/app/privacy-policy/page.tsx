import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import PrivacyPageClient from '@/features/static-pages/privacy-page';

export const metadata: Metadata = { title: 'Privacy Policy', robots: { index: false } };

export default function PrivacyPolicyPage() {
  return (
    <PageContainer
      pageTitle='Privacy Policy'
      pageDescription='How the restaurant ordering system collects, stores, and protects restaurant and staff data.'
    >
      <PrivacyPageClient />
    </PageContainer>
  );
}
