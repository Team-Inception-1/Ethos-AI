import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Payments & Escrow' };
import PaymentsPage from '@/components/pages/PaymentsPage';
export default function Payments() { return <PaymentsPage />; }
