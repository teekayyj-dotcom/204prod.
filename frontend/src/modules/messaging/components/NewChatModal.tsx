import React, { useState, useEffect } from "react";
import { X, Search, Loader2, MessageSquare } from "lucide-react";
import { messagingApi } from "../services/api";

interface User {
  id: number;
  display_name: string;
  avatar_url: string | null;
  role: string;
}

interface Props {
  onClose: () => void;
  onSuccess: (newConversationId: number) => void;
}

export function NewChatModal({ onClose, onSuccess }: Props) {
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const data = await messagingApi.getContacts(token, search);
        setContacts(data);
      } catch (err) {
        console.error("Failed to fetch contacts", err);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce search
    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedId) {
      setError("Please select a user to start messaging.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      // isGroup=false, name=null for 1-on-1 chats
      const conv = await messagingApi.createConversation(false, [selectedId], null, token);
      onSuccess(conv.id);
    } catch (err: any) {
      setError(err.message || "Failed to create conversation");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-semibold text-slate-800">New Message</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : contacts.length > 0 ? (
              <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {contacts.map((user) => (
                  <li 
                    key={user.id} 
                    className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedId(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden text-xs font-medium">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (user.display_name || "U").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{user.display_name}</div>
                        <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedId === user.id ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                      {selectedId === user.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                No users found.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}
