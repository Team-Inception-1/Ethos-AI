import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Chat' };
import ChatPage from '@/components/pages/ChatPage';
export default function Chat() { return <ChatPage />; }
