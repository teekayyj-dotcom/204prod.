import React from "react";
import { MessageCircle, X, Maximize2 } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { useChatStore } from "../store/ChatContext";
import { useNavigate, useLocation } from "react-router-dom";

export function ChatWidget() {
  const { isWidgetOpen, setIsWidgetOpen, conversations } = useChatStore();
  const navigate = useNavigate();
  const location = useLocation();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  if (!isWidgetOpen || window.location.pathname.includes("/messages")) {
    return null;
  }

  const handleMaximize = () => {
    setIsWidgetOpen(false);
    if (location.pathname.startsWith("/client")) {
      navigate("/client/messages");
    } else if (location.pathname.startsWith("/crew")) {
      navigate("/crew/messages");
    } else {
      navigate("/admin/messages");
    }
  };

  return (
    <div 
      className="fixed bottom-6 right-6 bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col z-50 transition-all duration-300 w-[380px] h-[550px]"
    >
      {/* Widget Header */}
      <div className="h-12 bg-slate-900 text-white flex items-center justify-between px-4 cursor-pointer select-none">
        <div className="flex items-center gap-2 font-medium" onClick={handleMaximize}>
          <MessageCircle className="w-5 h-5" />
          <span>Messages</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleMaximize}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
            title="Open Full Screen"
          >
            <Maximize2 className="w-4 h-4" />
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
        <WidgetContent />
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
