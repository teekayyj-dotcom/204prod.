import React, { useEffect } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatWindow } from "./components/ChatWindow";

export function MessagingPage() {
  return (
    <div className="flex flex-1 w-full h-[calc(100dvh-73px)] lg:h-[100dvh] bg-slate-50 overflow-hidden relative">
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
}
