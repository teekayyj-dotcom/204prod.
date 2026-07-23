import { Conversation, Message } from "../store/ChatContext";

// Simple API wrapper for messaging endpoints
export const messagingApi = {
  getConversations: async (token: string): Promise<Conversation[]> => {
    const res = await fetch("/api/v1/messaging/conversations", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  getContacts: async (token: string, q?: string): Promise<any[]> => {
    const url = q ? `/api/v1/messaging/contacts?q=${encodeURIComponent(q)}` : "/api/v1/messaging/contacts";
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch contacts");
    return res.json();
  },

  getMessages: async (conversationId: number, token: string): Promise<Message[]> => {
    const res = await fetch(`/api/v1/messaging/conversations/${conversationId}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  createConversation: async (isGroup: boolean, participantIds: number[], name: string | null, token: string): Promise<Conversation> => {
    const res = await fetch("/api/v1/messaging/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ is_group: isGroup, participant_ids: participantIds, name })
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    return res.json();
  },

  uploadAttachment: async (conversationId: number, file: File, token: string): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/v1/messaging/conversations/${conversationId}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    if (!res.ok) throw new Error("Failed to upload file");
    return res.json();
  },

  getConversationMedia: async (conversationId: number, token: string): Promise<any[]> => {
    const res = await fetch(`/api/v1/messaging/conversations/${conversationId}/media`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch conversation media");
    return res.json();
  },

  updateConversationAvatar: async (conversationId: number, avatarUrl: string, token: string): Promise<Conversation> => {
    const res = await fetch(`/api/v1/messaging/conversations/${conversationId}/avatar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ avatar_url: avatarUrl })
    });
    if (!res.ok) throw new Error("Failed to update conversation avatar");
    return res.json();
  },

  updateConversationName: async (conversationId: number, name: string, token: string): Promise<Conversation> => {
    const res = await fetch(`/api/v1/messaging/conversations/${conversationId}/name`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error("Failed to update conversation name");
    return res.json();
  },

  addParticipants: async (conversationId: number, participantIds: number[], token: string): Promise<Conversation> => {
    const res = await fetch(`/api/v1/messaging/conversations/${conversationId}/participants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ participant_ids: participantIds })
    });
    if (!res.ok) throw new Error("Failed to add participants");
    return res.json();
  }
};
