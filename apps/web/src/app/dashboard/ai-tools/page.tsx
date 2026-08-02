import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'AI Tools' };
import AIToolsPage from '@/components/pages/AIToolsPage';
export default function AITools() { return <AIToolsPage />; }
