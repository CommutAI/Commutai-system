import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCalls } from "../../lib/api";
import type { QRCard } from '../types';
import {
  CreditCard, Plus, Power, PowerOff, RefreshCw,
  X, User, Phone, CheckCircle, ChevronRight, Ticket,
  Eye, Edit, Trash2, QrCode, Wallet, Clock, XCircle, Printer,
} from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
// import QRCardDisplay from "../../components/QRCardDisplay";
// import TemporaryCardDisplay from "../../components/TemporaryCardDisplay";
import toast from 'react-hot-toast';
import { Button, Input, Form, FormField, Modal, Select } from '@commutai/ui';

import regularImg from './assets/REGULAR.png';
import studentImg  from './assets/STUDENT.png';
import seniorImg   from './assets/SENIOR-CITIZIEN.png';
import pwdImg      from './assets/PWD.png';

import tempRegularCard from './assets/TEMP-REG.png';
import tempStudentCard from './assets/TEMP-STUD.png';
import tempSeniorCard from './assets/temp-senior.png';
import tempPwdCard from './assets/TEMP-PWD.png';
import tempBackCard from './assets/temp-back.png';

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
    if (!values.owner_name?.trim() || !values.contact_number?.trim()) return;

    // Validate PH mobile number: must start with 09 and be exactly 11 digits
    const raw = values.contact_number.trim();
    const phMobileRegex = /^09\d{9}$/;
    if (!phMobileRegex.test(raw)) {
      toast.error('Enter a valid PH mobile number (e.g. 09171234567)');
      return;
    }

    setData(d => ({
      ...d,
      owner_name: values.owner_name,
      contact_number: raw
    }));
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
    const indicator = typeIndicators[data.card_type] || 'RC';
    const randomNum = Math.floor(10000000 + Math.random() * 90000000).toString();
    const formattedNum = `${randomNum.slice(0, 3)}-${randomNum.slice(3, 5)}-${randomNum.slice(5)}`;
    return `${indicator}-${formattedNum}`;
  }, [data.card_type]);

  const handleSubmit = () => {
    setError(null);
    issueMutation.mutate({
      owner_name:     data.owner_name.trim(),
      contact_number: data.contact_number.trim(),
      card_type: data.card_type,
      card_uid: previewCardId,
      status: 'active',
      balance: 0,
      purchase_price: 100.00
    });
  };

  const selectedType = TYPE_OPTIONS.find(t => t.value === data.card_type)!;

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
          <div className="px-6 py-5 space-y-4">
            <Form
              initialValues={{
                owner_name: data.owner_name,
                contact_number: data.contact_number,
              }}
              onSubmit={handleInfoNext}
            >
              <FormField
                name="owner_name"
                label="Full Name"
                required
              >
                {(field) => (
                  <Input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Juan dela Cruz"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    icon={User}
                    className="bg-white/10 border-white/20 text-white"
                  />
                )}
              </FormField>
              <FormField
                name="contact_number"
                label="Contact Number"
                required
              >
                {(field) => (
                  <Input
                    type="tel"
                    required
                    placeholder="e.g. 09171234567"
                    value={field.value}
                    onChange={(e) => {
                      // Only allow digits, enforce 09 prefix, limit to 11
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 0 && !val.startsWith('09')) {
                        val = '09' + val.replace(/^0+9?/, '').slice(0, 9);
                      }
                      val = val.slice(0, 11);
                      field.onChange(val);
                    }}
                    icon={Phone}
                    className="bg-white/10 border-white/20 text-white"
                    maxLength={11}
                  />
                )}
              </FormField>
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-blue-500 hover:bg-blue-600 border-blue-400"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1 inline-flex items-center" />
                </Button>
              </div>
            </Form>
          </div>
        )}

        {/* ── Step 2: Passenger Type ── */}
        {step === 'type' && (
          <div className="px-6 py-5">
            <p className="text-sm text-white/60 mb-4">
              Select the passenger category for <span className="font-semibold text-white">{data.owner_name}</span>:
            </p>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setData(d => ({ ...d, card_type: opt.value }))}
                  className={`relative rounded-2xl border-2 overflow-hidden transition-all text-left ${
                    data.card_type === opt.value
                      ? opt.color + ' border-opacity-100 shadow-soft scale-105'
                      : 'border-white/20 hover:border-white/30 bg-white/10 hover:scale-102'
                  }`}
                >
                  <img
                    src={opt.img}
                    alt={opt.label}
                    className="w-full h-24 object-cover object-top"
                  />
                  <div className="px-4 py-3">
                    <p className="text-sm font-bold text-white">{opt.label}</p>
                    <p className="text-xs text-white/60">{opt.desc}</p>
                  </div>
                  {data.card_type === opt.value && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button
                onClick={() => setStep('info')}
                variant="secondary"
              >
                Back
              </Button>
              <Button
                onClick={handleTypeNext}
                variant="primary"
                className="bg-blue-500 hover:bg-blue-600 border-blue-400"
              >
                Next <ChevronRight className="w-4 h-4 ml-1 inline-flex items-center" />
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
                  <p className="font-semibold text-white text-sm truncate">{data.owner_name}</p>
                </div>
                {/* Contact */}
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Contact Number</p>
                  <p className="font-semibold text-white text-sm">{data.contact_number}</p>
                </div>
                {/* Type */}
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Passenger Type</p>
                  <p className="text-sm font-semibold text-white capitalize">
                    {data.card_type.replace('_', ' ')}
                  </p>
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
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                    <p className="text-white text-[9px] font-bold truncate leading-tight">
                      {data.owner_name.toUpperCase()}
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

            <div className="flex justify-between pt-4">
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
                className="bg-blue-500 hover:bg-blue-600 border-blue-400"
              >
                {issueMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1 inline-flex items-center" />
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
    const phMobileRegex = /^09\d{9}$/;
    if (!phMobileRegex.test(values.contact_number?.trim())) {
      setError('Enter a valid PH mobile number (e.g. 09171234567)');
      return;
    }
    updateMutation.mutate({
      owner_name: values.owner_name,
      contact_number: values.contact_number.trim(),
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
            owner_name: formData.owner_name,
            contact_number: formData.contact_number,
          }}
          onSubmit={handleSubmit}
        >
          <div className="px-6 py-5 space-y-4">
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
            <FormField name="owner_name" label="Full Name" required>
              {(field) => (
                <Input
                  type="text"
                  required
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setFormData(d => ({ ...d, owner_name: e.target.value }));
                  }}
                  className="bg-white/10 text-white"
                />
              )}
            </FormField>
            <FormField name="contact_number" label="Contact Number" required>
              {(field) => (
                <Input
                  type="tel"
                  required
                  placeholder="e.g. 09171234567"
                  value={field.value}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 0 && !val.startsWith('09')) {
                      val = '09' + val.replace(/^0+9?/, '').slice(0, 9);
                    }
                    val = val.slice(0, 11);
                    field.onChange(val);
                    setFormData(d => ({ ...d, contact_number: val }));
                  }}
                  className="bg-white/10 text-white"
                  maxLength={11}
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
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                variant="primary"
                fullWidth
                className="bg-blue-500 hover:bg-blue-600 border-blue-400 text-white"
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
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
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="danger"
          fullWidth
          className="bg-red-500 hover:bg-red-600 text-white border border-red-400"
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}

// ── Replace card form ───────────────────────────────────────────────────────

function ReplaceCardModal({
  card,
  onClose,
  onConfirm,
}: {
  card: QRCard;
  onClose: () => void;
  onConfirm: (newCardUid: string) => void;
}) {
  const [newCardUid, setNewCardUid] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const trimmed = newCardUid.trim();
    if (!trimmed) {
      setError('Please enter the new Card UID.');
      return;
    }
    if (trimmed === card.card_uid) {
      setError('New Card UID must be different from the current one.');
      return;
    }
    setError('');
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md border border-white/20 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <h2 className="text-base font-bold text-white">Replace Card</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 border border-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Current card info */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Current Card</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Card ID</span>
              <span className="font-mono text-sm font-bold text-white">{card.card_uid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Owner</span>
              <span className="text-sm text-white">{card.owner_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Balance</span>
              <span className="text-sm text-emerald-400 font-semibold">₱{(card.balance ?? 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <p className="text-xs text-orange-300">
              The current card will be marked as <strong>replaced</strong> and the balance will transfer to the new card.
            </p>
          </div>

          {/* New card UID input */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">New Card UID <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="Scan or enter new card UID"
              value={newCardUid}
              onChange={(e) => { setNewCardUid(e.target.value); setError(''); }}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-mono placeholder-white/30 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              autoFocus
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="primary"
              fullWidth
              className="bg-orange-500 hover:bg-orange-600 border-orange-400 text-white"
            >
              Replace Card
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function QRCards() {
  const navigate = useNavigate();
  const [showRegister, setShowRegister]   = useState(false);
  const [showTempModal, setShowTempModal] = useState(false);
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

  // Filter out temporary cards but keep disabled/deactivated cards
  const filteredCards = cards?.filter((c: QRCard) => {
    // Exclude temporary cards by card_uid pattern (TRC-, TPC-, TSCC-, etc.)
    if (c.card_uid && (c.card_uid.startsWith('TRC-') || c.card_uid.startsWith('TPC-') || c.card_uid.startsWith('TSCC-'))) return false;

    // Exclude temporary cards by owner_name
    if (c.owner_name === 'Temporary Card') return false;

    // Exclude cards with TEMP in card_uid
    if (c.card_uid && c.card_uid.includes('TEMP')) return false;

    return true;
  }) || [];

  // Separate active and disabled cards for display
  const activeCards = filteredCards.filter((c: QRCard) => c.status === 'active');
  const disabledCards = filteredCards.filter((c: QRCard) => c.status !== 'active');

  const { data: tempCards, isLoading: isLoadingTemp, error: tempError } = useQuery({
    queryKey: ['temporaryQRCards'],
    queryFn: apiCalls.getTemporaryQRCards,
  });

  // Log tempCards for debugging
  console.log('tempCards:', tempCards);
  console.log('tempError:', tempError);

  // Calculate card counts
  const cardCounts = useMemo(() => {
    // Count only active cards for summary
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
  }, [activeCards, tempCards]);

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

  const generateTempMutation = useMutation({
    mutationFn: (passengerType: 'Regular' | 'Student' | 'Senior Citizen' | 'PWD') =>
      apiCalls.createTemporaryQRCard(passengerType),
    onSuccess: () => {
      toast.success('Temporary QR Card generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['temporaryQRCards'] });
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
      setShowTempModal(false);
    },
    onError: (err: Error) => {
      toast.error(`Failed to generate temporary card: ${err.message}`);
    },
  });

  const handleRegistered = () => {
    queryClient.invalidateQueries({ queryKey: ['qrCards'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    setShowRegister(false);
    // Stay on current page instead of navigating away
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">QR Card Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTempModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-semibold transition-colors shadow-soft border border-orange-400"
          >
            <Ticket className="w-4 h-4" />
            Create Temporary Card
          </button>
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-semibold transition-colors shadow-soft border border-blue-400"
          >
            <Plus className="w-4 h-4" />
            Register New Card
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {/* Total Cards */}
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'all' ? null : 'all')}
          className={`bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'all' ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-700' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{cardCounts.total}</span>
          </div>
          <p className="text-xs font-medium opacity-90">Total Cards</p>
        </button>

        {/* Disabled Cards */}
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'disabled' ? null : 'disabled')}
          className={`bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'disabled' ? 'ring-2 ring-white ring-offset-2 ring-offset-red-700' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <PowerOff className="w-5 h-5 opacity-80" />
            <span className="text-2xl font-bold">{disabledCards.length}</span>
          </div>
          <p className="text-xs font-medium opacity-90">Disabled Cards</p>
        </button>

        {/* Temporary Cards */}
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'temporary' ? null : 'temporary')}
          className={`bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
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
          onClick={() => setSelectedFilter(selectedFilter === 'regular' ? null : 'regular')}
          className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'regular' ? 'ring-2 ring-white ring-offset-2 ring-offset-blue-600' : ''
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
          onClick={() => setSelectedFilter(selectedFilter === 'student' ? null : 'student')}
          className={`bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'student' ? 'ring-2 ring-white ring-offset-2 ring-offset-green-600' : ''
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
          onClick={() => setSelectedFilter(selectedFilter === 'pwd' ? null : 'pwd')}
          className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'pwd' ? 'ring-2 ring-white ring-offset-2 ring-offset-purple-600' : ''
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
          onClick={() => setSelectedFilter(selectedFilter === 'senior_citizen' ? null : 'senior_citizen')}
          className={`bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-soft transition-all hover:scale-105 border border-white/20 ${
            selectedFilter === 'senior_citizen' ? 'ring-2 ring-white ring-offset-2 ring-offset-amber-600' : ''
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
      <div className="flex-1 overflow-y-auto">
        {(() => {
          let displayCards = filteredCards || [];
          if (selectedFilter === 'temporary') {
            displayCards = tempCards || [];
          } else if (selectedFilter === 'all') {
            // Show all regular cards + temporary cards
            displayCards = [...(filteredCards || []), ...(tempCards || [])];
          } else if (selectedFilter === 'disabled') {
            // Show only disabled/deactivated/replaced/lost cards
            displayCards = disabledCards;
          } else if (selectedFilter) {
            // Filter by card type, show only active cards of that type
            displayCards = filteredCards?.filter((c: QRCard) => c.card_type === selectedFilter.toLowerCase() && c.status === 'active') || [];
          } else {
            // Default: show only active regular cards + temporary cards
            displayCards = [...(activeCards || []), ...(tempCards || [])];
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
                <thead className="bg-white/10 border-b border-white/20 sticky top-0">
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
                      <p className="text-sm text-white/60">{new Date(card.created_at).toLocaleDateString()}</p>
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
      </div>

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
          onConfirm={(newCardUid: string) => replaceMutation.mutate({
            oldCardId: replaceTarget.card_uid,
            newCardData: { status: 'replaced', card_uid: newCardUid }
          })}
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
          onConfirm={() => deleteMutation.mutate(deleteCard.id)}
        />
      )}

      {/* Temporary Card Modal */}
      {showTempModal && (
        <TempCardModal
          onClose={() => setShowTempModal(false)}
          onGenerate={(passengerType) => generateTempMutation.mutate(passengerType)}
          isGenerating={generateTempMutation.isPending}
        />
      )}
    </div>
  );
}

// ── Temporary Card Modal ─────────────────────────────────────────────────────

const TEMP_TEMPLATES: Record<string, string> = {
  'Regular': tempRegularCard,
  'Student': tempStudentCard,
  'Senior Citizen': tempSeniorCard,
  'PWD': tempPwdCard,
};

function formatCardType(cardType: string): string {
  if (!cardType) return 'Regular';
  return cardType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function useTempCardCanvas(card: QRCard, qrRef: React.RefObject<HTMLDivElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const timer = setTimeout(() => {
      const img = new Image();
      const templateKey = formatCardType(card.card_type);
      img.src = TEMP_TEMPLATES[templateKey] || tempRegularCard;
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const W = canvas.width;
        const H = canvas.height;

        // Draw card template background
        ctx.drawImage(img, 0, 0);

        // Draw QR code on the right side
        const qrCanvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
        if (qrCanvas) {
          const qrSize = Math.round(W * 0.36);
          const qrX = Math.round(W * 0.58);
          const qrY = Math.round(H * 0.15);

          // White background for QR code
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(qrX, qrY, qrSize, qrSize);

          ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
        }

        // Draw card ID below QR code
        const cardIdY = Math.round(H * 0.88);
        const cardIdX = Math.round(W * 0.78);
        const fontSize = Math.round(W * 0.035);
        
        // Get color based on passenger type
        const colorMap: Record<string, string> = {
          'Regular': '#1362e2',
          'Student': '#1fb451',
          'Senior Citizen': '#961995',
          'PWD': '#f70b0e',
        };
        const displayType = formatCardType(card.card_type);
        const cardIdColor = colorMap[displayType] || '#1362e2';
        
        // Draw background rectangle to hide existing text
        ctx.font = `800 ${fontSize}px 'Courier New', monospace`;
        const textWidth = ctx.measureText(card.card_uid).width;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
          cardIdX - textWidth / 2 - 15,
          cardIdY - fontSize - 8,
          textWidth + 30,
          fontSize + 20
        );
        
        // Draw card ID text
        ctx.fillStyle = cardIdColor;
        ctx.textAlign = 'center';
        ctx.fillText(
          card.card_uid,
          cardIdX,
          cardIdY
        );
      };
    }, 120);

    return () => clearTimeout(timer);
  }, [card, qrRef]);

  return canvasRef;
}

function TempCardModal({
  onClose,
  onGenerate,
  isGenerating,
}: {
  onClose: () => void;
  onGenerate: (passengerType: 'Regular' | 'Student' | 'Senior Citizen' | 'PWD') => void;
  isGenerating: boolean;
}) {
  const [passengerType, setPassengerType] = useState<'Regular' | 'Student' | 'Senior Citizen' | 'PWD'>('Regular');
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Preview card data
  const typeIndicators: Record<string, string> = {
    'Regular': 'TRC',
    'Student': 'TSC',
    'Senior Citizen': 'TSCC',
    'PWD': 'TPC'
  };
  const indicator = typeIndicators[passengerType] || 'TRC';
  const randomNum = Math.floor(10000000 + Math.random() * 90000000).toString();
  const formattedNum = `${randomNum.slice(0, 3)}-${randomNum.slice(3, 5)}-${randomNum.slice(5)}`;
  const previewCardId = `${indicator}-${formattedNum}`;
  
  const previewCard: QRCard = {
    id: 'preview',
    card_uid: previewCardId,
    owner_name: 'Temporary Card',
    card_type: passengerType.toLowerCase().replace(' ', '_') as any,
    contact_number: '',
    status: 'active',
    created_at: new Date().toISOString(),
    balance: 0,
    purchase_price: 0,
  };
  
  const canvasRef = useTempCardCanvas(previewCard, qrRef);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Generate Temporary Card"
    >
      <div className="flex gap-12 mb-6">
        {/* Left side - Form */}
        <div className="flex-1 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Passenger Type</label>
            <Select
              value={passengerType}
              onChange={(value) => setPassengerType(value as any)}
              options={[
                { value: 'Regular', label: 'Regular' },
                { value: 'Student', label: 'Student' },
                { value: 'Senior Citizen', label: 'Senior Citizen' },
                { value: 'PWD', label: 'PWD' },
              ]}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          
          <p className="text-sm text-white/60">
            This is a temporary QR card that can be reused.
            The passenger will hold the card until the end of their trip.
          </p>
        </div>
        
        {/* Right side - Card Preview */}
        <div className="flex-1 flex flex-col items-center justify-center ml-12">
          <div ref={qrRef} className="absolute opacity-0 pointer-events-none">
            <QRCodeCanvas value={previewCard.card_uid} size={512} level="H" includeMargin={true} />
          </div>
          
          <canvas
            ref={canvasRef}
            className="w-full rounded-2xl shadow-lg"
            style={{ imageRendering: 'crisp-edges' }}
          />
          
          <p className="text-xs text-white/40 mt-2">Card Preview</p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={onClose}
          variant="secondary"
          fullWidth
        >
          Cancel
        </Button>
        <Button
          onClick={() => onGenerate(passengerType)}
          disabled={isGenerating}
          variant="primary"
          fullWidth
          className="bg-green-500 hover:bg-green-600 border-green-400"
        >
          {isGenerating ? 'Generating...' : 'Generate Card'}
        </Button>
      </div>
    </Modal>
  );
}
