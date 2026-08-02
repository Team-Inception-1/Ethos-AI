import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'My Applications' };
import ApplicationsPage from '@/components/pages/ApplicationsPage';
export default function Applications() { return <ApplicationsPage />; }
