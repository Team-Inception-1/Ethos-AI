'use client';

import React, { use } from 'react';
import AgencyDetailPage from '@/components/pages/AgencyDetailPage/AgencyDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgencyProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <AgencyDetailPage agencyId={resolvedParams.id} inDashboard={false} />;
}
