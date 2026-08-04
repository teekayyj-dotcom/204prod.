import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/ChatContext";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { messagingApi } from "../services/api";
import { Users, Info } from "lucide-react";
import { ChatDetailsPanel } from "./ChatDetailsPanel";

export function ChatWindow() {
  const { activeConversationId, conversations, setMessages, onlineUsers, setConversations } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    if (activeConversationId) {
      // Fetch initial history
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token") || "";
          const history = await messagingApi.getMessages(activeConversationId, token);
          setMessages(prev => ({
            ...prev,
            [activeConversationId]: history
          }));
        } catch (error) {
          console.error("Failed to fetch messages", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchHistory();
    }
  }, [activeConversationId, setMessages]);

  if (!activeConversationId || !activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const u = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = u.id || 0;
  const otherParticipant = activeConversation.participants.find(p => p.user_id !== currentUserId);
  const otherUserId = otherParticipant?.user_id;
  const otherName = otherParticipant?.display_name || `User ${otherUserId}`;
  const displayName = activeConversation.name ? activeConversation.name.replace(/^Project:\s*/i, "") : (activeConversation.is_group ? `Group ${activeConversation.id}` : otherName);

  return (
    <div className="flex-1 flex flex-row bg-white overflow-hidden min-h-0 relative">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold overflow-hidden">
                {activeConversation.is_group ? (
                  activeConversation.avatar_url ? (
                    <img src={activeConversation.avatar_url} alt="Group Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )
                ) : (
                  (activeConversation.avatar_url || otherParticipant?.avatar_url) ? (
                    <img src={(activeConversation.avatar_url || otherParticipant?.avatar_url) as string} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (activeConversation.name?.charAt(0) || otherName?.charAt(0) || "U")
                  )
                )}
              </div>
          </div>
          <div>
            <h3 className="font-medium text-slate-900 leading-tight">
              {displayName}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-slate-400">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className={`hover:text-slate-600 transition-colors ${showDetails ? "text-blue-600" : ""}`}
            title="Group Info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <span className="text-slate-400">Loading history...</span>
        </div>
      ) : (
        <MessageList conversation={activeConversation} />
      )}

      {/* Input */}
      <ChatInput conversationId={activeConversationId} />
      </div>

      {showDetails && (
        <div className="absolute top-0 right-0 h-full shadow-xl z-20 transition-all duration-300">
          <ChatDetailsPanel 
            conversation={activeConversation}
            onClose={() => setShowDetails(false)}
            onAvatarUpdated={(newConv) => {
              setConversations(prev => prev.map(c => c.id === newConv.id ? newConv : c));
            }}
          />
        </div>
      )}
    </div>
  );
}
