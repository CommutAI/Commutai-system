import { useQuery } from '@tanstack/react-query';
import { apiCalls } from "../../lib/api";
import { supabase } from '@commutai/supabase';
import type { Transaction, QRCard } from '../types';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
  BarChart, Bar, Cell
} from 'recharts';
import {
  TrendingUp, CreditCard, DollarSign, Users,
  Download
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Button, Input } from '@commutai/ui';

export default function Reports() {
  const [dateRange, setDateRange] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('weekly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data: cards } = useQuery({
    queryKey: ['qrCards'],
    queryFn: apiCalls.getQRCards,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: apiCalls.getTransactions,
  });

  const { data: reservations } = useQuery({
    queryKey: ['cardReservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_reservations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate card type distribution
  const cardTypeData = [
    { name: 'Regular', value: cards?.filter((c: QRCard) => c.card_type === 'regular').length || 0, color: '#3b82f6' },
    { name: 'Student', value: cards?.filter((c: QRCard) => c.card_type === 'student').length || 0, color: '#10b981' },
    { name: 'Senior Citizen', value: cards?.filter((c: QRCard) => c.card_type === 'senior_citizen').length || 0, color: '#f97316' },
    { name: 'PWD', value: cards?.filter((c: QRCard) => c.card_type === 'pwd').length || 0, color: '#8b5cf6' },
  ];

  // Calculate transaction type distribution
  const transactionTypeData = [
    { name: 'Card Issuance/Reload', value: transactions?.filter((t: Transaction) => t.type === 'card_issuance').length || 0, color: '#10b981' },
    { name: 'Fare Validation', value: transactions?.filter((t: Transaction) => t.type === 'fare_validation').length || 0, color: '#3b82f6' },
  ];


  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (dateRange) {
      case 'weekly':
        cutoffDate.setDate(now.getDate() - 7);
        return transactions.filter((t: Transaction) => new Date(t.timestamp || t.created_at) >= cutoffDate);
      case 'monthly':
        cutoffDate.setMonth(now.getMonth() - 1);
        return transactions.filter((t: Transaction) => new Date(t.timestamp || t.created_at) >= cutoffDate);
      case 'yearly':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        return transactions.filter((t: Transaction) => new Date(t.timestamp || t.created_at) >= cutoffDate);
      case 'custom':
        if (!startDate || !endDate) return transactions;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include end date
        return transactions.filter((t: Transaction) => {
          const transactionDate = new Date(t.timestamp || t.created_at);
          return transactionDate >= start && transactionDate <= end;
        });
      default:
        return transactions;
    }
  }, [transactions, dateRange, startDate, endDate]);

  // Calculate transaction data based on date range
  const chartData = useMemo(() => {
    if (!filteredTransactions.length) return [];
    
    const groupedData: Record<string, { transactions: number; revenue: number }> = {};
    
    filteredTransactions.forEach((t: Transaction) => {
      const date = new Date(t.timestamp || t.created_at);
      let key: string;
      
      switch (dateRange) {
        case 'weekly':
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'monthly':
          key = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          break;
        case 'yearly':
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        case 'custom':
          key = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          break;
        default:
          key = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { transactions: 0, revenue: 0 };
      }
      groupedData[key].transactions += 1;
      groupedData[key].revenue += Math.abs(t.amount);
    });
    
    return Object.entries(groupedData).map(([date, data]) => ({
      date,
      transactions: data.transactions,
      revenue: data.revenue,
    }));
  }, [filteredTransactions, dateRange]);

  // Calculate card status distribution
  const cardStatusData = [
    { name: 'Active', value: cards?.filter((c: QRCard) => c.status === 'active').length || 0, color: '#10b981' },
    { name: 'Deactivated', value: cards?.filter((c: QRCard) => c.status === 'deactivated').length || 0, color: '#ef4444' },
    { name: 'Lost', value: cards?.filter((c: QRCard) => c.status === 'lost').length || 0, color: '#f97316' },
    { name: 'Replaced', value: cards?.filter((c: QRCard) => c.status === 'replaced').length || 0, color: '#8b5cf6' },
  ];

  // Calculate reservation status distribution
  const reservationStatusData = [
    { name: 'Pending', value: reservations?.filter((r: any) => r.status === 'pending').length || 0, color: '#f59e0b' },
    { name: 'Approved', value: reservations?.filter((r: any) => r.status === 'approved').length || 0, color: '#10b981' },
    { name: 'Issued', value: reservations?.filter((r: any) => r.status === 'issued').length || 0, color: '#3b82f6' },
    { name: 'Denied', value: reservations?.filter((r: any) => r.status === 'denied').length || 0, color: '#ef4444' },
    { name: 'Expired', value: reservations?.filter((r: any) => r.status === 'expired').length || 0, color: '#6b7280' },
  ];

  // Calculate total revenue based on filtered transactions
  const totalRevenue = filteredTransactions.reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);
  const totalReloads = filteredTransactions.filter((t: Transaction) => t.type === 'card_issuance').length;
  const totalCards = cards?.length || 0;
  const totalReservations = reservations?.length || 0;
  const pendingReservations = reservations?.filter((r: any) => r.status === 'pending').length || 0;

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₱${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Total Cards',
      value: totalCards,
      icon: CreditCard,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Reloads',
      value: totalReloads,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Card Reservations',
      value: `${pendingReservations}/${totalReservations}`,
      icon: Users,
      gradient: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="h-full overflow-y-auto pr-1">
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Reports & Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg border border-white/20 p-1">
              {(['weekly', 'monthly', 'yearly', 'custom'] as const).map((range) => (
                <Button
                  key={range}
                  onClick={() => setDateRange(range)}
                  variant={dateRange === range ? 'primary' : 'secondary'}
                  size="sm"
                  className={dateRange === range ? 'bg-primary-500 border-primary-400' : 'text-white/60 border-transparent'}
                >
                  {range === 'weekly' ? 'Weekly' : range === 'monthly' ? 'Monthly' : range === 'yearly' ? 'Yearly' : 'Custom'}
                </Button>
              ))}
            </div>
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg border border-white/20 p-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/60" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <span className="text-white/60">to</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/60" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            )}
          </div>
          <Button variant="secondary" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`bg-linear-to-br ${stat.gradient} p-4 rounded-2xl shadow-soft`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            {dateRange === 'custom' 
              ? 'Custom Range' 
              : dateRange === 'weekly' 
                ? 'Weekly' 
                : dateRange === 'monthly' 
                  ? 'Monthly' 
                  : 'Yearly'} Transactions
          </h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                  formatter={(value) => [value, 'Transactions']}
                />
                <Area type="monotone" dataKey="transactions" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            {dateRange === 'custom' 
              ? 'Custom Range' 
              : dateRange === 'weekly' 
                ? 'Weekly' 
                : dateRange === 'monthly' 
                  ? 'Monthly' 
                  : 'Yearly'} Revenue
          </h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" fontSize={12} />
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
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Card Type Distribution</h2>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cardTypeData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} tick={{ fill: 'rgba(255,255,255,0.6)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                  formatter={(value) => [value, 'Cards']}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Cards">
                  {cardTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Transaction Types</h2>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionTypeData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} tick={{ fill: 'rgba(255,255,255,0.6)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                  formatter={(value) => [value, 'Transactions']}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Transactions">
                  {transactionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Status Chart */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Card Status Distribution</h2>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cardStatusData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={12} tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} tick={{ fill: 'rgba(255,255,255,0.6)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                  formatter={(value) => [value, 'Cards']}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Cards">
                  {cardStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Reservations Chart */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Card Reservation Status</h2>
          {reservationStatusData.every(d => d.value === 0) ? (
            <div className="flex flex-col items-center justify-center text-white/40" style={{ height: 250 }}>
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No reservation data available</p>
            </div>
          ) : (
            <>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reservationStatusData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                    <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} tick={{ fill: 'rgba(255,255,255,0.6)' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white'
                      }}
                      formatter={(value) => [value, 'Reservations']}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Reservations">
                      {reservationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
