import type { Metadata } from 'next';
import AIToolsPage from '@/components/pages/AIToolsPage';

export const metadata: Metadata = {
  title: 'AI Verification Suite | Ethos AI',
  description: 'Verify consultancy agreements and admission offer letters before making milestone payments.',
};

export default function AITools() {
  return <AIToolsPage initialTool="all" />;
}
