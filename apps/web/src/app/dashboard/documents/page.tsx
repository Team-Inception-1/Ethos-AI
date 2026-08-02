import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Documents' };
import DocumentsPage from '@/components/pages/DocumentsPage';
export default function Documents() { return <DocumentsPage />; }
