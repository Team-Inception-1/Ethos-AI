import type { Metadata } from 'next';
import AIToolsPage from '@/components/pages/AIToolsPage';

export const metadata: Metadata = {
  title: 'AI Tools — Document Fraud & Agreement Analyzer | Ethos AI',
  description: 'AI-powered document fraud detector for university offer letters and smart agreement clause analyzer.',
};

export default function AITools() {
  return <AIToolsPage />;
}
