import { Metadata } from 'next';
import AuthView from '@/features/auth/components/auth-view';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Sign in or create an account.'
};

export default function AuthPage() {
  return <AuthView />;
}
