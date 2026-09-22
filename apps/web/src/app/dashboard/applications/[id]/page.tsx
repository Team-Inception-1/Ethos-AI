import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Application Tracking' };
import ApplicationDetailPage from '@/components/pages/ApplicationDetailPage';
export default async function ApplicationDetail(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <ApplicationDetailPage id={params.id} />;
}
