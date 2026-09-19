import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCalls } from "../../lib/api";
import type { Passenger, QRCard } from '../types';
import { useState } from 'react';
import { Search, RefreshCw, CreditCard, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Modal, Form, FormField, Select } from '@commutai/ui';

export default function Passengers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState<'All' | 'Temporary' | 'Regular' | 'Student' | 'Senior Citizen' | 'PWD'>('All');
  const [replaceCard, setReplaceCard] = useState<QRCard | null>(null);
  const [issueNewCard, setIssueNewCard] = useState<Passenger | null>(null);
  const queryClient = useQueryClient();

  const { data: passengers, isLoading } = useQuery({
    queryKey: ['passengers'],
    queryFn: apiCalls.getPassengers,
  });

  const { data: cards } = useQuery({
    queryKey: ['qrCards'],
    queryFn: apiCalls.getQRCards,
  });

  const replaceMutation = useMutation({
    mutationFn: ({ oldCardId, newCardData }: { oldCardId: string; newCardData: any }) => apiCalls.replaceCard(oldCardId, newCardData),
    onSuccess: () => {
      toast.success('Card replaced successfully!');
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      setReplaceCard(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to replace card: ${err.message}`);
    },
  });

  const issueCardMutation = useMutation({
    mutationFn: (registration: {
      ownerName: string;
      contactNumber: string;
      passengerType: 'Regular' | 'Student' | 'Senior Citizen' | 'PWD';
    }) => apiCalls.issueQRCard(registration),
    onSuccess: () => {
      toast.success('QR Card issued successfully!');
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      setIssueNewCard(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to issue card: ${err.message}`);
    },
  });

  const filteredPassengers = passengers?.filter((p: any) => {
    const passengerCard = cards?.find((c: any) => c.cardId === p.cardId);
    const cardType = passengerCard?.passengerType;
    const isTemporary = passengerCard?.isTemporary;

    // Filter by card type
    if (cardTypeFilter === 'Temporary' && !isTemporary) return false;
    if (cardTypeFilter !== 'All' && cardTypeFilter !== 'Temporary' && cardType !== cardTypeFilter) return false;

    // Filter by search term
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.cardId?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-white">Card Management</h1>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-white/20">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search passengers by name, phone, or card ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-orange-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', 'Temporary', 'Regular', 'Student', 'Senior Citizen', 'PWD'] as const).map((type) => (
              <Button
                key={type}
                onClick={() => setCardTypeFilter(type)}
                variant={cardTypeFilter === type ? 'primary' : 'secondary'}
                size="sm"
                className={cardTypeFilter === type ? 'bg-primary-500 border-primary-400' : 'bg-white/10 border-white/20 text-white/60'}
              >
                {type}
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Card ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Card Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPassengers.map((passenger: any) => {
                const passengerCard = cards?.find((c: any) => c.cardId === passenger.cardId);
                return (
                  <tr key={passenger.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-linear-to-br from-primary-500/20 to-primary-600/20 rounded-2xl flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-primary-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{passenger.name}</div>
                          <div className="text-sm text-white/60">{passenger.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{passenger.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{passenger.cardId || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                        (passengerCard as any)?.isTemporary
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {(passengerCard as any)?.isTemporary ? 'Temporary' : (passengerCard as any)?.passengerType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      ₱{(passenger.balance || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                        passenger.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {passenger.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {passengerCard && (
                        <button
                          onClick={() => setReplaceCard(passengerCard)}
                          className="text-primary-400 hover:text-primary-300 mr-3 p-2 rounded-xl hover:bg-primary-500/20 transition-colors"
                          title="Replace Lost/Damaged Card"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setIssueNewCard(passenger)}
                        className="text-emerald-400 hover:text-emerald-300 p-2 rounded-xl hover:bg-emerald-500/20 transition-colors"
                        title="Issue New Card"
                      >
                        <CreditCard className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {replaceCard && (
        <ReplaceCardModal
          card={replaceCard}
          onClose={() => setReplaceCard(null)}
          onConfirm={(newCardData: any) => replaceMutation.mutate({ oldCardId: replaceCard.cardId, newCardData })}
          isProcessing={replaceMutation.isPending}
        />
      )}

      {issueNewCard && (
        <IssueNewCardModal
          passenger={issueNewCard}
          onClose={() => setIssueNewCard(null)}
          onSubmit={(registration) => issueCardMutation.mutate(registration)}
          isProcessing={issueCardMutation.isPending}
        />
      )}
    </div>
  );
}

function ReplaceCardModal({ card, onClose, onConfirm, isProcessing }: { card: QRCard; onClose: () => void; onConfirm: () => void; isProcessing: boolean }) {
  return (
    <Modal
      isOpen={!!card}
      onClose={onClose}
      title="Replace Card"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <p className="text-sm text-white/60">Issue a replacement for lost/damaged card</p>
        </div>
      </div>
      <p className="text-sm text-white/70 mb-5">
        Card <span className="font-mono font-bold text-white">{card.cardId}</span> will be
        marked as replaced and a new card will be issued for{' '}
        <span className="font-semibold text-white">{card.passengerName}</span>.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={onClose}
          variant="secondary"
          fullWidth
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isProcessing}
          variant="primary"
          fullWidth
        >
          {isProcessing ? 'Processing...' : 'Confirm Replacement'}
        </Button>
      </div>
    </Modal>
  );
}

function IssueNewCardModal({ passenger, onClose, onSubmit, isProcessing }: { passenger: Passenger; onClose: () => void; onSubmit: (registration: any) => void; isProcessing: boolean }) {
  return (
    <Modal
      isOpen={!!passenger}
      onClose={onClose}
      title="Issue New Card"
    >
      <p className="text-sm text-white/60 mb-6">
        Issue a new QR card for <span className="font-semibold text-white">{passenger.name}</span>.
      </p>
      <Form
        initialValues={{
          ownerName: passenger.name,
          contactNumber: passenger.phone,
          passengerType: 'Regular',
        }}
        onSubmit={onSubmit}
      >
        <FormField
          name="ownerName"
          label="Full Name"
          required
        >
          {(field) => (
            <Input
              type="text"
              required
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          )}
        </FormField>
        <FormField
          name="contactNumber"
          label="Contact Number"
          required
        >
          {(field) => (
            <Input
              type="tel"
              required
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          )}
        </FormField>
        <FormField
          name="passengerType"
          label="Passenger Type"
          required
        >
          {(field) => (
            <Select
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'Regular', label: 'Regular' },
                { value: 'Student', label: 'Student' },
                { value: 'Senior Citizen', label: 'Senior Citizen' },
                { value: 'PWD', label: 'PWD' },
              ]}
              className="bg-white/10 border-white/20 text-white"
            />
          )}
        </FormField>
        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isProcessing}
            variant="primary"
            fullWidth
          >
            {isProcessing ? 'Issuing...' : 'Issue Card'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
