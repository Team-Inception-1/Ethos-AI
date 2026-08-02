import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Application Tracking' };
import ApplicationDetailPage from '@/components/pages/ApplicationDetailPage';
export default function ApplicationDetail({ params }: { params: { id: string } }) {
  return <ApplicationDetailPage id={params.id} />;
}
