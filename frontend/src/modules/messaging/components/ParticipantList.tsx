import React from "react";
import { User, Shield } from "lucide-react";
import { ConversationParticipant } from "../store/ChatContext"; // Assuming exported from there

interface ParticipantListProps {
  participants: ConversationParticipant[];
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ participants }) => {
  return (
    <div className="flex flex-col space-y-3">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Members ({participants.length})</h3>
      <div className="space-y-3">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              {p.display_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {p.display_name || "Unknown User"}
              </p>
              <p className="text-xs text-gray-500 flex items-center mt-0.5">
                {p.role === "admin" ? <Shield className="w-3 h-3 mr-1 text-red-500" /> : <User className="w-3 h-3 mr-1" />}
                <span className="capitalize">{p.role || "Member"}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
