import React from "react";
import { Message, Attachment } from "../store/ChatContext";
import { FileText, Download, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { wsService } from "../services/websocket";
import { Calendar, Clock, BarChart2 } from "lucide-react";

export function MessageBubble({ 
  message, 
  isOwn,
  isRead,
  senderName,
  showName
}: { 
  message: Message, 
  isOwn: boolean,
  isRead?: boolean,
  senderName?: string,
  showName?: boolean
}) {
  const metadata = typeof message.metadata_json === 'string' 
    ? JSON.parse(message.metadata_json) 
    : message.metadata_json;

  return (
    <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium mr-2 flex-shrink-0 mt-auto text-xs">
          {senderName ? senderName.charAt(0).toUpperCase() : "U"}
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
                : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
            }`}
          >
            {message.content}
          </div>
        )}

        {/* Poll Widget */}
        {message.message_type === "poll" && metadata && (
          <div className="w-64 bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 shadow-sm text-sm text-gray-900 dark:text-gray-100">
            <div className="flex items-center space-x-2 font-medium mb-3">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              <span>{metadata.question || "Poll"}</span>
            </div>
            <div className="space-y-2">
              {metadata.options?.map((opt: any) => {
                const votesForOption = (message.poll_votes || []).filter(v => v.option_id === opt.id).length;
                const totalVotes = message.poll_votes?.length || 0;
                const percent = totalVotes > 0 ? Math.round((votesForOption / totalVotes) * 100) : 0;
                const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                const hasVotedOpt = (message.poll_votes || []).some(v => v.user_id === currentUser.id && v.option_id === opt.id);

                return (
                  <button 
                    key={opt.id}
                    onClick={() => {
                      wsService.send({
                        type: "poll_vote",
                        conversation_id: message.conversation_id,
                        message_id: message.id,
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
          </div>
        )}

        {/* Deadline Widget */}
        {message.message_type === "deadline" && metadata && (
          <div className="w-64 bg-white border border-red-200 dark:border-red-900/30 dark:bg-gray-800 rounded-xl p-3 shadow-sm text-sm text-gray-900 dark:text-gray-100">
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
        <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
          <span>{format(new Date(message.created_at), "h:mm a")}</span>
          {isOwn && (
            <span className={isRead ? "text-blue-500" : "text-slate-300"}>
              {isRead ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
