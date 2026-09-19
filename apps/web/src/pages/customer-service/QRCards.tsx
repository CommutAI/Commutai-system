import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCalls } from "../../lib/api";
import type { QRCard } from '../types';
import {
  CreditCard, Plus, Power, PowerOff, RefreshCw,
  X, User, Phone, CheckCircle, ChevronRight, Ticket,
  Eye, Edit, Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
// import QRCardDisplay from "../../components/QRCardDisplay";
// import TemporaryCardDisplay from "../../components/TemporaryCardDisplay";
import toast from 'react-hot-toast';
import { Button, Input, Form, FormField, Modal } from '@commutai/ui';

import regularImg from './assets/REGULAR.png';
import studentImg  from './assets/STUDENT.png';
import seniorImg   from './assets/SENIOR-CITIZIEN.png';
import pwdImg      from './assets/PWD.png';

type PassengerType = 'regular' | 'student' | 'senior_citizen' | 'pwd';

const TYPE_OPTIONS: { value: PassengerType; label: string; desc: string; img: string; color: string }[] = [
  { value: 'regular',          label: 'Regular',         desc: 'Standard fare',              img: regularImg, color: 'border-blue-400 bg-blue-50'   },
  { value: 'student',          label: 'Student',         desc: 'Discounted student fare',    img: studentImg, color: 'border-green-400 bg-green-50' },
  { value: 'senior_citizen',   label: 'Senior Citizen',  desc: 'Senior citizen discount',    img: seniorImg,  color: 'border-orange-400 bg-orange-50'},
  { value: 'pwd',              label: 'PWD',             desc: 'Persons with disability',    img: pwdImg,     color: 'border-purple-400 bg-purple-50'},
];

// ── Registration wizard ────────────────────────────────────────────────────

type Step = 'info' | 'type' | 'confirm';

interface RegData {
  owner_name: string;
  contact_number: string;
  card_type: PassengerType;
}

function RegisterCardModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (card: QRCard) => void;
}) {
  const [step, setStep] = useState<Step>('info');
  const [data, setData] = useState<RegData>({
    owner_name: '',
    contact_number: '',
    card_type: 'regular',
  });
  const [error, setError] = useState<string | null>(null);

  const issueMutation = useMutation({
    mutationFn: (cardData: any) => apiCalls.issueQRCard(cardData),
    onSuccess: (card: any) => {
      toast.success(`QR Card issued successfully! Card ID: ${card.card_uid}`);
      onSuccess(card);
    },
    onError: (err: Error) => {
      toast.error(`Failed to issue card: ${err.message}`);
      setError(err.message);
    },
  });

  const handleInfoNext = (values: Record<string, any>) => {
    if (!values.ownerName?.trim() || !values.contactNumber?.trim()) return;
    setData(d => ({ ...d, owner_name: values.ownerName, contact_number: values.contactNumber }));
    setStep('type');
  };

  const handleTypeNext = () => {
    setStep('confirm');
  };

  // Pre-generate the card ID so it shows in the preview before hitting DB
  const previewCardId = useMemo(() => {
    const typeIndicators: Record<string, string> = {
      'regular': 'RC',
      'student': 'SC',
      'senior_citizen': 'SCC',
      'pwd': 'PC'
    };
    const indicator = typeIndicators[data.passengerType] || 'RC';
    const randomNum = Math.floor(10000000 + Math.random() * 90000000).toString();
    const formattedNum = `${randomNum.slice(0, 3)}-${randomNum.slice(3, 5)}-${randomNum.slice(5)}`;
    return `${indicator}-${formattedNum}`;
  }, [data.passengerType]);

  const handleSubmit = () => {
    setError(null);
    issueMutation.mutate({
      owner_name:     data.ownerName.trim(),
      contact_number: data.contactNumber.trim(),
      card_type: data.passengerType,
      card_uid: previewCardId,
      status: 'active',
      balance: 0,
      purchase_price: 100.00
    });
  };

  const selectedType = TYPE_OPTIONS.find(t => t.value === data.passengerType)!;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg border border-white/20 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <div>
            <h2 className="text-base font-bold text-white">Register New QR Card</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {(['info', 'type', 'confirm'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s
                      ? 'bg-primary-500 text-white'
                      : (['info', 'type', 'confirm'].indexOf(step) > i)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {(['info', 'type', 'confirm'].indexOf(step) > i) ? '✓' : i + 1}
                  </div>
                  {i < 2 && <div className="w-6 h-px bg-white/20" />}
                </div>
              ))}
              <span className="text-xs text-white/40 ml-1 capitalize">{step}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 border border-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Step 1: Personal Info ── */}
        {step === 'info' && (
          <Form
            initialValues={{
              ownerName: data.owner_name,
              contactNumber: data.contact_number,
            }}
            onSubmit={handleInfoNext}
          >
            <FormField
              name="ownerName"
              label="Full Name"
              required
            >
              {(field) => (
                <div>
                  <User className="w-4 h-4 inline mr-1.5 text-white/40" />
                  <Input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Juan dela Cruz"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setData(d => ({ ...d, ownerName: e.target.value }));
                    }}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              )}
            </FormField>
            <FormField
              name="contactNumber"
              label="Contact Number"
              required
            >
              {(field) => (
                <div>
                  <Phone className="w-4 h-4 inline mr-1.5 text-white/40" />
                  <Input
                    type="tel"
                    required
                    placeholder="e.g. 09171234567"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setData(d => ({ ...d, contactNumber: e.target.value }));
                    }}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              )}
            </FormField>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Form>
        )}

        {/* ── Step 2: Passenger Type ── */}
        {step === 'type' && (
          <div className="px-6 py-5">
            <p className="text-sm text-white/60 mb-4">
              Select the passenger category for <span className="font-semibold text-white">{data.ownerName}</span>:
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setData(d => ({ ...d, card_type: opt.value }))}
                  className={`relative rounded-2xl border-2 overflow-hidden transition-all text-left ${
                    data.card_type === opt.value
                      ? opt.color + ' border-opacity-100 shadow-soft'
                      : 'border-white/20 hover:border-white/30 bg-white/10'
                  }`}
                >
                  <img
                    src={opt.img}
                    alt={opt.label}
                    className="w-full h-14 object-cover object-top"
                  />
                  <div className="px-3 py-2">
                    <p className="text-xs font-bold text-white">{opt.label}</p>
                    <p className="text-[10px] text-white/60">{opt.desc}</p>
                  </div>
                  {data.card_type === opt.value && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button
                onClick={() => setStep('info')}
                variant="secondary"
              >
                Back
              </Button>
              <Button
                onClick={handleTypeNext}
                variant="primary"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm & Issue ── */}
        {step === 'confirm' && (
          <div className="px-6 py-5">
            <p className="text-xs text-white/40 mb-4">Review the details before issuing the card.</p>

            {/* Two-column: info left, card preview right */}
            <div className="flex gap-4 mb-4">

              {/* Left — details */}
              <div className="flex-1 space-y-2.5">
                {/* Card ID (preview) */}
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Card ID</p>
                  <p className="font-mono font-bold text-white text-sm truncate">{previewCardId}</p>
                </div>
                {/* Name */}
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Full Name</p>
                  <p className="font-semibold text-white text-sm truncate">{data.ownerName}</p>
                </div>
                {/* Contact */}
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Contact Number</p>
                  <p className="font-semibold text-white text-sm">{data.contactNumber}</p>
                </div>
                {/* Type */}
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Passenger Type</p>
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${selectedType.color}`}>
                    {data.card_type}
                  </span>
                </div>
                {/* Balance */}
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-0.5">Initial Balance</p>
                  <p className="font-bold text-emerald-300 text-lg">₱100.00</p>
                </div>
                {/* Payment Amount */}
                <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-0.5">Payment Required</p>
                  <p className="font-bold text-amber-300 text-lg">₱110.00</p>
                  <p className="text-[9px] text-amber-400/70 mt-0.5">₱100 balance + ₱10 card fee</p>
                </div>
              </div>

              {/* Right — card template + QR preview */}
              <div className="w-40 shrink-0 flex flex-col gap-2">
                {/* Card template image */}
                <div className="relative rounded-xl overflow-hidden shadow-soft">
                  <img
                    src={selectedType.img}
                    alt={selectedType.label}
                    className="w-full object-cover"
                  />
                  {/* Name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-2 py-1.5">
                    <p className="text-white text-[9px] font-bold truncate leading-tight">
                      {data.ownerName.toUpperCase()}
                    </p>
                    <p className="text-white/60 text-[8px] font-mono truncate">
                      {previewCardId}
                    </p>
                  </div>
                </div>

                {/* Live QR code */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-2 flex flex-col items-center shadow-soft">
                  <p className="text-[9px] text-white/40 mb-1.5 font-semibold uppercase tracking-wide">QR Preview</p>
                  <QRCodeSVG
                    value={previewCardId}
                    size={100}
                    level="H"
                    includeMargin={true}
                    className="rounded"
                  />
                  <p className="text-[8px] text-white/40 mt-1.5 font-mono text-center break-all leading-tight">
                    {previewCardId}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                onClick={() => setStep('type')}
                variant="secondary"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={issueMutation.isPending}
                variant="primary"
              >
                {issueMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {issueMutation.isPending ? 'Issuing…' : 'Issue Card'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit card modal ─────────────────────────────────────────────────────────

function EditCardModal({
  card,
  onClose,
  onSuccess,
}: {
  card: QRCard;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    owner_name: card.owner_name,
    contact_number: card.contact_number,
    card_type: card.card_type,
  });
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (updates: { owner_name: string; contact_number: string }) => 
      apiCalls.updateQRCard(card.id, updates),
    onSuccess: () => {
      toast.success('Card updated successfully!');
      onSuccess();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(`Failed to update card: ${err.message}`);
      setError(err.message);
    },
  });

  const handleSubmit = (values: Record<string, any>) => {
    setError(null);
    updateMutation.mutate({
      owner_name: values.ownerName,
      contact_number: values.contactNumber,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md border border-white/20 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <h2 className="text-base font-bold text-white">Edit Card</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 border border-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>
        <Form
          initialValues={{
            ownerName: formData.ownerName,
            contactNumber: formData.contactNumber,
          }}
          onSubmit={handleSubmit}
        >
          <FormField name="card_uid" label="Card ID">
            {() => (
              <Input
                type="text"
                value={card.card_uid}
                disabled
                className="bg-white/10 font-mono text-white/60"
              />
            )}
          </FormField>
          <FormField name="ownerName" label="Full Name" required>
            {(field) => (
              <Input
                type="text"
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  setFormData(d => ({ ...d, ownerName: e.target.value }));
                }}
                className="bg-white/10 text-white"
              />
            )}
          </FormField>
          <FormField name="contactNumber" label="Contact Number" required>
            {(field) => (
              <Input
                type="tel"
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  setFormData(d => ({ ...d, contactNumber: e.target.value }));
                }}
                className="bg-white/10 text-white"
              />
            )}
          </FormField>
          <FormField name="card_type" label="Passenger Type">
            {() => (
              <Input
                type="text"
                value={formData.card_type}
                disabled
                className="bg-white/10 text-white/60"
              />
            )}
          </FormField>
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}
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
              disabled={updateMutation.isPending}
              variant="primary"
              fullWidth
            >
              {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

// ── Delete card confirm ─────────────────────────────────────────────────────

function DeleteCardModal({
  card,
  onClose,
  onConfirm,
}: {
  card: QRCard;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      isOpen={!!card}
      onClose={onClose}
      title="Delete Card"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p className="text-sm text-white/60">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-sm text-white/70 mb-5">
        Are you sure you want to delete card <span className="font-mono font-bold text-white">{card.card_uid}</span> for{' '}
        <span className="font-semibold text-white">{card.owner_name}</span>?
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
          variant="danger"
          fullWidth
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}

// ── Replace card confirm ───────────────────────────────────────────────────

function ReplaceCardModal({
  card,
  onClose,
  onConfirm,
}: {
  card: QRCard;
  onClose: () => void;
  onConfirm: (newCardData?: any) => void;
}) {
  return (
    <Modal
      isOpen={!!card}
      onClose={onClose}
      title="Replace Card"
    >
      <p className="text-sm text-white/60 mb-5">
        Card <span className="font-mono font-bold text-white">{card.card_uid}</span> will be
        marked as replaced and a new card will be issued for{' '}
        <span className="font-semibold text-white">{card.owner_name}</span>.
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
          variant="primary"
          fullWidth
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function QRCards() {
  const navigate = useNavigate();
  const [showRegister, setShowRegister]   = useState(false);
  const [newCard, setNewCard]             = useState<QRCard | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<QRCard | null>(null);
  const [viewCard, setViewCard]           = useState<QRCard | null>(null);
  const [editCard, setEditCard]           = useState<QRCard | null>(null);
  const [deleteCard, setDeleteCard]       = useState<QRCard | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: cards, isLoading } = useQuery({
    queryKey: ['qrCards'],
    queryFn: apiCalls.getQRCards,
  });

  const { data: tempCards } = useQuery({
    queryKey: ['temporaryQRCards'],
    queryFn: apiCalls.getTemporaryQRCards,
  });

  // Calculate card counts
  const cardCounts = useMemo(() => {
    // Exclude temporary cards from passenger type counts
    const activeCards = cards?.filter((c: QRCard) => c.status === 'active') || [];
    const regularCount = activeCards.filter((c: QRCard) => c.card_type === 'regular').length || 0;
    const studentCount = activeCards.filter((c: QRCard) => c.card_type === 'student').length || 0;
    const seniorCount = activeCards.filter((c: QRCard) => c.card_type === 'senior_citizen').length || 0;
    const pwdCount = activeCards.filter((c: QRCard) => c.card_type === 'pwd').length || 0;
    const tempCount = tempCards?.length || 0;
    // Total is sum of individual counts to avoid double-counting
    const totalCount = regularCount + studentCount + seniorCount + pwdCount + tempCount;

    return {
      temporary: tempCount,
      regular: regularCount,
      student: studentCount,
      senior: seniorCount,
      pwd: pwdCount,
      total: totalCount,
    };
  }, [cards, tempCards]);

  const activateMutation = useMutation({
    mutationFn: (cardUid: string) => apiCalls.activateQR(cardUid),
    onSuccess: () => {
      toast.success('Card activated successfully!');
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to activate card: ${err.message}`);
    },
  });

  const disableMutation = useMutation({
    mutationFn: (cardUid: string) => apiCalls.disableCard(cardUid),
    onSuccess: () => {
      toast.success('Card disabled successfully!');
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to disable card: ${err.message}`);
    },
  });

  const replaceMutation = useMutation({
    mutationFn: ({ oldCardId, newCardData }: { oldCardId: string; newCardData: any }) => apiCalls.replaceCard(oldCardId, newCardData),
    onSuccess: () => {
      toast.success('Card replaced successfully!');
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
      setReplaceTarget(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to replace card: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiCalls.deleteQRCard(id),
    onSuccess: () => {
      toast.success('Card deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
      setDeleteCard(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete card: ${err.message}`);
    },
  });

  const handleRegistered = () => {
    queryClient.invalidateQueries({ queryKey: ['qrCards'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    setShowRegister(false);
    navigate('/');  // Navigate to dashboard
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">QR Card Management</h1>
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-sm font-semibold transition-colors shadow-soft border border-primary-400"
        >
          <Plus className="w-4 h-4" />
          Register New Card
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {/* Total Cards */}
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'all' ? null : 'all')}
          className={`bg-linear-to-br from-gray-600 to-gray-700 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'all' ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-700' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{cardCounts.total}</span>
          </div>
          <p className="text-xs font-medium opacity-90">Total Cards</p>
        </button>

        {/* Temporary Cards */}
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'temporary' ? null : 'temporary')}
          className={`bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'temporary' ? 'ring-2 ring-white ring-offset-2 ring-offset-orange-600' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Ticket className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{cardCounts.temporary}</span>
          </div>
          <p className="text-xs font-medium opacity-90">Temporary Cards</p>
        </button>

        {/* Regular Cards */}
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'Regular' ? null : 'Regular')}
          className={`bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'Regular' ? 'ring-2 ring-white ring-offset-2 ring-offset-blue-600' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{cardCounts.regular}</span>
 </div>
          <p className="text-xs font-medium opacity-90">Regular Cards</p>
        </button>

        {/* Student Cards */}
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'Student' ? null : 'Student')}
          className={`bg-linear-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'Student' ? 'ring-2 ring-white ring-offset-2 ring-offset-green-600' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{cardCounts.student}</span>
          </div>
          <p className="text-xs font-medium opacity-90">Student Cards</p>
        </button>

        {/* PWD Cards */}
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'PWD' ? null : 'PWD')}
          className={`bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'PWD' ? 'ring-2 ring-white ring-offset-2 ring-offset-purple-600' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{cardCounts.pwd}</span>
          </div>
          <p className="text-xs font-medium opacity-90">PWD Cards</p>
        </button>

        {/* Senior Citizen Cards */}
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'Senior Citizen' ? null : 'Senior Citizen')}
          className={`bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'Senior Citizen' ? 'ring-2 ring-white ring-offset-2 ring-offset-amber-600' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{cardCounts.senior}</span>
          </div>
          <p className="text-xs font-medium opacity-90">Senior Citizen Cards</p>
        </button>
      </div>

      {/* Cards list */}
      {(() => {
        let displayCards = cards || [];
        if (selectedFilter === 'temporary') {
          displayCards = tempCards || [];
        } else if (selectedFilter && selectedFilter !== 'all') {
          displayCards = cards?.filter((c: QRCard) => c.card_type === selectedFilter) || [];
        }

        if (displayCards.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-64 text-white/60">
              <CreditCard className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium">No cards found</p>
              <p className="text-sm mt-1">Click "Register New Card" to get started</p>
            </div>
          );
        }

        return (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Card ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Passenger Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Issued Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {displayCards.map((card: QRCard) => (
                  <tr key={card.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-white">{card.card_uid}</span>
                        {card.status === 'deactivated' && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500/20 text-orange-400">TEMP</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{card.owner_name}</p>
                      <p className="text-xs text-white/60">{card.contact_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                        card.card_type === 'regular' ? 'bg-blue-500/20 text-blue-400' :
                        card.card_type === 'student' ? 'bg-green-500/20 text-green-400' :
                        card.card_type === 'senior_citizen' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {card.card_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-emerald-400">₱{(card.balance ?? 0).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        card.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          card.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
                        }`} />
                        {card.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white/60">{new Date(card.issuedAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewCard(card)}
                          className="p-2 text-white/60 hover:text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors"
                          title="View Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditCard(card)}
                          className="p-2 text-white/60 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Edit Card"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {card.status === 'active' ? (
                          <button
                            onClick={() => disableMutation.mutate(card.card_uid)}
                            className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Disable Card"
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => activateMutation.mutate(card.card_uid)}
                            className="p-2 text-white/60 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            title="Activate Card"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setReplaceTarget(card)}
                          className="p-2 text-white/60 hover:text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors"
                          title="Replace Card"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCard(card)}
                          className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete Card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* Register modal */}
      {showRegister && (
        <RegisterCardModal
          onClose={() => setShowRegister(false)}
          onSuccess={handleRegistered}
        />
      )}

      {/* Auto-show generated card after registration */}
      {newCard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md border border-white/20 p-6">
            <h3 className="text-white font-bold mb-4">New Card Generated</h3>
            <p className="text-white/60 mb-4">Card ID: {newCard.card_uid}</p>
            <Button onClick={() => setNewCard(null)}>Close</Button>
          </div>
        </div>
      )}

      {/* View existing card */}
      {viewCard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md border border-white/20 p-6">
            <h3 className="text-white font-bold mb-4">Card Details</h3>
            <p className="text-white/60 mb-2">Card ID: {viewCard.card_uid}</p>
            <p className="text-white/60 mb-2">Passenger: {viewCard.owner_name}</p>
            <p className="text-white/60 mb-2">Type: {viewCard.card_type}</p>
            <p className="text-white/60 mb-2">Balance: ₱{viewCard.balance.toFixed(2)}</p>
            <Button onClick={() => setViewCard(null)}>Close</Button>
          </div>
        </div>
      )}

      {/* Replace confirm */}
      {replaceTarget && (
        <ReplaceCardModal
          card={replaceTarget}
          onClose={() => setReplaceTarget(null)}
          onConfirm={(newCardData: any) => replaceMutation.mutate({ oldCardId: replaceTarget.cardId, newCardData })}
        />
      )}

      {/* Edit card */}
      {editCard && (
        <EditCardModal
          card={editCard}
          onClose={() => setEditCard(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['qrCards'] })}
        />
      )}

      {/* Delete card */}
      {deleteCard && (
        <DeleteCardModal
          card={deleteCard}
          onClose={() => setDeleteCard(null)}
          onConfirm={() => deleteMutation.mutate(deleteCard.cardId)}
        />
      )}
    </div>
  );
}
