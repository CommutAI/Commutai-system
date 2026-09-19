import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiCalls } from "../../lib/api";
import { supabase } from '@commutai/supabase';
import type { QRCard } from '../types';
import { Users, DollarSign, CreditCard, TrendingUp, RefreshCw, Clock, type LucideIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@commutai/ui';

const KPICard = ({ title, value, change, icon: Icon, color }: { title: string; value: string | number; change: string; icon: LucideIcon; color: string }) => (
  <div className="glass-card p-6 hover:scale-105 transition-transform duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className={`text-sm ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
        {change}
      </span>
    </div>
    <h3 className="text-white/60 text-sm mb-1">{title}</h3>
    <p className="text-white text-3xl font-bold">{value}</p>
  </div>
);

const ShortcutCard = ({ title, value, icon: Icon, color, link, onClick }: { title: string; value: string; icon: LucideIcon; color: string; link: string; onClick: (link: string) => void }) => (
  <Button
    onClick={() => onClick(link)}
    variant="secondary"
    className="block border border-white/20 rounded-2xl hover:border-white/30 transition-colors p-0"
  >
    <div className="glass-card p-4 hover:scale-105 transition-transform duration-300 cursor-pointer w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs">{title}</p>
            <p className="text-white font-bold">{value}</p>
          </div>
        </div>
      </div>
    </div>
  </Button>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: apiCalls.getDashboardStats,
  });

  const { data: cards } = useQuery({
    queryKey: ['qrCards'],
    queryFn: apiCalls.getQRCards,
  });

  const { data: tempCards } = useQuery({
    queryKey: ['temporaryQRCards'],
    queryFn: apiCalls.getTemporaryQRCards,
  });

  const { data: reservations, error: reservationsError } = useQuery({
    queryKey: ['cardReservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_reservations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching reservations:', error);
        return []; // Return empty array on error
      }
      return data;
    },
  });

  // Calculate card type distribution
  const cardTypeData = [
    { name: 'Regular', value: cards?.filter((c: QRCard) => c.card_type === 'regular').length || 0, color: '#3b82f6' },
    { name: 'Student', value: cards?.filter((c: QRCard) => c.card_type === 'student').length || 0, color: '#10b981' },
    { name: 'Senior Citizen', value: cards?.filter((c: QRCard) => c.card_type === 'senior_citizen').length || 0, color: '#f97316' },
    { name: 'PWD', value: cards?.filter((c: QRCard) => c.card_type === 'pwd').length || 0, color: '#8b5cf6' },
    { name: 'Temporary', value: tempCards?.length || 0, color: '#f59e0b' },
  ];

  // Mock weekly data (replace with real data from API)
  const weeklyData = [
    { day: 'Mon', transactions: 12, revenue: 450 },
    { day: 'Tue', transactions: 19, revenue: 720 },
    { day: 'Wed', transactions: 15, revenue: 580 },
    { day: 'Thu', transactions: 22, revenue: 850 },
    { day: 'Fri', transactions: 28, revenue: 1100 },
    { day: 'Sat', transactions: 35, revenue: 1400 },
    { day: 'Sun', transactions: 18, revenue: 690 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-white/60">Loading data...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { title: "Today's Registrations", value: (stats as any)?.todayRegistrations || 0, change: '+12%', icon: Users, color: 'bg-blue-500' },
    { title: "Today's Reloads", value: (stats as any)?.todayTopUps || 0, change: '+8%', icon: DollarSign, color: 'bg-green-500' },
    { title: "Today's Transactions", value: (stats as any)?.todayTransactions || 0, change: '+15%', icon: CreditCard, color: 'bg-purple-500' },
    { title: "Total Revenue", value: `₱${((stats as any)?.totalRevenue || 0).toFixed(2)}`, change: '+12%', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const pendingReservations = reservations?.filter((r: any) => r.status === 'pending').length || 0;
  const totalReservations = reservations?.length || 0;

  return (
    <div className="h-full overflow-y-auto pr-1">
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-white/60">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-white text-xl font-bold mb-6">Weekly Transactions</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
              <Bar dataKey="transactions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-white text-xl font-bold mb-6">Weekly Revenue</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white'
                }}
                formatter={(value) => [`₱${value}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-white text-xl font-bold mb-6">Card Type Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={cardTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {cardTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {cardTypeData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-white/60">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-bold">Card Reservations</h2>
            <Button
              onClick={() => navigate('/customer-service/card-reservations')}
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-sm px-4 py-2"
            >
              View All ({totalReservations})
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center justify-between p-4 bg-white/10 rounded-xl">
                <div>
                  <p className="text-sm text-white/60">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{pendingReservations}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-between p-4 bg-white/10 rounded-xl">
                <div>
                  <p className="text-sm text-white/60">Total</p>
                  <p className="text-2xl font-bold text-blue-400">{totalReservations}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <p className="text-xs text-white/40 font-semibold uppercase">Pending Reservations ({pendingReservations})</p>
              {reservations?.filter((r: any) => r.status === 'pending').slice(0, 3).map((reservation: any) => (
                <div key={reservation.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-white font-medium">{reservation.name || 'Unknown'}</p>
                  <p className="text-xs text-white/60">{reservation.contact || 'No contact info'}</p>
                </div>
              ))}
              {pendingReservations === 0 && (
                <p className="text-xs text-white/40 text-center py-2">No pending reservations</p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-white text-xl font-bold mb-6">Reservation Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Pending', value: pendingReservations, color: '#fbbf24' },
              { name: 'Approved', value: reservations?.filter((r: any) => r.status === 'approved').length || 0, color: '#10b981' },
              { name: 'Rejected', value: reservations?.filter((r: any) => r.status === 'rejected').length || 0, color: '#ef4444' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {[
                  { name: 'Pending', color: '#fbbf24' },
                  { name: 'Approved', color: '#10b981' },
                  { name: 'Rejected', color: '#ef4444' },
                ].map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
    </div>
  );
}
