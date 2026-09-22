import type { Metadata } from 'next';
import AIToolsPage from '@/components/pages/AIToolsPage';

export const metadata: Metadata = {
  title: 'AI Agreement Analyzer | Ethos AI',
  description: 'AI contract and agreement analyzer to detect hidden fees, cancellation penalties, and predatory clauses.',
};

export default function AgreementAnalyzerPage() {
  return <AIToolsPage initialTool="agreement" />;
}
