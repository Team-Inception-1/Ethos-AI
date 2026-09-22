import type { Metadata } from 'next';
import AIToolsPage from '@/components/pages/AIToolsPage';

export const metadata: Metadata = {
  title: 'AI Fraud Checker | Ethos AI',
  description: 'AI-powered document fraud detector for university admission offer letters and sponsorship documents.',
};

export default function FraudCheckerPage() {
  return <AIToolsPage initialTool="fraud" />;
}
