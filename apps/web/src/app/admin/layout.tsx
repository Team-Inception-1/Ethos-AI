import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/authorization';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await connection();
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') {
    redirect(user.role === 'AGENCY' ? '/agency/dashboard' : '/dashboard');
  }
  return children;
}
