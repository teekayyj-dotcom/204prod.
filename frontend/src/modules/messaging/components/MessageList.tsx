import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { useChatStore, Conversation } from "../store/ChatContext";

export function MessageList({ conversation }: { conversation: Conversation }) {
  const { messages, typingUsers } = useChatStore();
  const listRef = useRef<HTMLDivElement>(null);
  
  const conversationMessages = messages[conversation.id] || [];
  
  // Get actual user ID from localStorage
  const u = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = u.id || 0;

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [conversationMessages, typingUsers]);

  // Read receipts logic:
  // Determine the highest message id read by the *other* participant
  const otherParticipant = conversation.participants.find(p => p.user_id !== currentUserId);
  const otherLastReadId = otherParticipant?.last_read_message_id || 0;

  const typingSet = typingUsers[conversation.id];
  const isTyping = typingSet && typingSet.size > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-slate-50" ref={listRef}>
      
      {conversationMessages.length === 0 && (
        <div className="flex h-full items-center justify-center text-slate-400 text-sm">
          No messages yet. Send a message to start the conversation!
        </div>
      )}

      {conversationMessages.map(msg => {
        const isOwn = msg.sender_id === currentUserId;
        const sender = conversation.participants.find(p => p.user_id === msg.sender_id);
        const senderName = msg.sender_name || sender?.display_name || `User ${msg.sender_id}`;
        return (
          <MessageBubble 
            key={msg.id}
            message={msg}
            isOwn={isOwn}
            isRead={msg.id <= otherLastReadId}
            senderName={senderName}
            showName={!isOwn && conversation.is_group}
          />
        );
      })}

      {isTyping && (
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 mr-2 flex-shrink-0"></div>
          <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-none border border-slate-100 flex items-center gap-1 shadow-sm">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
