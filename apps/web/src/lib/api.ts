import { supabase } from '@commutai/supabase';

export const apiCalls = {
  // QR Card operations
  getQRCards: async () => {
    const { data, error } = await supabase.from('qr_cards').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  getTemporaryQRCards: async () => {
    // Use the temporary_tickets table instead of qr_cards
    const { data, error } = await supabase.from('temporary_tickets').select('*');
    if (error) throw error;
    
    // Transform temporary_tickets data to match QR card schema
    return data?.map((ticket: any) => ({
      id: ticket.id,
      card_uid: ticket.ticket_uid,
      owner_name: 'Temporary Card',
      contact_number: '',
      card_type: ticket.passenger_type,
      status: ticket.status === 'validated' ? 'active' : ticket.status,
      balance: parseFloat(ticket.fare_amount) || 0,
      created_at: ticket.issued_at,
      purchase_price: parseFloat(ticket.fare_amount) || 0,
    })) || [];
  },
  
  createQRCard: async (cardData: any) => {
    const { data, error } = await (supabase.from('qr_cards').insert([cardData] as any).select() as any);
    if (error) throw error;
    return data;
  },
  
  createTemporaryQRCard: async (passengerType: string) => {
    // Generate temporary card ID based on passenger type
    const typeIndicators: Record<string, string> = {
      'Regular': 'TRC',
      'Student': 'TSC',
      'Senior Citizen': 'TSCC',
      'PWD': 'TPC'
    };
    const indicator = typeIndicators[passengerType] || 'TRC';
    const randomNum = Math.floor(10000000 + Math.random() * 90000000).toString();
    const formattedNum = `${randomNum.slice(0, 3)}-${randomNum.slice(3, 5)}-${randomNum.slice(5)}`;
    const ticketUid = `${indicator}-${formattedNum}`;

    const { data, error } = await (supabase.from('temporary_tickets').insert([{
      ticket_uid: ticketUid,
      fare_amount: '100.00',
      status: 'validated',
      allowed_routes: [],
      passenger_id: null,
      trip_id: null,
      issued_by: null,
      issued_at: new Date().toISOString(),
      validated_at: new Date().toISOString(),
      destination: null,
      passenger_type: passengerType.toLowerCase().replace(' ', '_'),
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
    // Try to delete transactions first to satisfy foreign key constraint
    const { error: transactionError } = await supabase
      .from('transactions')
      .delete()
      .eq('card_id', id);

    if (transactionError) {
      console.error('Failed to delete transactions:', transactionError);
      // Continue anyway - might be cascaded or we'll handle the card deletion differently
    }

    // Try to delete the card
    const { error } = await supabase
      .from('qr_cards')
      .delete()
      .eq('id', id);

    if (error) {
      // If deletion fails due to foreign key, use soft delete as fallback
      const { error: updateError } = await supabase
        .from('qr_cards')
        .update({ status: 'deactivated' })
        .eq('id', id);

      if (updateError) {
        throw new Error('Cannot delete this card because it has transaction history. Please contact database administrator to modify foreign key constraints.');
      }
      console.warn('Card soft-deleted due to foreign key constraint');
    }
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
