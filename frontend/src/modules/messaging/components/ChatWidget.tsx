import React, { useState } from "react";
import { MessageCircle, X, Maximize2, Minimize2 } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { useChatStore } from "../store/ChatContext";

export function ChatWidget() {
  const { isWidgetOpen, setIsWidgetOpen, conversations } = useChatStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  if (!isWidgetOpen) {
    return (
      <button
        onClick={() => setIsWidgetOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-xl flex items-center justify-center text-white hover:bg-blue-700 transition-all z-50 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnread > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col z-50 transition-all duration-300 ${
        isExpanded ? "w-[800px] h-[600px] sm:w-[90vw] sm:h-[80vh]" : "w-[380px] h-[550px]"
      }`}
    >
      {/* Widget Header */}
      <div className="h-12 bg-slate-900 text-white flex items-center justify-between px-4 cursor-pointer select-none">
        <div className="flex items-center gap-2 font-medium" onClick={() => setIsExpanded(!isExpanded)}>
          <MessageCircle className="w-5 h-5" />
          <span>Messages</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsWidgetOpen(false)}
            className="p-1.5 hover:bg-red-500 hover:text-white rounded-md transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget Body */}
      <div className="flex-1 flex overflow-hidden">
        {isExpanded ? (
          <>
            <ChatSidebar />
            <ChatWindow />
          </>
        ) : (
          /* When collapsed, we can show a combined view or just Sidebar -> Window navigation.
             For simplicity in the widget, if an active conversation is set, show ChatWindow.
             Otherwise show ChatSidebar. This requires accessing activeConversationId from context. */
          <WidgetContent />
        )}
      </div>
    </div>
  );
}

// Inner component to access context
function WidgetContent() {
  const { activeConversationId, setActiveConversationId, markAsRead } = useChatStore();

  React.useEffect(() => {
    if (activeConversationId) {
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, markAsRead]);

  if (activeConversationId) {
    return (
      <div className="flex-1 flex flex-col w-full overflow-hidden min-h-0">
        {/* Back button wrapper */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center">
          <button 
            onClick={() => setActiveConversationId(null)}
            className="text-sm text-blue-600 hover:underline font-medium px-2 py-1"
          >
            &larr; Back to Conversations
          </button>
        </div>
        <ChatWindow />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ChatSidebar />
    </div>
  );
}
