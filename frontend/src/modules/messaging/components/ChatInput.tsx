import React, { useState, useRef } from "react";
import { useChatStore } from "../store/ChatContext";
import { Send, Paperclip, Loader2, FileText, Plus, BarChart2, Calendar, X } from "lucide-react";
import { wsService } from "../services/websocket";
import { messagingApi } from "../services/api";

export function ChatInput({ conversationId }: { conversationId: number }) {
  const { setMessages, setConversations } = useChatStore();
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Attachments to send with the next message
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  
  const [showOptions, setShowOptions] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Deadline state
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Throttle typing events
    if (!typingTimeoutRef.current) {
      wsService.send({ type: "typing_start", conversation_id: conversationId });
      
      typingTimeoutRef.current = setTimeout(() => {
        wsService.send({ type: "typing_stop", conversation_id: conversationId });
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!content.trim() && pendingAttachments.length === 0) return;

    // Optimistic UI Update
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    const optimisticMessage = {
      id: Date.now(), // > 1 trillion
      conversation_id: conversationId,
      sender_id: u.id || 0,
      sender_name: u.display_name,
      content: content.trim(),
      created_at: new Date().toISOString(),
      attachments: [...pendingAttachments]
    };
    
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimisticMessage]
    }));

    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, last_message: optimisticMessage as any } : c
    ));

    wsService.send({
      type: "send_message",
      conversation_id: conversationId,
      content: content.trim(),
      attachments: pendingAttachments
    });

    setContent("");
    setPendingAttachments([]);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      wsService.send({ type: "typing_stop", conversation_id: conversationId });
    }
  };

  const handleCreatePoll = () => {
    const validOptions = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) return;

    const optimisticMessage = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: JSON.parse(localStorage.getItem("user") || "{}").id || 0,
      sender_name: JSON.parse(localStorage.getItem("user") || "{}").display_name,
      content: "Created a poll",
      message_type: "poll",
      metadata_json: {
        question: pollQuestion.trim(),
        options: validOptions.map((text, idx) => ({ id: `opt_${idx}`, text: text.trim() }))
      },
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimisticMessage as any]
    }));
    
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, last_message: optimisticMessage as any } : c
    ));

    wsService.send({
      type: "send_message",
      conversation_id: conversationId,
      content: "Created a poll",
      message_type: "poll",
      metadata_json: {
        question: pollQuestion.trim(),
        options: validOptions.map((text, idx) => ({ id: `opt_${idx}`, text: text.trim() }))
      }
    });

    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollModal(false);
  };

  const handleCreateDeadline = () => {
    if (!deadlineTitle.trim() || !deadlineDate || !deadlineTime) return;

    const dt = new Date(`${deadlineDate}T${deadlineTime}`);
    
    const optimisticMessage = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: JSON.parse(localStorage.getItem("user") || "{}").id || 0,
      sender_name: JSON.parse(localStorage.getItem("user") || "{}").display_name,
      content: "Set a deadline",
      message_type: "deadline",
      metadata_json: {
        title: deadlineTitle.trim(),
        due_date: dt.toISOString()
      },
      created_at: new Date().toISOString()
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimisticMessage as any]
    }));
    
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, last_message: optimisticMessage as any } : c
    ));

    wsService.send({
      type: "send_message",
      conversation_id: conversationId,
      content: "Set a deadline",
      message_type: "deadline",
      metadata_json: {
        title: deadlineTitle.trim(),
        due_date: dt.toISOString()
      }
    });

    setDeadlineTitle("");
    setDeadlineDate("");
    setDeadlineTime("");
    setShowDeadlineModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0); // Mock progress for visual feedback
    
    // Fake progress interval
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 10, 90));
    }, 100);

    try {
      // Mock token for now. In real app, get from auth context.
      const token = localStorage.getItem("token") || "";
      if (!token) throw new Error("No auth token");
      const attachment = await messagingApi.uploadAttachment(conversationId, file, token);
      
      setPendingAttachments(prev => [...prev, attachment]);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(100);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      
      {/* Pending Attachments Preview */}
      {pendingAttachments.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {pendingAttachments.map((att, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              {att.file_type.startsWith("image/") ? (
                <img src={att.file_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-8 h-8 text-slate-400" />
              )}
              <button 
                onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Poll Modal */}
      {showPollModal && (
        <div className="absolute bottom-20 left-4 bg-white shadow-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-4 w-80 z-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Create Poll</h4>
            <button onClick={() => setShowPollModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
          </div>
          <input 
            type="text" placeholder="Question..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="space-y-2 mb-3">
            {pollOptions.map((opt, i) => (
              <input 
                key={i} type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                  const newOpts = [...pollOptions];
                  newOpts[i] = e.target.value;
                  setPollOptions(newOpts);
                }}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ))}
            <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-xs text-blue-500 hover:underline">+ Add Option</button>
          </div>
          <button onClick={handleCreatePoll} className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700">Send Poll</button>
        </div>
      )}

      {/* Deadline Modal */}
      {showDeadlineModal && (
        <div className="absolute bottom-20 left-4 bg-white shadow-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-4 w-80 z-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Set Deadline</h4>
            <button onClick={() => setShowDeadlineModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
          </div>
          <input 
            type="text" placeholder="Task or Event Title..." value={deadlineTitle} onChange={e => setDeadlineTitle(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex space-x-2 mb-4">
            <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} className="w-1/2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <input type="time" value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} className="w-1/2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <button onClick={handleCreateDeadline} className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700">Send Deadline</button>
        </div>
      )}

      {isUploading && (
        <div className="text-xs text-blue-500 mb-2 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Uploading ({uploadProgress}%)
        </div>
      )}

      <div className="flex items-end gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all relative">
        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
          >
            <Plus className="w-5 h-5" />
          </button>
          {showOptions && (
            <div className="absolute bottom-12 left-0 bg-white border border-gray-200 shadow-lg rounded-lg py-2 w-40 z-50">
              <button 
                onClick={() => { setShowOptions(false); fileInputRef.current?.click(); }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Paperclip className="w-4 h-4 mr-2" /> Attachment
              </button>
              <button 
                onClick={() => { setShowOptions(false); setShowPollModal(true); }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <BarChart2 className="w-4 h-4 mr-2" /> Poll
              </button>
              <button 
                onClick={() => { setShowOptions(false); setShowDeadlineModal(true); }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Calendar className="w-4 h-4 mr-2" /> Deadline
              </button>
            </div>
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
        />
        
        <textarea
          value={content}
          onChange={handleTyping}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 max-h-32 bg-transparent resize-none outline-none py-2 px-2 text-slate-700"
          rows={1}
          style={{ minHeight: "40px" }}
        />
        
        <button 
          onClick={handleSend}
          disabled={!content.trim() && pendingAttachments.length === 0}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors rounded-full shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
