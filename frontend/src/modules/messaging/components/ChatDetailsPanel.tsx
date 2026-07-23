import React, { useState, useEffect, useRef } from "react";
import { X, Camera, Users, Image as ImageIcon } from "lucide-react";
import { Conversation, Attachment } from "../store/ChatContext";
import { ParticipantList } from "./ParticipantList";
import { MediaGallery } from "./MediaGallery";
import { messagingApi } from "../services/api";

interface ChatDetailsPanelProps {
  conversation: Conversation;
  onClose: () => void;
  onAvatarUpdated: (newConversation: Conversation) => void;
}

export const ChatDetailsPanel: React.FC<ChatDetailsPanelProps> = ({ 
  conversation, 
  onClose,
  onAvatarUpdated
}) => {
  const [activeTab, setActiveTab] = useState<"members" | "media">("members");
  
  const [media, setMedia] = useState<Attachment[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingMemberId, setAddingMemberId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    if (activeTab === "media") {
      fetchMedia();
    }
  }, [activeTab, conversation.id]);

  useEffect(() => {
    if (isAddingMember) {
      fetchContacts();
    }
  }, [isAddingMember, searchQuery]);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const fetched = await messagingApi.getContacts(token, searchQuery);
      setContacts(fetched.filter((c: any) => !conversation.participants.some(p => p.user_id === c.id)));
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    }
  };

  const handleAddMember = async (userId: number) => {
    setAddingMemberId(userId);
    try {
      const token = localStorage.getItem("token") || "";
      const updatedConv = await messagingApi.addParticipants(conversation.id, [userId], token);
      onAvatarUpdated(updatedConv);
      setIsAddingMember(false);
    } catch (err) {
      console.error("Failed to add member", err);
    } finally {
      setAddingMemberId(null);
    }
  };

  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const token = localStorage.getItem("token") || "";
      const attachments = await messagingApi.getConversationMedia(conversation.id, token);
      setMedia(attachments);
    } catch (err) {
      console.error("Failed to fetch media", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem("token") || "";
      // 1. Upload file to R2
      const uploaded = await messagingApi.uploadAttachment(conversation.id, file, token);
      
      // 2. Update conversation avatar
      const updatedConv = await messagingApi.updateConversationAvatar(
        conversation.id,
        uploaded.file_url,
        token
      );
      
      onAvatarUpdated(updatedConv);
    } catch (err) {
      console.error("Failed to update avatar", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim() || editName === conversation.name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const token = localStorage.getItem("token") || "";
      const updatedConv = await messagingApi.updateConversationName(conversation.id, editName.trim(), token);
      onAvatarUpdated(updatedConv); // Reuse callback to update conversation state
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to rename conversation", err);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-full flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Details</h2>
        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Header Info */}
        <div className="p-6 flex flex-col items-center border-b border-gray-200 dark:border-gray-800">
          <div className="relative group mb-4">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-3xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-sm">
              {conversation.avatar_url ? (
                <img src={conversation.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                conversation.name?.charAt(0) || "G"
              )}
            </div>
            
            {/* Avatar overlay for group chats */}
            {isAdmin && conversation.is_group && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full shadow-md border-2 border-white dark:border-gray-900 hover:bg-blue-700 transition-colors disabled:cursor-not-allowed"
                title="Change Avatar"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>
          
          {isEditingName ? (
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm w-full text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <button 
                onClick={handleSaveName} 
                disabled={savingName}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {savingName ? "..." : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 justify-center group/name">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                {conversation.name || (conversation.is_group ? "Group Chat" : "Direct Message")}
              </h3>
              {isAdmin && conversation.is_group && (
                <button 
                  onClick={() => { setEditName(conversation.name || ""); setIsEditingName(true); }}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                  title="Rename Group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {conversation.is_group ? `${conversation.participants.length} members` : "Private Chat"}
          </p>
        </div>

        {/* Tabs */}
        {conversation.is_group && (
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 ${
                activeTab === "members" 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Members</span>
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 ${
                activeTab === "media" 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Media</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {!conversation.is_group || activeTab === "members" ? (
            <div className="flex flex-col h-full">
              {isAdmin && conversation.is_group && (
                <div className="mb-4">
                  {!isAddingMember ? (
                    <button 
                      onClick={() => setIsAddingMember(true)}
                      className="flex items-center justify-center space-x-2 w-full py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                    >
                      <Users className="w-4 h-4" />
                      <span>Add Member</span>
                    </button>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Add Member</span>
                        <button onClick={() => setIsAddingMember(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                      />
                      <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                        {contacts.length === 0 ? (
                          <div className="text-xs text-gray-500 text-center py-2">No users found</div>
                        ) : (
                          contacts.map(c => (
                            <div key={c.id} className="flex justify-between items-center p-2 hover:bg-white dark:hover:bg-gray-700 rounded cursor-pointer">
                              <span className="text-sm truncate pr-2">{c.display_name || `User ${c.id}`}</span>
                              <button 
                                onClick={() => handleAddMember(c.id)}
                                disabled={addingMemberId === c.id}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {addingMemberId === c.id ? "..." : "Add"}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <ParticipantList participants={conversation.participants} />
            </div>
          ) : (
            <div>
              {loadingMedia ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <MediaGallery media={media} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
