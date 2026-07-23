import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { wsService } from "../services/websocket";

export type Attachment = {
  id: number;
  file_url: string;
  file_type: string;
  file_name: string;
  size: number;
};

export type PollVote = {
  id: number;
  message_id: number;
  user_id: number;
  option_id: string;
  created_at: string;
};

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  content: string | null;
  message_type?: string;
  metadata_json?: any;
  created_at: string;
  attachments?: Attachment[];
  poll_votes?: PollVote[];
};

export type ConversationParticipant = {
  id: number;
  conversation_id: number;
  user_id: number;
  joined_at: string;
  last_read_message_id: number | null;
  display_name?: string;
  role?: string;
};

export type Conversation = {
  id: number;
  is_group: boolean;
  name: string | null;
  avatar_url?: string | null;
  created_at: string;
  participants: ConversationParticipant[];
  last_message: Message | null;
  unread_count: number;
};

type ChatContextType = {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeConversationId: number | null;
  setActiveConversationId: (id: number | null) => void;
  messages: Record<number, Message[]>; // conversation_id -> messages
  setMessages: React.Dispatch<React.SetStateAction<Record<number, Message[]>>>;
  onlineUsers: Set<number>;
  typingUsers: Record<number, Set<number>>; // conversation_id -> set of typing user_ids
  isWidgetOpen: boolean;
  setIsWidgetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  markAsRead: (conversationId: number) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<number, Set<number>>>({});
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // Refs for event listeners
  const activeConversationIdRef = React.useRef<number | null>(null);
  const isWidgetOpenRef = React.useRef<boolean>(false);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    isWidgetOpenRef.current = isWidgetOpen;
  }, [isWidgetOpen]);

  // Request Notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = useCallback((conversationId: number) => {
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, unread_count: 0 } : c
    ));
    // Optionally: emit read_receipt to server here
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    if (!token) return;

    // 1. Fetch initial conversations and connect WS
    const init = async () => {
      try {
        // Dynamic import to avoid circular dependencies if needed, or just standard import
        const { messagingApi } = await import("../services/api");
        const convs = await messagingApi.getConversations(token);
        setConversations(convs);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const defaultWsUrl = `${protocol}//${host}/api/v1/messaging/ws`;
        const wsBaseUrl = import.meta.env.VITE_WS_URL || defaultWsUrl;
        wsService.connect(wsBaseUrl, token);
      } catch (err) {
        console.error("Failed to init messaging", err);
      }
    };
    init();

    const handleNewMessage = (data: any) => {
      const msg = data.message as Message;
      setMessages((prev) => {
        const conversationMessages = prev[msg.conversation_id] || [];
        
        // Remove optimistic messages that match this real message
        const filteredMessages = conversationMessages.filter(m => {
           // Assume IDs generated via Date.now() are > 1 trillion
           const isOptimistic = m.id > 1000000000000;
           if (isOptimistic && m.sender_id === msg.sender_id && m.content === msg.content) {
               return false;
           }
           if (m.id === msg.id) return false;
           return true;
        });

        return {
          ...prev,
          [msg.conversation_id]: [...filteredMessages, msg]
        };
      });

      // Notification logic
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (msg.sender_id !== u.id) {
        const isViewing = isWidgetOpenRef.current && activeConversationIdRef.current === msg.conversation_id;
        if (!isViewing) {
          // Increment unread_count and update last_message
          setConversations(prev => prev.map(c => 
             c.id === msg.conversation_id ? { ...c, last_message: msg, unread_count: (c.unread_count || 0) + 1 } : c
          ));
          
          const text = msg.content || "Sent an attachment";
          
          // In-App Toast
          import("sonner").then(({ toast }) => {
            toast("New message", { description: text });
          });
          
          // OS Notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("New message", { body: text });
          }
        } else {
          // Update last_message even if viewing
          setConversations(prev => prev.map(c => 
             c.id === msg.conversation_id ? { ...c, last_message: msg } : c
          ));
        }
      } else {
        // Update last_message for self
        setConversations(prev => prev.map(c => 
           c.id === msg.conversation_id ? { ...c, last_message: msg } : c
        ));
      }
    };

    const handleUserStatus = (data: any) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.status === "online") next.add(data.user_id);
        else next.delete(data.user_id);
        return next;
      });
    };

    const handleTypingStart = (data: any) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (!next[data.conversation_id]) next[data.conversation_id] = new Set();
        next[data.conversation_id] = new Set(next[data.conversation_id]).add(data.user_id);
        return next;
      });
    };

    const handleTypingStop = (data: any) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (next[data.conversation_id]) {
          const updatedSet = new Set(next[data.conversation_id]);
          updatedSet.delete(data.user_id);
          next[data.conversation_id] = updatedSet;
        }
        return next;
      });
    };

    const handleReadReceipt = (data: any) => {
      setConversations((prev) => 
        prev.map(c => {
          if (c.id === data.conversation_id) {
            return {
              ...c,
              participants: c.participants.map(p => 
                p.user_id === data.user_id 
                  ? { ...p, last_read_message_id: data.message_id }
                  : p
              )
            };
          }
          return c;
        })
      );
    };

    const handlePollVote = (data: any) => {
      setMessages((prev) => {
        const conversationMessages = prev[data.conversation_id] || [];
        const msgIndex = conversationMessages.findIndex(m => m.id === data.message_id);
        if (msgIndex === -1) return prev;
        
        const updatedMsg = { ...conversationMessages[msgIndex] };
        const votes = [...(updatedMsg.poll_votes || [])];
        const existingVoteIndex = votes.findIndex(v => v.user_id === data.user_id);
        
        if (existingVoteIndex !== -1) {
          votes[existingVoteIndex] = { ...votes[existingVoteIndex], option_id: data.option_id };
        } else {
          votes.push({
            id: Date.now(), // Optimistic ID for UI
            message_id: data.message_id,
            user_id: data.user_id,
            option_id: data.option_id,
            created_at: new Date().toISOString()
          });
        }
        updatedMsg.poll_votes = votes;
        
        const nextMessages = [...conversationMessages];
        nextMessages[msgIndex] = updatedMsg;
        return {
          ...prev,
          [data.conversation_id]: nextMessages
        };
      });
    };

    wsService.on("new_message", handleNewMessage);
    wsService.on("user_status", handleUserStatus);
    wsService.on("typing_start", handleTypingStart);
    wsService.on("typing_stop", handleTypingStop);
    wsService.on("read_receipt", handleReadReceipt);
    wsService.on("poll_vote", handlePollVote);

    return () => {
      wsService.off("new_message", handleNewMessage);
      wsService.off("user_status", handleUserStatus);
      wsService.off("typing_start", handleTypingStart);
      wsService.off("typing_stop", handleTypingStop);
      wsService.off("read_receipt", handleReadReceipt);
      wsService.off("poll_vote", handlePollVote);
      wsService.disconnect();
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        setConversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        setMessages,
        onlineUsers,
        typingUsers,
        isWidgetOpen,
        setIsWidgetOpen,
        markAsRead
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatStore = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatStore must be used within a ChatProvider");
  }
  return context;
};
