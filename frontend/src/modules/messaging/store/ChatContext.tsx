import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { wsService } from "../services/websocket";
import { toast } from "sonner";
import { ensureUTC } from "../utils/time";

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
  avatar_url?: string | null;
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
  const conversationsRef = React.useRef<Conversation[]>([]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    isWidgetOpenRef.current = isWidgetOpen;
  }, [isWidgetOpen]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

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
      let currentUserId = -1;
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        currentUserId = u.id;
      } catch (e) {}

      if (Number(msg.sender_id) !== Number(currentUserId)) {
        const isViewing = isWidgetOpenRef.current && Number(activeConversationIdRef.current) === Number(msg.conversation_id);
        if (!isViewing) {
          // Increment unread_count and update last_message
          setConversations(prev => prev.map(c => 
             c.id === msg.conversation_id ? { ...c, last_message: msg, unread_count: (c.unread_count || 0) + 1 } : c
          ));
          
          // Auto pop-up widget if it's closed
          if (!isWidgetOpenRef.current) {
            setIsWidgetOpen(true);
          }
          
          const text = msg.content || "Sent an attachment";

          // OS Notification
          if ("Notification" in window && Notification.permission === "granted") {
            const path = window.location.pathname.toLowerCase();
            const isAppRoute = path.includes("dashboard") || path.includes("admin") || path.includes("client") || path.includes("crew") || path.includes("messaging");
            if (isAppRoute) {
              new Notification("New message", { body: text });
            }
          }
          
          // In-App Toast
          const path = window.location.pathname.toLowerCase();
          const isAppRoute = path.includes("dashboard") || path.includes("admin") || path.includes("client") || path.includes("crew") || path.includes("messaging");
          
          if (isAppRoute) {
            const currentConvs = conversationsRef.current;
            const conv = currentConvs.find(c => c.id === msg.conversation_id);
            const groupName = conv?.name ? conv.name.replace(/^Project:\s*/i, "") : (conv?.is_group ? `Group ${conv.id}` : "");
            const groupStr = groupName ? ` (${groupName})` : "";
            const time = new Date(ensureUTC(msg.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const senderInitial = msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : "U";
            
            let toastAvatarUrl: string | null | undefined = null;
            if (conv?.is_group) {
              toastAvatarUrl = conv.avatar_url;
            } else {
              const sender = conv?.participants.find(p => p.user_id === msg.sender_id);
              toastAvatarUrl = sender?.avatar_url;
            }
            
            toast.custom((t) => (
              <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-[356px] pointer-events-auto"
                onClick={() => {
                  setIsWidgetOpen(true);
                  setActiveConversationId(msg.conversation_id);
                  toast.dismiss(t);
                }}
              >
                <div className="flex items-center gap-3">
                  {toastAvatarUrl ? (
                    <img src={toastAvatarUrl} alt={msg.sender_name || "Avatar"} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                      {senderInitial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {msg.sender_name} <span className="text-gray-500 font-normal">{groupStr}</span>
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{time}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{text}</p>
                  </div>
                </div>
              </div>
            ), { duration: 6000 });
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

    const handleMessageDeleted = (data: any) => {
      setMessages((prev) => {
        const conversationMessages = prev[data.conversation_id] || [];
        return {
          ...prev,
          [data.conversation_id]: conversationMessages.filter(m => m.id !== data.message_id)
        };
      });
      // Also update last_message if it was the deleted one
      setConversations((prev) => 
        prev.map(c => {
          if (c.id === data.conversation_id && c.last_message?.id === data.message_id) {
            // We'd ideally fetch the new last message, but for now just clear it or leave it
            // A proper implementation would need a refetch or keeping track of the previous one.
            return { ...c, last_message: null as any };
          }
          return c;
        })
      );
    };

    const handleMessageUpdated = (data: any) => {
      setMessages((prev) => {
        const conversationMessages = prev[data.conversation_id] || [];
        const msgIndex = conversationMessages.findIndex(m => m.id === data.message.id);
        if (msgIndex === -1) return prev;
        
        const updatedMsg = { ...conversationMessages[msgIndex], ...data.message };
        const nextMessages = [...conversationMessages];
        nextMessages[msgIndex] = updatedMsg;
        return {
          ...prev,
          [data.conversation_id]: nextMessages
        };
      });
      
      setConversations((prev) => 
        prev.map(c => {
          if (c.id === data.conversation_id && c.last_message?.id === data.message.id) {
            return { ...c, last_message: { ...c.last_message, ...data.message } };
          }
          return c;
        })
      );
    };

    wsService.on("new_message", handleNewMessage);
    wsService.on("user_status", handleUserStatus);
    wsService.on("typing_start", handleTypingStart);
    wsService.on("typing_stop", handleTypingStop);
    wsService.on("read_receipt", handleReadReceipt);
    wsService.on("poll_vote", handlePollVote);
    wsService.on("message_deleted", handleMessageDeleted);
    wsService.on("message_updated", handleMessageUpdated);

    return () => {
      wsService.off("new_message", handleNewMessage);
      wsService.off("user_status", handleUserStatus);
      wsService.off("typing_start", handleTypingStart);
      wsService.off("typing_stop", handleTypingStop);
      wsService.off("read_receipt", handleReadReceipt);
      wsService.off("poll_vote", handlePollVote);
      wsService.off("message_deleted", handleMessageDeleted);
      wsService.off("message_updated", handleMessageUpdated);
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
