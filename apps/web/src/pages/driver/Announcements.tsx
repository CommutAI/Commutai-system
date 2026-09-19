import { useEffect, useState } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  Bell, CheckCircle, Clock, AlertTriangle, Info,
  Filter, RefreshCw, ExternalLink
} from 'lucide-react';
import type { Announcement } from '../types';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'emergency'>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetchAnnouncements();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('driver-announcements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, () => {
        void fetchAnnouncements();
      })
      .subscribe();

    return () => {
      void subscription.unsubscribe();
    };
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('id')
        .eq('email', 'driver@example.com')
        .single() as any);

      if (!staffData) return;

      // Fetch announcements - in a real system, this would be filtered by recipient
      const { data, error } = await (supabase
        .from('announcements') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mark as read locally when viewing
      const processedData = (data || []).map((a: Announcement) => ({
        ...a,
        read: a.read || false
      }));

      setAnnouncements(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (announcementId: string) => {
    try {
      await (supabase
        .from('announcements') as any)
        .update({ read: true })
        .eq('id', announcementId);

      setAnnouncements(prev =>
        prev.map(a => a.id === announcementId ? { ...a, read: true } : a)
      );
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = announcements.filter(a => !a.read).map(a => a.id);
      
      if (unreadIds.length > 0) {
        await (supabase
          .from('announcements') as any)
          .update({ read: true })
          .in('id', unreadIds);

        setAnnouncements(prev =>
          prev.map(a => ({ ...a, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return <AlertTriangle className="text-red-400" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-400" size={20} />;
      case 'info':
      default:
        return <Info className="text-blue-400" size={20} />;
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

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (filter === 'unread') return !a.read;
    if (filter === 'emergency') return a.priority === 'emergency';
    return true;
  });

  const unreadCount = announcements.filter(a => !a.read).length;
  const emergencyCount = announcements.filter(a => a.priority === 'emergency').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Announcements</h1>
          <p className="text-white/60">Important updates from operators and administrators</p>
        </div>
        <button
          onClick={() => void fetchAnnouncements()}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Refresh announcements"
        >
          <RefreshCw className="text-white" size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total</p>
              <p className="text-white font-bold text-xl">{announcements.length}</p>
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
      </div>

      {/* Filter and Actions */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="text-white/60" size={20} />
            <span className="text-white/60 text-sm">Filter:</span>
            <div className="flex gap-2">
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

      {/* Announcements List */}
      {loading ? (
        <div className="glass-card p-8 text-center">
          <div className="text-white">Loading announcements...</div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Bell className="text-white/40 mx-auto mb-4" size={48} />
          <p className="text-white/60">No announcements found</p>
          <p className="text-white/40 text-sm mt-2">
            {filter === 'unread' ? 'All announcements have been read' : 'No announcements available'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`glass-card p-6 border transition-all cursor-pointer hover:bg-white/5 ${
                !announcement.read ? 'border-l-4 border-l-orange-500' : ''
              } ${getPriorityColor(announcement.priority)}`}
              onClick={() => {
                setSelectedAnnouncement(announcement);
                if (!announcement.read) {
                  void markAsRead(announcement.id);
                }
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(announcement.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold text-lg">{announcement.title}</h3>
                      {!announcement.read && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                          New
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityBadge(announcement.priority)}`}>
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                      </span>
                    </div>
                    <p className="text-white/70 mb-3">{announcement.message}</p>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDate(announcement.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>From: {announcement.sender}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ExternalLink className="text-white/40 flex-shrink-0" size={20} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getPriorityIcon(selectedAnnouncement.priority)}
                <h2 className="text-xl font-bold text-white">{selectedAnnouncement.title}</h2>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="mb-4">
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${getPriorityBadge(selectedAnnouncement.priority)}`}>
                {selectedAnnouncement.priority.charAt(0).toUpperCase() + selectedAnnouncement.priority.slice(1)}
              </span>
            </div>

            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-white whitespace-pre-wrap">{selectedAnnouncement.message}</p>
            </div>

            <div className="space-y-2 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{formatFullDate(selectedAnnouncement.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>From: {selectedAnnouncement.sender}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="primary-btn primary-btn--secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Information Card */}
      <div className="glass-card p-4 border border-orange-500/30">
        <div className="flex items-start gap-3">
          <Info className="text-orange-400 size={20} flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium mb-1">About Announcements</p>
            <p className="text-white/60 text-sm">
              Announcements are sent by operators and system administrators to communicate important information
              about routes, schedules, safety reminders, and system updates. Drivers can view and mark announcements as read.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}