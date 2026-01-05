import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [,setUnreadCount] = useState(0);

  const onRead = (count: number) => setUnreadCount(count);
  const onReadAll = (count: number) => setUnreadCount(count);

  useEffect(() => {
    const handleGlobalUpdate = () => {
      fetchData(); 
    };
    window.addEventListener('notificationUpdate', handleGlobalUpdate);
    return () => window.removeEventListener('notificationUpdate', handleGlobalUpdate);
  }, []);


  const handleItemClick = async (id: string, link?: string) => {
    try {
      setList(prevList => 
        prevList.map(item => item.id === id ? { ...item, is_read: true } : item)
      );
      const res = await apiFetch<{ unreadCount: number }>(`/notifications/${id}/read`, { method: "PATCH" });
      onRead(res.unreadCount);
      window.dispatchEvent(new Event('notificationUpdate'));
      if (link) navigate(link);
    } catch (e) { console.error(e); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setList(prevList => prevList.map(item => ({ ...item, is_read: true })));
      const res = await apiFetch<{ unreadCount: number }>(`/notifications/readAll`, { method: "PATCH" });
      onReadAll(res.unreadCount);
      window.dispatchEvent(new Event('notificationUpdate'));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await apiFetch<{ notifications: NotificationItem[] }>('/notifications');
      setList(res.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'alert': return '🚨';
      case 'success': return '🎉';
      case 'reminder': return '⏰';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="flex flex-row justify-between items-center my-4">
        <h1 className="text-2xl font-bold text-[#1A381D]">Notifications</h1>
        <button 
        onClick={handleMarkAllAsRead}
        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-[#2A4A2D] hover:bg-[#24412A] rounded-full transition-colors cursor-pointer">
          Mark All as Read
        </button>
        </div>
        
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {list.length === 0 ? (
              <div className="p-8 text-center text-gray-500">You're all caught up!</div>
            ) : (
              <ul>
                {list.map(n => (
                  <li key={n.id} 
                  onClick={() => handleItemClick(n.id, (n as any).action_link)}
                  className={`p-4 border-b border-gray-200 flex gap-4 cursor-pointer hover:bg-gray-100 ${!n.is_read ? 'bg-[#F0FDF4]' : ''}`}>
                    <span className="text-xl mt-1">{getIcon(n.type)}</span>
                    <div className="flex-1">
                      <p className={`text-sm ${!n.is_read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {n.message}
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleString('en-MY', { timeZone: 'UTC' })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}