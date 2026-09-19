import { supabase } from '@commutai/supabase';

export const apiCalls = {
  // QR Card operations
  getQRCards: async () => {
    const { data, error } = await supabase.from('qr_cards').select('*');
    if (error) throw error;
    return data;
  },
  
  getTemporaryQRCards: async () => {
    // Use the temporary_tickets table instead of qr_cards
    const { data, error } = await supabase.from('temporary_tickets').select('*');
    if (error) throw error;
    return data;
  },
  
  createQRCard: async (cardData: any) => {
    const { data, error } = await (supabase.from('qr_cards').insert([cardData] as any).select() as any);
    if (error) throw error;
    return data;
  },
  
  createTemporaryQRCard: async (fareAmount: number = 12) => {
    const { data, error } = await (supabase.from('temporary_tickets').insert([{
      ticket_uid: `TEMP-${Date.now()}`,
      fare_amount: fareAmount,
      status: 'issued',
      allowed_routes: []
    }] as any).select() as any);
    if (error) throw error;
    return data;
  },
  
  deactivateTemporaryQRCard: async (ticketUid: string) => {
    const { data, error } = await (supabase.from('temporary_tickets') as any).update({ status: 'expired' }).eq('ticket_uid', ticketUid).select();
    if (error) throw error;
    return data;
  },
  
  updateQRCard: async (id: string, cardData: any) => {
    const { data, error } = await (supabase.from('qr_cards') as any).update(cardData).eq('id', id).select();
    if (error) throw error;
    return data;
  },
  
  deleteQRCard: async (id: string) => {
    const { error } = await (supabase.from('qr_cards').delete().eq('id', id) as any);
    if (error) throw error;
  },
  
  // Additional QR Card operations
  issueQRCard: async (cardData: any) => {
    const { data, error } = await (supabase.from('qr_cards').insert([cardData] as any).select() as any);
    if (error) throw error;
    return data;
  },
  
  activateQR: async (cardUid: string) => {
    const { data, error } = await (supabase.from('qr_cards') as any).update({ status: 'active' }).eq('card_uid', cardUid).select();
    if (error) throw error;
    return data;
  },
  
  disableCard: async (cardUid: string) => {
    const { data, error } = await (supabase.from('qr_cards') as any).update({ status: 'deactivated' }).eq('card_uid', cardUid).select();
    if (error) throw error;
    return data;
  },
  
  replaceCard: async (oldCardUid: string, newCardData: any) => {
    const { data, error } = await (supabase.from('qr_cards') as any).update(newCardData).eq('card_uid', oldCardUid).select();
    if (error) throw error;
    return data;
  },
  
  // Transaction operations
  getTransactions: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        qr_cards!inner (
          owner_name,
          card_uid
        )
      `);
    if (error) throw error;
    
    // Transform data to match UI expectations
    return data?.map((t: any) => ({
      ...t,
      passengerName: t.qr_cards?.owner_name || 'Unknown',
      timestamp: t.created_at,
      method: t.channel
    })) || [];
  },
  
  createTransaction: async (transactionData: any) => {
    const { data, error } = await (supabase.from('transactions').insert([transactionData] as any).select() as any);
    if (error) throw error;
    return data;
  },
  
  topUp: async (cardUid: string, amount: number, paymentMethod: string) => {
    // First get the current card
    const { data: cardData, error: cardError } = await (supabase.from('qr_cards') as any).select('*').eq('card_uid', cardUid).single();
    if (cardError) throw cardError;
    
    // Update the balance
    const { data, error } = await (supabase.from('qr_cards') as any).update({ 
      balance: ((cardData as any).balance || 0) + amount 
    }).eq('card_uid', cardUid).select();
    
    if (error) throw error;
    
    // Create a transaction record using card_issuance type for reloads
    await (supabase.from('transactions').insert([{
      type: 'card_issuance',
      amount,
      card_id: (cardData as any).id,
      channel: paymentMethod,
      staff_id: null,
      balance_after: ((cardData as any).balance || 0) + amount
    }] as any));
    
    return data;
  },
  
  // Passenger operations
  getPassengers: async () => {
    // Note: passengers table doesn't exist in schema, returning qr_cards instead
    const { data, error } = await supabase.from('qr_cards').select('*') as any;
    if (error) throw error;
    return data;
  },
  
  // Dashboard stats
  getDashboardStats: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's card registrations
    const { data: todayCards } = await supabase
      .from('qr_cards')
      .select('*')
      .gte('created_at', today.toISOString());
    
    // Get today's transactions (card_issuance type for reloads)
    const { data: todayTransactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', today.toISOString());
    
    // Calculate stats
    const todayRegistrations = todayCards?.length || 0;
    const todayTopUps = todayTransactions?.filter((t: any) => t.type === 'card_issuance').length || 0;
    const totalTransactionCount = todayTransactions?.length || 0;
    const totalRevenue = todayTransactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
    
    return {
      todayRegistrations,
      todayTopUps,
      todayTransactions: totalTransactionCount,
      totalRevenue
    };
  },

  // Customer Service Logs operations
  getCustomerServiceLogs: async () => {
    const { data, error } = await supabase
      .from('customer_service_logs')
      .select(`
        *,
        staff_users (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createCustomerServiceLog: async (logData: any) => {
    const { data, error } = await supabase
      .from('customer_service_logs')
      .insert(logData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
