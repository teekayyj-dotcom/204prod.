import React, { useState } from "react";
import { Attachment } from "../store/ChatContext";
import { FileText, File as FileIcon, ImageIcon as ImageIcon, Film, Link } from "lucide-react";

interface MediaGalleryProps {
  media: Attachment[];
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  const [activeTab, setActiveTab] = useState<"images" | "videos" | "files" | "links">("images");

  const images = media.filter(m => m.file_type.startsWith("image/"));
  const videos = media.filter(m => m.file_type.startsWith("video/"));
  const files = media.filter(m => !m.file_type.startsWith("image/") && !m.file_type.startsWith("video/"));
  const links: any[] = []; // Placeholder for actual link extraction

  const getActiveList = () => {
    switch (activeTab) {
      case "images": return images;
      case "videos": return videos;
      case "files": return files;
      case "links": return links;
      default: return [];
    }
  };

  const currentMedia = getActiveList();

  const renderIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (type.startsWith("video/")) return <Film className="w-5 h-5" />;
    if (type.includes("pdf")) return <FileText className="w-5 h-5" />;
    return <FileIcon className="w-5 h-5" />;
  };

  const tabs = [
    { id: "images", label: "Images", count: images.length },
    { id: "videos", label: "Videos", count: videos.length },
    { id: "files", label: "Files", count: files.length },
    { id: "links", label: "Links", count: links.length },
  ];

  return (
    <div className="flex flex-col space-y-4">
      {/* Mini Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {currentMedia.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-8">
          No {activeTab} shared yet.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {currentMedia.map((item) => (
            <a
              key={item.id}
              href={item.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity"
              title={item.file_name}
            >
              {item.file_type.startsWith("image/") ? (
                <img
                  src={item.file_url}
                  alt={item.file_name}
                  className="w-full h-full object-cover"
                />
              ) : item.file_type.startsWith("video/") ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                   <Film className="w-6 h-6 text-white/50" />
                   {/* We could use an actual video element to show a thumbnail, but keeping it simple */}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                  {renderIcon(item.file_type)}
                  <span className="text-[10px] mt-1 truncate w-full text-center px-1">
                    {item.file_name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </span>
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
