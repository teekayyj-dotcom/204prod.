import { ChatProvider } from '../modules/messaging/store/ChatContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      {children}
    </ChatProvider>
  );
}
