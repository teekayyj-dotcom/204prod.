import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { fetchApi } from '../../modules/admin/utils/apiClient';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface NotificationItem {
    id: number;
    user_id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export const NotificationBell = ({ userId, placement = 'bottom-right' }: { userId: string; placement?: 'bottom-right' | 'top-left' | 'top-right' }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await fetchApi<NotificationItem[]>(`/notifications?user_id=${userId}`);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId || userId === "Unknown") return;
        
        loadNotifications();
        
        // Simple polling fallback (reduce frequency since we have WS)
        const interval = setInterval(loadNotifications, 60000);
        
        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connectWebSocket = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Determine base URL, if running locally vite proxy might handle it, or we use relative path
            const host = window.location.host;
            ws = new WebSocket(`${protocol}//${host}/api/v1/notifications/ws/${encodeURIComponent(userId)}`);

            ws.onmessage = (event) => {
                try {
                    const newNotif = JSON.parse(event.data) as NotificationItem;
                    
                    if (newNotif.type === "silent_kanban_update") {
                        window.dispatchEvent(new CustomEvent('kanban_update', { detail: newNotif }));
                        return; // Do not show notification
                    }

                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    
                    toast.info(newNotif.title, {
                        id: `notif-${newNotif.id}`,
                        description: newNotif.message,
                        duration: 5000,
                        action: newNotif.link ? {
                            label: 'Xem',
                            onClick: () => {
                                handleNotificationClick(newNotif);
                            }
                        } : undefined,
                    });
                } catch (err) {
                    console.error("Error parsing WS message", err);
                }
            };

            ws.onclose = () => {
                // Attempt to reconnect after 3 seconds
                reconnectTimeout = setTimeout(connectWebSocket, 3000);
            };
        };

        connectWebSocket();

        return () => {
            clearInterval(interval);
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (ws) {
                ws.onclose = null; // Prevent reconnect on unmount
                ws.close();
            }
        };
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetchApi(`/notifications/${id}/read?user_id=${userId}`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking as read", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await fetchApi(`/notifications/read-all?user_id=${userId}`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Error marking all as read", err);
        }
    };

    const handleNotificationClick = async (notif: NotificationItem) => {
        if (!notif.is_read) {
            try {
                await fetchApi(`/notifications/${notif.id}/read?user_id=${userId}`, { method: 'PUT' });
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) {}
        }
        setIsOpen(false);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN', { 
            hour: '2-digit', minute: '2-digit', 
            day: '2-digit', month: '2-digit' 
        });
    };

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Thông báo"
            >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute ${placement === 'top-left' ? 'bottom-full mb-2 left-0' : placement === 'top-right' ? 'bottom-full mb-2 right-0' : 'top-full mt-2 right-0'} w-80 max-h-[80vh] flex flex-col bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-[9999] overflow-hidden`}>
                    <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                                Đánh dấu đã đọc tất cả
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {loading && notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center">
                                <Bell size={32} className="mb-3 opacity-20" />
                                Không có thông báo nào
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map(notif => (
                                    <div 
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`flex flex-col p-3 border-b border-gray-100 dark:border-gray-800/50 cursor-pointer transition-colors ${notif.is_read ? 'opacity-70 hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <h4 className={`text-sm ${notif.is_read ? 'font-medium' : 'font-bold'} text-gray-900 dark:text-gray-100`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 block font-mono">
                                                    {formatTime(notif.created_at)}
                                                </span>
                                            </div>
                                            {!notif.is_read && (
                                                <button 
                                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                    className="p-1 text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-800 rounded-full shadow-sm"
                                                    title="Đánh dấu đã đọc"
                                                >
                                                    <Check size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
