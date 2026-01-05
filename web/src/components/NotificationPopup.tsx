import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

interface NotificationItem {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  action_link?: string;
}

export function NotificationPopup({ 
  onClose, 
  onRead,
  onReadAll,
}: { 
  onClose: () => void, 
  onRead: (unreadCount: number) => void,
  onReadAll: (unreadCount: number) => void, 
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ notifications: NotificationItem[] }>('/notifications?limit=5')
      .then(res => setNotifications(res.notifications))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClick = async (id: string, link?: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      const res = await apiFetch<{ unreadCount: number }>(`/notifications/${id}/read`, { method: "PATCH" });
      onRead(res.unreadCount);  // Decrease unread count
      window.dispatchEvent(new Event('notificationUpdate'));          
      onClose();                // Close popup
      if (link) navigate(link); // Navigate if link exists
    } catch (e) {
      console.error(e);
    }
  };

   const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      const res = await apiFetch<{ unreadCount: number }>(`/notifications/readAll`, { method: "PATCH" });
      onReadAll(res.unreadCount);
      window.dispatchEvent(new Event('notificationUpdate'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Close popup when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 md:w-72 sm:w-64 origin-top-right rounded-xl border border-gray-100 bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-900">Recent Notifications</h3>
        </div>
        
        <ul className="max-h-80 overflow-y-auto">
          {loading ? (
             <li className="px-4 py-6 text-center text-xs text-gray-500 animate-pulse">
               Loading notifications...
             </li>
          ) :
          notifications.length === 0 ? (
             <li className="px-4 py-6 text-center text-xs text-gray-500">No new notifications</li>
          ) : (
            notifications.map((n) => (
              <li 
                key={n.id} 
                onClick={() => handleClick(n.id, n.action_link)}
                className={`px-4 py-3 hover:bg-gray-200 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${!n.is_read ? 'bg-[#F0FDF4]' : 'bg-white'}`}
              >
                <div className="flex gap-2 justify-between">
                  <div>
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString('en-MY', { timeZone: 'UTC' })}
                    </p>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 mt-1.5 rounded-full bg-[#34A853] shrink-0" />}
                </div>
              </li>
            ))
          )}
        </ul>
        
        <div className="border-t border-gray-100 bg-gray-50">
          <button 
            onClick={() => { navigate('/notifications'); onClose(); }}
            className="w-full py-2 text-sm font-bold text-[#2A4A2D] hover:bg-gray-200 transition cursor-pointer border-t border-gray-200 border-solid"
          >
            View All Notifications
          </button>
          <button 
            onClick={() => handleMarkAllAsRead() }
            className="w-full py-2 text-sm font-bold text-[#2A4A2D] hover:bg-gray-200 transition cursor-pointer border-t border-gray-200 border-solid"
          >
            Mark All as Read
          </button>
        </div>
      </div>
    </>
  );
}