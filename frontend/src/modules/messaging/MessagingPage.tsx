import React, { useEffect } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatWindow } from "./components/ChatWindow";

export function MessagingPage() {
  return (
    <div className="flex flex-1 w-full h-full bg-slate-50 overflow-hidden relative">
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
}
