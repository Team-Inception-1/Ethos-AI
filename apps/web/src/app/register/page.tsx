import type { Metadata } from 'next';
import AuthPage from '@/components/pages/AuthPage';

export const metadata: Metadata = { title: 'Create Account' };

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
