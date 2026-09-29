import { redirect } from 'next/navigation';

export default function EscrowRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  redirect('/dashboard/payments');
}
