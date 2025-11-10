// src/app/(app)/admin/messaging/page.tsx
'use client';

import MessagingInterface from '@/components/shared/MessagingInterface';
import { ChatProvider } from '@/contexts/ChatContext';

export default function AdminMessagingPage() {
  return (
    <ChatProvider>
      <MessagingInterface />
    </ChatProvider>
  );
}
