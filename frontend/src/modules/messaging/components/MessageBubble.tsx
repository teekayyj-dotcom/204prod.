import React, { useState } from "react";
import { Message, Attachment } from "../store/ChatContext";
import { FileText, Download, Check, CheckCheck, Calendar, Clock, BarChart2, MoreVertical, X } from "lucide-react";
import { format } from "date-fns";
import { wsService } from "../services/websocket";
import { ensureUTC } from "../utils/time";

export function MessageBubble({ 
  message, 
  isOwn,
  isRead,
  senderName,
  showName,
  hideTimestamp,
  hideAvatar,
  senderAvatar,
  referencedPollMessage
}: { 
  message: Message, 
  isOwn: boolean,
  isRead?: boolean,
  senderName?: string,
  showName?: boolean,
  hideTimestamp?: boolean,
  hideAvatar?: boolean,
  senderAvatar?: string,
  referencedPollMessage?: Message
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPollQuestion, setEditPollQuestion] = useState("");
  const [editPollOptions, setEditPollOptions] = useState<string[]>([]);
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  
  const metadata = typeof message.metadata_json === 'string' 
    ? JSON.parse(message.metadata_json || '{}') 
    : (message.metadata_json || {});

  const mentions = metadata?.mentions || [];
  const isMentioned = mentions.some((m: any) => m.id === currentUser.id || m.id === 'everyone');

  const renderContent = (content: string, mentionsList: any[]) => {
    if (!content) return content;
    
    // 1. Parse mentions
    let names: string[] = [];
    if (mentionsList && mentionsList.length > 0) {
      names = mentionsList.map(m => m.name).sort((a: string, b: string) => b.length - a.length);
    }
    
    let parts: string[] = [content];
    if (names.length > 0) {
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = `(@(?:${names.map(escapeRegex).join('|')}))`;
      const regex = new RegExp(pattern, 'g');
      parts = content.split(regex);
    }
    
    // 2. Parse URLs in text parts
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const finalParts: any[] = [];
    let keyIndex = 0;
    
    for (const part of parts) {
      if (!part) continue;
      
      if (part.startsWith('@') && names.includes(part.substring(1))) {
        finalParts.push(
          <span key={keyIndex++} className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/40 px-1 rounded mx-0.5">
            {part}
          </span>
        );
      } else {
        const subParts = part.split(urlRegex);
        for (const sub of subParts) {
          if (!sub) continue;
          if (sub.match(/^https?:\/\//)) {
            finalParts.push(
              <a 
                key={keyIndex++} 
                href={sub} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:opacity-80 transition-opacity break-all font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {sub}
              </a>
            );
          } else {
            finalParts.push(<span key={keyIndex++}>{sub}</span>);
          }
        }
      }
    }
    
    return finalParts;
  };

  const renderPollWidget = (pollMessage: Message, pollMetadata: any) => {
    const isCreator = pollMessage.sender_id === currentUser.id;
    return (
      <div className="w-64 bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 shadow-sm text-sm text-gray-900 dark:text-gray-100 mt-2 relative">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2 font-medium">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <span>{pollMetadata.question || "Poll"}</span>
          </div>
          {isCreator && (
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 shadow-md rounded-md py-1 z-20 text-xs">
                  <button 
                    onClick={() => {
                      setShowDropdown(false);
                      setEditPollQuestion(pollMetadata.question || "");
                      setEditPollOptions(pollMetadata.options?.map((o: any) => o.text) || []);
                      setShowEditModal(true);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
                  >
                    Edit Poll
                  </button>
                  <button 
                    onClick={() => {
                      setShowDropdown(false);
                      wsService.send({ type: "delete_message", conversation_id: pollMessage.conversation_id, message_id: pollMessage.id });
                    }}
                    className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    Delete Poll
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          {pollMetadata.options?.map((opt: any) => {
            const votesForOption = (pollMessage.poll_votes || []).filter(v => v.option_id === opt.id).length;
            const totalVotes = pollMessage.poll_votes?.length || 0;
            const percent = totalVotes > 0 ? Math.round((votesForOption / totalVotes) * 100) : 0;
            const hasVotedOpt = (pollMessage.poll_votes || []).some(v => v.user_id === currentUser.id && v.option_id === opt.id);

            return (
              <button 
                key={opt.id}
                onClick={() => {
                  wsService.send({
                    type: "poll_vote",
                    conversation_id: pollMessage.conversation_id,
                    message_id: pollMessage.id,
                    option_id: opt.id
                  });
                }}
                className="w-full relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden text-left text-xs transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ease-in-out ${hasVotedOpt ? "bg-blue-200 dark:bg-blue-900/50" : "bg-gray-200 dark:bg-gray-600"}`} 
                  style={{ width: `${percent}%` }}
                />
                <div className="relative z-10 px-3 py-2 flex justify-between">
                  <span className="font-medium truncate pr-2">{opt.text}</span>
                  <span className="text-gray-500 dark:text-gray-400">{votesForOption}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Edit Poll Modal inline to avoid absolute positioning complex z-index issues */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-80 shadow-xl border border-gray-200 dark:border-gray-700 relative">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Edit Poll</h4>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
              </div>
              <input 
                type="text" placeholder="Question..." value={editPollQuestion} onChange={e => setEditPollQuestion(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="space-y-2 mb-3">
                {editPollOptions.map((opt, i) => (
                  <input 
                    key={i} type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                      const newOpts = [...editPollOptions];
                      newOpts[i] = e.target.value;
                      setEditPollOptions(newOpts);
                    }}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ))}
                <button onClick={() => setEditPollOptions([...editPollOptions, ""])} className="text-xs text-blue-500 hover:underline">+ Add Option</button>
              </div>
              <button 
                onClick={() => {
                  const validOptions = editPollOptions.filter(o => o.trim());
                  if (!editPollQuestion.trim() || validOptions.length < 2) return;
                  wsService.send({
                    type: "edit_poll",
                    conversation_id: pollMessage.conversation_id,
                    message_id: pollMessage.id,
                    metadata_json: {
                      ...pollMetadata,
                      question: editPollQuestion.trim(),
                      options: validOptions.map((text, idx) => ({ id: `opt_${idx}`, text: text.trim() }))
                    }
                  });
                  setShowEditModal(false);
                }} 
                className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (message.message_type === "system") {
    return (
      <div className="flex flex-col items-center my-4">
        <div className="bg-slate-100 text-slate-500 text-xs px-4 py-1.5 rounded-full shadow-sm border border-slate-200">
          {message.content}
        </div>
        {/* Bumped Poll Widget */}
        {referencedPollMessage && (
          <div className="mt-2 w-full flex justify-center">
            {renderPollWidget(referencedPollMessage, typeof referencedPollMessage.metadata_json === 'string' ? JSON.parse(referencedPollMessage.metadata_json) : (referencedPollMessage.metadata_json || {}))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} ${hideTimestamp ? "mb-1" : "mb-4"}`} onClick={() => showDropdown && setShowDropdown(false)}>
      {!isOwn && (
        <div className="w-8 h-8 mr-2 flex-shrink-0 mt-auto">
          {!hideAvatar && (
            <div className="w-full h-full rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-xs overflow-hidden">
              {senderAvatar ? (
                <img src={senderAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                senderName ? senderName.charAt(0).toUpperCase() : "U"
              )}
            </div>
          )}
        </div>
      )}
      
      <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {showName && !isOwn && (
          <span className="text-xs text-slate-500 mb-1 ml-1">{senderName}</span>
        )}
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {message.attachments.map(att => (
              <div key={att.id} className="relative group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {att.file_type.startsWith("image/") ? (
                  <a href={att.file_url} target="_blank" rel="noreferrer">
                    <img src={att.file_url} alt={att.file_name} className="max-w-xs max-h-60 object-contain" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 max-w-xs">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{att.file_name}</p>
                      <p className="text-xs text-slate-500">{(att.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <a href={att.file_url} download className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text Content */}
        {message.content && (!message.message_type || message.message_type === "text") && (
          <div 
            className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
              isOwn 
                ? "bg-blue-600 text-white rounded-br-none" 
                : `rounded-bl-none border ${isMentioned ? "bg-amber-100 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700 text-slate-900 dark:text-slate-100 shadow-sm" : "bg-white text-slate-800 border-slate-100"}`
            }`}
          >
            {renderContent(message.content, mentions)}
          </div>
        )}

        {/* Poll Widget */}
        {message.message_type === "poll" && metadata && (
          renderPollWidget(message, metadata)
        )}

        {/* Deadline Widget */}
        {message.message_type === "deadline" && metadata && (
          <div className="w-64 bg-white border border-red-200 dark:border-red-900/30 dark:bg-gray-800 rounded-xl p-3 shadow-sm text-sm text-gray-900 dark:text-gray-100 mt-2">
            <div className="flex items-center space-x-2 font-semibold text-red-600 dark:text-red-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Deadline</span>
            </div>
            <p className="font-medium mb-2">{metadata.title || "Task"}</p>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-1">
              <Clock className="w-3 h-3" />
              <span>{metadata.due_date ? format(new Date(metadata.due_date), "PP p") : "Unknown date"}</span>
            </div>
          </div>
        )}

        {/* Timestamp and Read Status */}
        {!hideTimestamp && (
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
            <span>{format(new Date(ensureUTC(message.created_at)), "h:mm a")}</span>
            {isOwn && (
              <span className={isRead ? "text-blue-500" : "text-slate-300"}>
                {isRead ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              </span>
            )}
          </div>
        )}
      </div>

      {isOwn && (
        <div className="w-8 h-8 ml-2 flex-shrink-0 mt-auto">
          {!hideAvatar && (
            <div className="w-full h-full rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-medium text-xs overflow-hidden shadow-sm">
              {senderAvatar ? (
                <img src={senderAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                senderName ? senderName.charAt(0).toUpperCase() : "U"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
