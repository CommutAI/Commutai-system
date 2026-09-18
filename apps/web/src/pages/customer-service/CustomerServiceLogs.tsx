import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCalls } from "../../lib/api";
import type { CustomerServiceLog } from '../types';
import { MessageSquare, Plus, Clock, User, AlertCircle, HelpCircle, DollarSign, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { Button, Input, Form, FormField, Modal } from '@commutai/ui';
import toast from 'react-hot-toast';

const ACTION_OPTIONS = [
  { value: 'complaint', label: 'Complaint', icon: AlertCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'inquiry', label: 'Inquiry', icon: HelpCircle, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'refund', label: 'Refund', icon: DollarSign, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'lost_card', label: 'Lost Card', icon: CreditCard, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'other', label: 'Other', icon: MessageSquare, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
];

function CreateLogModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [selectedAction, setSelectedAction] = useState<string>('inquiry');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (logData: any) => apiCalls.createCustomerServiceLog(logData),
    onSuccess: () => {
      toast.success('Customer service log created successfully!');
      queryClient.invalidateQueries({ queryKey: ['customerServiceLogs'] });
      onSuccess();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(`Failed to create log: ${err.message}`);
    },
  });

  const handleSubmit = (values: Record<string, any>) => {
    createMutation.mutate({
      action: selectedAction,
      description: values.description,
      trip_id: values.tripId || null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Customer Service Log">
      <Form
        initialValues={{
          description: '',
          tripId: '',
        }}
        onSubmit={handleSubmit}
      >
        <FormField name="action" label="Action Type">
          {() => (
            <div className="grid grid-cols-2 gap-3">
              {ACTION_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedAction(option.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      selectedAction === option.value
                        ? option.color
                        : 'border-white/20 bg-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </FormField>

        <FormField name="tripId" label="Trip ID (Optional)">
          {(field) => (
            <Input
              type="text"
              placeholder="Enter trip ID if applicable"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          )}
        </FormField>

        <FormField name="description" label="Description" required>
          {(field) => (
            <textarea
              required
              placeholder="Describe the customer service interaction..."
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              rows={4}
              className="w-full bg-white/10 border-white/20 text-white rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          )}
        </FormField>

        <div className="flex gap-3 pt-2">
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
            disabled={createMutation.isPending}
            variant="primary"
            fullWidth
          >
            {createMutation.isPending ? 'Creating...' : 'Create Log'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function CustomerServiceLogs() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['customerServiceLogs'],
    queryFn: apiCalls.getCustomerServiceLogs,
  });

  const getActionIcon = (action: CustomerServiceLog['action']) => {
    const option = ACTION_OPTIONS.find(opt => opt.value === action);
    if (!option) return MessageSquare;
    return option.icon;
  };

  const getActionColor = (action: CustomerServiceLog['action']) => {
    const option = ACTION_OPTIONS.find(opt => opt.value === action);
    if (!option) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    return option.color;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">Customer Service Logs</h1>
          <p className="text-white/60">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">Customer Service Logs</h1>
          <p className="text-white/60">Track all customer service interactions</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Log
        </Button>
      </div>

      <div className="glass-card">
        {logs && logs.length > 0 ? (
          <div className="divide-y divide-white/10">
            {logs.map((log: any) => {
              const Icon = getActionIcon(log.action);
              const colorClass = getActionColor(log.action);
              return (
                <div key={log.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold capitalize border">
                          {log.action.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2 text-white/40 text-sm">
                          <Clock className="w-4 h-4" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      {log.description && (
                        <p className="text-white/80 mb-3">{log.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        {log.staff_users && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{log.staff_users.full_name}</span>
                          </div>
                        )}
                        {log.trip_id && (
                          <div className="flex items-center gap-2">
                            <span>Trip ID: {log.trip_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-white/20 mb-4" />
            <p className="text-white/60">No customer service logs found</p>
            <p className="text-white/40 text-sm mt-1">Click "New Log" to create your first entry</p>
          </div>
        )}
      </div>

      <CreateLogModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
