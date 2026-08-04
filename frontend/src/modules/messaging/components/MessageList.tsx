import React, { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { useChatStore, Conversation } from "../store/ChatContext";
import { ChevronDown } from "lucide-react";

export function MessageList({ conversation }: { conversation: Conversation }) {
  const { messages, typingUsers } = useChatStore();
  const listRef = useRef<HTMLDivElement>(null);
  
  const conversationMessages = messages[conversation.id] || [];
  
  // Get actual user ID from localStorage
  const u = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = u.id || 0;
  const currentUserAvatar = u.avatar_url || u.avatar || u.photo_url || u.photoURL;

  // Auto-scroll to bottom
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages, typingUsers]);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    // Show button if we are scrolled up more than 150px from bottom
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollButton(isScrolledUp);
  };

  // Read receipts logic:
  // Determine the highest message id read by the *other* participant
  const otherParticipant = conversation.participants.find(p => p.user_id !== currentUserId);
  const otherLastReadId = otherParticipant?.last_read_message_id || 0;

  const typingSet = typingUsers[conversation.id];
  const isTyping = typingSet && typingSet.size > 0;

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 bg-slate-50 relative" 
      ref={listRef}
      onScroll={handleScroll}
    >
      
      {conversationMessages.length === 0 && (
        <div className="flex h-full items-center justify-center text-slate-400 text-sm">
          No messages yet. Send a message to start the conversation!
        </div>
      )}

      {conversationMessages.map((msg, index) => {
        const isOwn = msg.sender_id === currentUserId;
        const sender = conversation.participants.find(p => p.user_id === msg.sender_id);
        const senderName = msg.sender_name || sender?.display_name || (isOwn ? (u.display_name || u.username) : `User ${msg.sender_id}`);
        const finalSenderAvatar = isOwn ? (currentUserAvatar || sender?.avatar_url) : sender?.avatar_url;
        
        // Determine if we should hide the timestamp
        let hideTimestamp = false;
        if (index < conversationMessages.length - 1) {
          const nextMsg = conversationMessages[index + 1];
          if (nextMsg.sender_id === msg.sender_id && nextMsg.message_type !== "system" && msg.message_type !== "system") {
            const currentT = new Date(msg.created_at).getTime();
            const nextT = new Date(nextMsg.created_at).getTime();
            // If the next message is within 2 minutes (120,000 ms)
            if (nextT - currentT < 120000) {
              hideTimestamp = true;
            }
          }
        }

        // Determine if we should hide the name (only show for the first message in a block)
        let showName = !isOwn && conversation.is_group;
        if (showName && index > 0) {
          const prevMsg = conversationMessages[index - 1];
          if (prevMsg.sender_id === msg.sender_id && prevMsg.message_type !== "system" && msg.message_type !== "system") {
            const currentT = new Date(msg.created_at).getTime();
            const prevT = new Date(prevMsg.created_at).getTime();
            // If the previous message was within 2 minutes
            if (currentT - prevT < 120000) {
              showName = false;
            }
          }
        }

        // Bumping Poll logic
        let referencedPollMessage = undefined;
        if (msg.message_type === "system") {
          const meta = typeof msg.metadata_json === 'string' 
            ? JSON.parse(msg.metadata_json || '{}') 
            : (msg.metadata_json || {});
          if (meta.poll_reference_id) {
            referencedPollMessage = conversationMessages.find(m => m.id === meta.poll_reference_id);
          }
        }

        return (
          <MessageBubble 
            key={msg.id}
            message={msg}
            isOwn={isOwn}
            isRead={msg.id <= otherLastReadId}
            senderName={senderName}
            showName={showName}
            hideTimestamp={hideTimestamp}
            hideAvatar={hideTimestamp}
            senderAvatar={finalSenderAvatar}
            referencedPollMessage={referencedPollMessage}
          />
        );
      })}

      {showScrollButton && (
        <button 
          onClick={() => scrollToBottom()}
          className="fixed bottom-24 right-8 md:absolute md:bottom-6 md:right-8 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-20 animate-in fade-in slide-in-from-bottom-5"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

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
