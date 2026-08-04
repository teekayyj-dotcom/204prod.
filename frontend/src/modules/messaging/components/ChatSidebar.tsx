import React, { useState } from "react";
import { useChatStore, Conversation } from "../store/ChatContext";
import { Users, Search, Plus, MessageSquare } from "lucide-react";
import { wsService } from "../services/websocket";
import { NewChatModal } from "./NewChatModal";
import { messagingApi } from "../services/api";
import { ensureUTC } from "../utils/time";

export function ChatSidebar() {
  const { conversations, activeConversationId, setActiveConversationId, setConversations } = useChatStore();
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);

  const filtered = conversations.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    (!c.is_group && c.participants.length > 0) // Basic fallback
  );

  const sortedConversations = [...filtered].sort((a, b) => {
    const timeA = new Date(ensureUTC(a.last_message?.created_at || a.created_at)).getTime();
    const timeB = new Date(ensureUTC(b.last_message?.created_at || b.created_at)).getTime();
    return timeB - timeA;
  });

  return (
    <div className="w-80 border-r border-slate-200 h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Messages</h2>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowNewChat(true)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors bg-blue-50 text-blue-600"
            title="New Conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.map(conv => {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          const currentUserId = u.id || 0;
          const otherParticipant = conv.participants.find(p => p.user_id !== currentUserId);
          const otherUserId = otherParticipant?.user_id;
          const otherName = otherParticipant?.display_name || `User ${otherUserId}`;
          
          let displayName = conv.name ? conv.name.replace(/^Project:\s*/i, "") : (conv.is_group ? `Group ${conv.id}` : otherName);

          return (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConversationId(conv.id);
                // Mark as read immediately when clicked (mocking for now)
                const msgId = conv.last_message?.id;
                if (msgId && msgId < 10000000000) {
                  wsService.send({
                    type: "read_receipt",
                    conversation_id: conv.id,
                    message_id: msgId
                  });
                }
              }}
              className={`w-full text-left p-4 hover:bg-slate-50 border-b border-slate-100 flex items-start gap-3 transition-colors
                ${activeConversationId === conv.id ? 'bg-blue-50/50' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold overflow-hidden">
                  {conv.is_group ? (
                    conv.avatar_url ? (
                      <img src={conv.avatar_url} alt="Group Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-6 h-6" />
                    )
                  ) : (
                    (conv.avatar_url || otherParticipant?.avatar_url) ? (
                      <img src={(conv.avatar_url || otherParticipant?.avatar_url) as string} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (conv.name?.charAt(0) || otherName?.charAt(0) || "U")
                    )
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-medium text-slate-900 truncate">
                    {displayName}
                  </h3>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {new Date(ensureUTC(conv.last_message?.created_at || conv.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-sm truncate pr-2 ${conv.unread_count > 0 ? "text-slate-900 font-medium" : "text-slate-500"}`}>
                    {(() => {
                      if (!conv.last_message) return "No messages yet";
                      if (conv.last_message.message_type === "poll") return "[Poll] Check details";
                      if (conv.last_message.message_type === "deadline") return "[Deadline] Set";
                      if (conv.last_message.content) return conv.last_message.content;
                      if (conv.last_message.attachments?.length) return "Sent an attachment";
                      return "Sent a message";
                    })()}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {sortedConversations.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            No conversations found.
          </div>
        )}
      </div>


      {showNewChat && (
        <NewChatModal 
          onClose={() => setShowNewChat(false)}
          onSuccess={(newId) => {
            setShowNewChat(false);
            const fetchHistory = async () => {
              const token = localStorage.getItem("token") || "";
              const data = await messagingApi.getConversations(token);
              setConversations(data);
              setActiveConversationId(newId);
            };
            fetchHistory();
          }}
        />
      )}
    </div>
  );
}
