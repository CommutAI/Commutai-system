import { useEffect, useState } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  Bell, CheckCircle, Clock, AlertTriangle, Info,
  Filter, RefreshCw, X, Navigation, MapPin, Bus,
  Settings, MessageSquare, Play
} from 'lucide-react';
import type { DriverNotification } from '../types';

const NOTIFICATION_ICONS: Record<string, any> = {
  trip_assigned: Navigation,
  trip_starting: Play,
  gps_disconnected: MapPin,
  gps_restored: MapPin,
  emergency: AlertTriangle,
  operator_message: MessageSquare,
  system_maintenance: Settings,
  route_announcement: Navigation,
  bus_status_warning: Bus
};

const NOTIFICATION_LABELS: Record<string, string> = {
  trip_assigned: 'Trip Assigned',
  trip_starting: 'Trip Starting',
  gps_disconnected: 'GPS Disconnected',
  gps_restored: 'GPS Restored',
  emergency: 'Emergency',
  operator_message: 'Operator Message',
  system_maintenance: 'System Maintenance',
  route_announcement: 'Route Announcement',
  bus_status_warning: 'Bus Status Warning'
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'emergency' | 'warning' | 'info'>('all');

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('driver-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        void fetchNotifications();
      })
      .subscribe();

    return () => {
      void subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('id')
        .eq('email', 'driver@commutai.test') // Using actual driver email from database
        .single() as any);

      if (!staffData) return;

      // Fetch notifications for this driver
      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('driver_id', staffData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Generate sample notifications for demo
      generateSampleNotifications();
      setLoading(false);
    }
  };

  const generateSampleNotifications = () => {
    const sampleNotifications: DriverNotification[] = [
      {
        id: '1',
        driver_id: 'driver-1',
        type: 'trip_assigned',
        message: 'New trip assigned: Manolo Fortich → Cagayan de Oro departing at 6:30 AM',
        priority: 'info',
        read: false,
        created_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: '2',
        driver_id: 'driver-1',
        type: 'gps_disconnected',
        message: 'GPS signal lost. Attempting to reconnect...',
        priority: 'warning',
        read: false,
        created_at: new Date(Date.now() - 900000).toISOString()
      },
      {
        id: '3',
        driver_id: 'driver-1',
        type: 'gps_restored',
        message: 'GPS signal restored. Location tracking active.',
        priority: 'info',
        read: true,
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '4',
        driver_id: 'driver-1',
        type: 'operator_message',
        message: 'Please take the alternate route due to road construction on Highway 1.',
        priority: 'warning',
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '5',
        driver_id: 'driver-1',
        type: 'bus_status_warning',
        message: 'Engine temperature slightly elevated. Monitor during trip.',
        priority: 'warning',
        read: true,
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '6',
        driver_id: 'driver-1',
        type: 'route_announcement',
        message: 'Schedule change: Morning departures delayed by 15 minutes starting tomorrow.',
        priority: 'info',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    setNotifications(sampleNotifications);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await (supabase
        .from('notifications') as any)
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Optimistic update for demo
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length > 0) {
        await (supabase
          .from('notifications') as any)
          .update({ read: true })
          .in('id', unreadIds);

        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Optimistic update for demo
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await (supabase
        .from('notifications') as any)
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Optimistic update for demo
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info':
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-500/20 text-red-400';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'info':
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getNotificationIcon = (type: string) => {
    const IconComponent = NOTIFICATION_ICONS[type] || Bell;
    return <IconComponent className="text-white/60" size={20} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'emergency') return n.priority === 'emergency';
    if (filter === 'warning') return n.priority === 'warning';
    if (filter === 'info') return n.priority === 'info';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const emergencyCount = notifications.filter(n => n.priority === 'emergency').length;
  const warningCount = notifications.filter(n => n.priority === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-white/60">Important alerts and system messages</p>
        </div>
        <button
          onClick={() => void fetchNotifications()}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Refresh notifications"
        >
          <RefreshCw className="text-white" size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total</p>
              <p className="text-white font-bold text-xl">{notifications.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Unread</p>
              <p className="text-white font-bold text-xl">{unreadCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Emergency</p>
              <p className="text-white font-bold text-xl">{emergencyCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Warnings</p>
              <p className="text-white font-bold text-xl">{warningCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="text-white/60" size={20} />
            <span className="text-white/60 text-sm">Filter:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'all' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'unread' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('emergency')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'emergency' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Emergency ({emergencyCount})
              </button>
              <button
                onClick={() => setFilter('warning')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'warning' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Warnings ({warningCount})
              </button>
              <button
                onClick={() => setFilter('info')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'info' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Info
              </button>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-sm"
            >
              <CheckCircle size={16} />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="glass-card p-8 text-center">
          <div className="text-white">Loading notifications...</div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Bell className="text-white/40 mx-auto mb-4" size={48} />
          <p className="text-white/60">No notifications found</p>
          <p className="text-white/40 text-sm mt-2">
            {filter === 'unread' ? 'All notifications have been read' : 'No notifications available'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`glass-card p-4 border transition-all ${
                !notification.read ? 'border-l-4 border-l-orange-500' : ''
              } ${getPriorityColor(notification.priority)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {!notification.read && (
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                        New
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityBadge(notification.priority)}`}>
                      {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                    </span>
                    <span className="text-white/40 text-xs">
                      {NOTIFICATION_LABELS[notification.type] || notification.type}
                    </span>
                  </div>
                  <p className="text-white mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatDate(notification.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={() => void markAsRead(notification.id)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle size={16} className="text-white/60" />
                    </button>
                  )}
                  <button
                    onClick={() => void deleteNotification(notification.id)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Delete notification"
                  >
                    <X size={16} className="text-white/60" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Information Card */}
      <div className="glass-card p-4 border border-orange-500/30">
        <div className="flex items-start gap-3">
          <Info className="text-orange-400 size={20} flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium mb-1">About Notifications</p>
            <p className="text-white/60 text-sm">
              Notifications provide real-time updates about trip assignments, GPS status, emergency alerts,
              operator messages, and system events. Emergency notifications are visually prominent and require immediate attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}