import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@commutai/supabase';
import { useState } from 'react';
import { Search, Check, X, Printer, Clock, UserPlus, CreditCard, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Modal } from '@commutai/ui';
import AuditService from '../../services/auditService';

interface CardReservation {
  id: string;
  name: string;
  contact: string;
  card_type: 'Regular' | 'Student' | 'Senior Citizen' | 'PWD';
  status: 'pending' | 'approved' | 'denied' | 'printed' | 'issued' | 'expired';
  card_uid?: string;
  created_at: string;
  pickup_terminal?: string;
  reservation_id?: string;
  expires_at?: string;
}

export default function CardReservations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'approved' | 'denied' | 'printed' | 'issued' | 'expired'>('All');
  const [selectedReservation, setSelectedReservation] = useState<CardReservation | null>(null);
  const [viewDetails, setViewDetails] = useState<CardReservation | null>(null);
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['cardReservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_reservations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Check for expired reservations and update their status
      const now = new Date();
      const expiredReservations = (data as CardReservation[]).filter(
        (res) => res.expires_at && new Date(res.expires_at) < now && res.status === 'pending'
      );
      
      for (const expired of expiredReservations) {
        await supabase
          .from('card_reservations')
          .update({ status: 'expired' })
          .eq('id', expired.id);
      }
      
      return data as CardReservation[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { data, error } = await supabase
        .from('card_reservations')
        .update({ status: 'approved' })
        .eq('id', reservationId)
        .select()
        .single();
      if (error) throw error;
      
      // Send SMS notification
      await sendSMSNotification(data.contact, 'approved', data.name);
      return data;
    },
    onSuccess: (data) => {
      AuditService.logCardReservationApproved(data.id, data.name);
      toast.success('Reservation approved and SMS sent!');
      queryClient.invalidateQueries({ queryKey: ['cardReservations'] });
      setSelectedReservation(null);
    }, = useMutation({
    mutationFn: async (reservationId: string) => {
      const { data, error } = await supabase
        .from('card_reservations')
        .update({ status: 'denied' })
        .eq('id', reservationId)
        .select()
        .single();
      if (error) throw error;
      
      // Send SMS notification
      await sendSMSNotification(data.contact, 'denied', data.name);
      return data;
    },
    onSuccess: (data) => {
      AuditService.logCardReservationDenied(data.id, data.name);
      toast.success('Reservation denied and SMS sent!');
      queryClient.invalidateQueries({ queryKey: ['cardReservations'] });
      setSelectedReservation(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to deny: ${err.message}`);
    },
  });

  const printMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { data, error } = await supabase
        .from('card_reservations')
        .update({ status: 'printed' })
        .eq('id', reservationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      AuditService.logCardReservationPrinted(data.id, data.name);
      toast.success('Card marked for printing!');
      queryClient.invalidateQueries({ queryKey: ['cardReservations'] });
      printCard(selectedReservation);
      setSelectedReservation(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to mark for printing: ${err.message}`);
    },
  });

  const issueMutation = useMutation({
    mutationFn: async ({ reservationId, cardUid }: { reservationId: string; cardUid: string }) => {
      const { data, error } = await supabase
        .from('card_reservations')
        .update({ status: 'issued', card_uid: cardUid })
        .eq('id', reservationId)
        .select()
        .single();
      if (error) throw error;
      
      // Also create QR card record
      await supabase.from('qr_cards').insert([{
        card_uid: cardUid,
        owner_name: data.name,
        contact_number: data.contact,
        card_type: data.card_type.toLowerCase(),
        status: 'active',
        balance: 0,
        purchase_price: 0
      }] as any);
      
      return data;
    },
    onSuccess: (data) => {
      AuditService.logCardIssued(data.id, data.name, data.card_uid || '');
      toast.success('Card issued successfully!');
      queryClient.invalidateQueries({ queryKey: ['cardReservations'] });
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
      setSelectedReservation(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to issue card: ${err.message}`);
    },
  });

  const reassignMutation = useMutation({
    mutationFn: async ({ reservationId, newName, newContact }: { reservationId: string; newName: string; newContact: string }) => {
      const { data, error } = await supabase
        .from('card_reservations')
        .update({ 
          status: 'pending',
          name: newName,
          contact: newContact,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          card_uid: null
        })
        .eq('id', reservationId)
        .select()
        .single();
      if (error) throw error;
      
      // Send SMS notification to new customer
      await sendSMSNotification(newContact, 'reassigned', newName);
      
      return data;
    },
    onSuccess: (data) => {
      AuditService.logCardReservationEdited(data.id, data.name);
      toast.success('Reservation reassigned successfully and SMS sent!');
      queryClient.invalidateQueries({ queryKey: ['cardReservations'] });
      setSelectedReservation(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to reassign: ${err.message}`);
    },
  });

  const sendSMSNotification = async (phoneNumber: string, status: string, name: string) => {
    // This would integrate with an SMS service like Twilio
    let message = '';
    switch (status) {
      case 'approved':
        message = `Your card reservation has been approved. Dear ${name}, your card has been approved and is ready for pickup.`;
        break;
      case 'denied':
        message = `Your card reservation has been denied. Dear ${name}, your card reservation has been denied.`;
        break;
      case 'reassigned':
        message = `Your card reservation has been confirmed. Dear ${name}, your card reservation is now active. Please claim within 7 days.`;
        break;
      default:
        message = `Your card reservation status has been updated.`;
    }
    console.log(`Sending SMS to ${phoneNumber}: ${message}`);
    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const printCard = (reservation: CardReservation | null) => {
    if (!reservation) return;
    
    // Generate print content
    const printContent = `
      <html>
        <head>
          <title>Card Print - ${reservation.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .card { border: 2px solid #333; padding: 20px; width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
            .value { margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2>CommutAI Card</h2>
            </div>
            <div class="field">
              <span class="label">Name:</span>
              <span class="value">${reservation.name}</span>
            </div>
            <div class="field">
              <span class="label">Type:</span>
              <span class="value">${reservation.card_type}</span>
            </div>
            <div class="field">
              <span class="label">Phone:</span>
              <span class="value">${reservation.contact}</span>
            </div>
            <div class="field">
              <span class="label">Card ID:</span>
              <span class="value">${reservation.card_uid || 'PENDING'}</span>
            </div>
            <div class="field">
              <span class="label">Status:</span>
              <span class="value">${reservation.status.toUpperCase()}</span>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredReservations = reservations?.filter((reservation: CardReservation) => {
    if (statusFilter !== 'All' && reservation.status !== statusFilter) return false;
    
    return (
      reservation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.contact.includes(searchTerm) ||
      reservation.card_uid?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-1">
    <div className="p-1 space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-white">Card Reservation Management</h1>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-white/20">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search reservations by name, phone, or card ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-orange-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', 'pending', 'approved', 'denied', 'printed', 'issued', 'expired'] as const).map((status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status)}
                variant={statusFilter === status ? 'primary' : 'secondary'}
                size="sm"
                className={statusFilter === status ? 'bg-blue-500 border-blue-400' : 'bg-white/10 border-white/20 text-white/60'}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Card Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Terminal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Card ID</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredReservations.map((reservation: CardReservation) => (
                <tr key={reservation.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-linear-to-br from-primary-500/20 to-primary-600/20 rounded-2xl flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-primary-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{reservation.name}</div>
                        <div className="text-sm text-white/60">{new Date(reservation.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{reservation.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                      reservation.card_type === 'Student' ? 'bg-green-500/20 text-green-400' :
                      reservation.card_type === 'Senior Citizen' ? 'bg-purple-500/20 text-purple-400' :
                      reservation.card_type === 'PWD' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {reservation.card_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{reservation.pickup_terminal || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                      reservation.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      reservation.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      reservation.status === 'denied' ? 'bg-red-500/20 text-red-400' :
                      reservation.status === 'printed' ? 'bg-blue-500/20 text-blue-400' :
                      reservation.status === 'expired' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {reservation.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {reservation.expires_at ? new Date(reservation.expires_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                    {reservation.card_uid || <span className="text-yellow-400">PENDING</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setSelectedReservation(reservation)}
                          className="text-green-400 hover:text-green-300 mr-2 p-2 rounded-xl hover:bg-green-500/20 transition-colors"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => denyMutation.mutate(reservation.id)}
                          className="text-red-400 hover:text-red-300 mr-2 p-2 rounded-xl hover:bg-red-500/20 transition-colors"
                          title="Deny"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {reservation.status === 'approved' && (
                      <>
                        <button
                          onClick={() => printMutation.mutate(reservation.id)}
                          className="text-blue-400 hover:text-blue-300 mr-2 p-2 rounded-xl hover:bg-blue-500/20 transition-colors"
                          title="Print Card"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedReservation(reservation)}
                          className="text-purple-400 hover:text-purple-300 p-2 rounded-xl hover:bg-purple-500/20 transition-colors"
                          title="Issue Card"
                        >
                          <CreditCard className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {reservation.status === 'printed' && (
                      <button
                        onClick={() => setSelectedReservation(reservation)}
                        className="text-green-400 hover:text-green-300 p-2 rounded-xl hover:bg-green-500/20 transition-colors"
                        title="Issue Card"
                      >
                        <CreditCard className="w-5 h-5" />
                      </button>
                    )}
                    {reservation.status === 'expired' && (
                      <button
                        onClick={() => setSelectedReservation(reservation)}
                        className="text-orange-400 hover:text-orange-300 p-2 rounded-xl hover:bg-orange-500/20 transition-colors"
                        title="Reassign to New Customer"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReservation && (
        <ActionModal
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onApprove={() => approveMutation.mutate(selectedReservation.id)}
          onIssue={(cardUid) => issueMutation.mutate({ reservationId: selectedReservation.id, cardUid })}
          onReassign={(newName, newContact) => reassignMutation.mutate({ reservationId: selectedReservation.id, newName, newContact })}
          isProcessing={approveMutation.isPending || issueMutation.isPending || reassignMutation.isPending}
        />
      )}

      {viewDetails && (
        <DetailsModal
          reservation={viewDetails}
          onClose={() => setViewDetails(null)}
        />
      )}
    </div>
    </div>
  );
}

function ActionModal({ 
  reservation, 
  onClose, 
  onApprove, 
  onIssue, 
  onReassign,
  isProcessing 
}: { 
  reservation: CardReservation; 
  onClose: () => void; 
  onApprove: () => void; 
  onIssue: (cardUid: string) => void;
  onReassign: (newName: string, newContact: string) => void;
  isProcessing: boolean;
}) {
  const [cardUid, setCardUid] = useState('');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState('');

  if (showIssueForm) {
    return (
      <Modal
        isOpen={!!reservation}
        onClose={onClose}
        title="Issue Card"
      >
        <div className="mb-4">
          <p className="text-sm text-white/60 mb-2">
            Issue card for <span className="font-semibold text-white">{reservation.name}</span>
          </p>
          <Input
            type="text"
            placeholder="Enter Card UID"
            value={cardUid}
            onChange={(e) => setCardUid(e.target.value)}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowIssueForm(false)}
            variant="secondary"
            fullWidth
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
          >
            Back
          </Button>
          <Button
            onClick={() => onIssue(cardUid)}
            disabled={!cardUid || isProcessing}
            variant="primary"
            fullWidth
            className="bg-blue-500 hover:bg-blue-600 border-blue-400 text-white"
          >
            {isProcessing ? 'Issuing...' : 'Issue Card'}
          </Button>
        </div>
      </Modal>
    );
  }

  if (showReassignForm) {
    return (
      <Modal
        isOpen={!!reservation}
        onClose={onClose}
        title="Reassign Reservation"
      >
        <div className="mb-4">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-400">
              This reservation expired on {reservation.expires_at ? new Date(reservation.expires_at).toLocaleDateString() : 'unknown date'}.
            </p>
            <p className="text-sm text-white/60 mt-2">
              Reassign to a new customer who purchased the card from the terminal.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">New Customer Name</label>
              <Input
                type="text"
                placeholder="Enter customer name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">New Contact Number</label>
              <Input
                type="tel"
                placeholder="e.g. 09171234567"
                value={newContact}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 0 && !val.startsWith('09')) {
                    val = '09' + val.replace(/^0+9?/, '').slice(0, 9);
                  }
                  val = val.slice(0, 11);
                  setNewContact(val);
                }}
                maxLength={11}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowReassignForm(false)}
            variant="secondary"
            fullWidth
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
          >
            Back
          </Button>
          <Button
            onClick={() => {
              const phMobileRegex = /^09\d{9}$/;
              if (!newName.trim()) {
                toast.error('Please enter a customer name');
                return;
              }
              if (!phMobileRegex.test(newContact.trim())) {
                toast.error('Enter a valid PH mobile number (e.g. 09171234567)');
                return;
              }
              onReassign(newName, newContact.trim());
            }}
            disabled={!newName || !newContact || isProcessing}
            variant="primary"
            fullWidth
            className="bg-orange-500 hover:bg-orange-600 border-orange-400 text-white"
          >
            {isProcessing ? 'Reassigning...' : 'Reassign & Send SMS'}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={!!reservation}
      onClose={onClose}
      title="Review Reservation"
    >
      <div className="space-y-4 mb-6">
        <div className="p-4 bg-white/10 rounded-xl border border-white/20">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-orange-400" />
            <div>
              <p className="text-sm text-white/60">Customer</p>
              <p className="text-white font-medium">{reservation.name}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/10 rounded-xl border border-white/20">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-sm text-white/60">Card Type</p>
              <p className="text-white font-medium">{reservation.card_type}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/10 rounded-xl border border-white/20">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-sm text-white/60">Contact</p>
              <p className="text-white font-medium">{reservation.contact}</p>
            </div>
          </div>
        </div>
        {reservation.expires_at && (
          <div className="p-4 bg-white/10 rounded-xl border border-white/20">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-sm text-white/60">Expires</p>
                <p className="text-white font-medium">{new Date(reservation.expires_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {reservation.status === 'pending' ? (
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            fullWidth
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onApprove}
            disabled={isProcessing}
            variant="primary"
            fullWidth
            className="bg-green-500 hover:bg-green-600 border-green-400 text-white"
          >
            {isProcessing ? 'Processing...' : 'Approve & Send SMS'}
          </Button>
        </div>
      ) : reservation.status === 'expired' ? (
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            fullWidth
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
          >
            Close
          </Button>
          <Button
            onClick={() => setShowReassignForm(true)}
            variant="primary"
            fullWidth
            className="bg-orange-500 hover:bg-orange-600 border-orange-400 text-white"
          >
            Reassign to New Customer
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            fullWidth
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
          >
            Close
          </Button>
          <Button
            onClick={() => setShowIssueForm(true)}
            variant="primary"
            fullWidth
            className="bg-blue-500 hover:bg-blue-600 border-blue-400 text-white"
          >
            Issue Card
          </Button>
        </div>
      )}
    </Modal>
  );
}

function DetailsModal({ reservation, onClose }: { reservation: CardReservation; onClose: () => void }) {
  return (
    <Modal
      isOpen={!!reservation}
      onClose={onClose}
      title="Reservation Details"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-white/60">Name</p>
          <p className="text-white font-medium">{reservation.name}</p>
        </div>
        <div>
          <p className="text-sm text-white/60">Contact Number</p>
          <p className="text-white font-medium">{reservation.contact}</p>
        </div>
        <div>
          <p className="text-sm text-white/60">Card Type</p>
          <p className="text-white font-medium">{reservation.card_type}</p>
        </div>
        <div>
          <p className="text-sm text-white/60">Terminal</p>
          <p className="text-white font-medium">{reservation.pickup_terminal || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-white/60">Status</p>
          <p className="text-white font-medium">{reservation.status.toUpperCase()}</p>
        </div>
        <div>
          <p className="text-sm text-white/60">Card ID</p>
          <p className="text-white font-medium font-mono">{reservation.card_uid || 'PENDING'}</p>
        </div>
        <div>
          <p className="text-sm text-white/60">Submitted</p>
          <p className="text-white font-medium">{new Date(reservation.created_at).toLocaleString()}</p>
        </div>
        {reservation.expires_at && (
          <div>
            <p className="text-sm text-white/60">Expires</p>
            <p className="text-white font-medium">{new Date(reservation.expires_at).toLocaleString()}</p>
          </div>
        )}
      </div>
      <div className="mt-6">
        <Button
          onClick={onClose}
          variant="secondary"
          fullWidth
          className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}
