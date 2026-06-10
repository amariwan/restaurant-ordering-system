import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import AboutPageClient from '@/features/static-pages/about-page';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <PageContainer pageTitle='About' pageDescription='Restaurant operations, workflow, and backend integration for staff and management.'>
      <AboutPageClient />
    </PageContainer>
  );
}
