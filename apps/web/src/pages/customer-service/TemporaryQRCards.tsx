import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCalls } from "../../lib/api";
import type { QRCard } from '../types';
import { QrCode, Plus, Wallet, Clock, XCircle, Trash2, Printer } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Button, Input, FormField, Modal, Select } from '@commutai/ui';

import tempRegularCard from './assets/TEMP-REG.png';
import tempStudentCard from './assets/TEMP-STUD.png';
import tempSeniorCard from './assets/temp-senior.png';
import tempPwdCard from './assets/TEMP-PWD.png';
import tempBackCard from './assets/temp-back.png';

export default function TemporaryQRCards() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<QRCard | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: cards, isLoading } = useQuery({
    queryKey: ['temporaryQRCards'],
    queryFn: apiCalls.getTemporaryQRCards,
  });

  const generateMutation = useMutation({
    mutationFn: (passengerType: 'Regular' | 'Student' | 'Senior Citizen' | 'PWD') => 
      apiCalls.createTemporaryQRCard(passengerType as any),
    onSuccess: () => {
      toast.success('Temporary QR Card generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['temporaryQRCards'] });
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
      setShowGenerateModal(false);
    },
    onError: (err: Error) => {
      toast.error(`Failed to generate temporary card: ${err.message}`);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: apiCalls.deactivateTemporaryQRCard,
    onSuccess: () => {
      toast.success('Temporary card deactivated successfully!');
      queryClient.invalidateQueries({ queryKey: ['temporaryQRCards'] });
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
      setSelectedCard(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to deactivate card: ${err.message}`);
    },
  });

  const topUpMutation = useMutation({
    mutationFn: (cardId: string) => apiCalls.topUp(cardId, parseFloat(topUpAmount), 'cash'),
    onSuccess: () => {
      toast.success(`Card topped up successfully! Amount: ₱${parseFloat(topUpAmount).toFixed(2)}`);
      queryClient.invalidateQueries({ queryKey: ['temporaryQRCards'] });
      queryClient.invalidateQueries({ queryKey: ['qrCards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowTopUpModal(false);
      setTopUpAmount('');
      setSelectedCard(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to top up card: ${err.message}`);
    },
  });

  const handleTopUp = (card: QRCard) => {
    setSelectedCard(card);
    setShowTopUpModal(true);
  };

  const activeCards = cards?.filter((c: QRCard) => c.status === 'active') ?? [];
  const inactiveCards = cards?.filter((c: QRCard) => c.status !== 'active') ?? [];
  const totalBalance = activeCards.length * 100; // Each card has ₱100 balance

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Temporary QR Cards</h1>
          <p className="text-sm text-white">Manage temporary cards with ₱100 balance</p>
        </div>
        <Button
          onClick={() => setShowGenerateModal(true)}
          variant="primary"
          className="bg-green-500 hover:bg-green-600 border-green-400"
        >
          <Plus className="w-4 h-4" />
          Generate Card
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-white/60">Loading...</div>
      ) : cards && cards.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-3xl border border-dashed border-white/20">
          <QrCode className="w-12 h-12 mx-auto text-white/30 mb-3" />
          <p className="text-white/50">No temporary QR cards generated yet</p>
          <p className="text-sm text-white/40 mt-1">Click "Generate Card" to create one</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="glass-card p-6 border border-white/20 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-400" />
              Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                <p className="text-xs text-white/60 mb-1">Active Cards</p>
                <p className="text-2xl font-bold text-green-400">{activeCards.length}</p>
              </div>
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <p className="text-xs text-white/60 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-blue-400">₱{totalBalance.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white/10 border border-white/20 rounded-xl">
                <p className="text-xs text-white/60 mb-1">Total Cards</p>
                <p className="text-2xl font-bold text-white">{cards?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Active Cards */}
          {activeCards.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Active Cards ({activeCards.length})
              </h2>
              <div className="space-y-3">
                {activeCards.map((card: QRCard) => (
                  <CardListItem
                    key={card.id}
                    card={card}
                    onView={() => setSelectedCard(card)}
                    onDeactivate={() => deactivateMutation.mutate(card.card_uid)}
                    onTopUp={() => handleTopUp(card)}
                    isDeactivating={deactivateMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Cards */}
          {inactiveCards.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Inactive Cards ({inactiveCards.length})
              </h2>
              <div className="space-y-3">
                {inactiveCards.map((card: QRCard) => (
                  <CardListItem
                    key={card.id}
                    card={card}
                    onView={() => setSelectedCard(card)}
                    onDeactivate={() => deactivateMutation.mutate(card.card_uid)}
                    onTopUp={() => {}}
                    isDeactivating={deactivateMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateModal
          onClose={() => setShowGenerateModal(false)}
          onGenerate={(passengerType) => generateMutation.mutate(passengerType)}
          isGenerating={generateMutation.isPending}
        />
      )}

      {/* Top Up Modal */}
      {showTopUpModal && selectedCard && (
        <TopUpModal
          card={selectedCard}
          amount={topUpAmount}
          onAmountChange={setTopUpAmount}
          onClose={() => {
            setShowTopUpModal(false);
            setTopUpAmount('');
            setSelectedCard(null);
          }}
          onTopUp={() => topUpMutation.mutate(selectedCard.id)}
          isProcessing={topUpMutation.isPending}
        />
      )}

      {/* Card Detail Modal */}
      {selectedCard && !showTopUpModal && (
        <CardDetailModal
          card={selectedCard}
          allCards={cards || []}
          onClose={() => setSelectedCard(null)}
          onSelectCard={setSelectedCard}
        />
      )}
    </div>
  );
}

function CardListItem({
  card,
  onView,
  onDeactivate,
  onTopUp,
  isDeactivating,
}: {
  card: QRCard;
  onView: () => void;
  onDeactivate: () => void;
  onTopUp: () => void;
  isDeactivating: boolean;
}) {
  const isActive = card.status === 'active';

  return (
    <div className={`glass-card p-4 border ${
      isActive ? 'border-green-500/30' : 'border-white/20'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/20">
            <QrCode className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-mono font-bold text-white text-sm">{card.card_uid}</p>
            <p className="text-xs text-white/60">
              {formatCardType(card.card_type)} · Issued {new Date(card.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-lg text-green-400">₱100.00</p>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/10 text-white/60'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onView}
              variant="secondary"
              size="sm"
            >
              View
            </Button>
            {isActive && (
              <>
                <Button
                  onClick={onTopUp}
                  variant="secondary"
                  size="sm"
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                >
                  Top Up
                </Button>
                <Button
                  onClick={onDeactivate}
                  disabled={isDeactivating}
                  variant="secondary"
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerateModal({
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
          <FormField name="passengerType" label="Passenger Type">
            {() => (
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
            )}
          </FormField>
          
          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-2xl">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-white">Initial Balance</p>
                <p className="text-2xl font-bold text-green-400">₱100.00</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-white/60">
            This card can be used multiple times until the balance is insufficient.
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
          const qrSize = Math.round(W * 0.36); // Reduced size
          const qrX = Math.round(W * 0.58); // Moved left (was 0.62)
          const qrY = Math.round(H * 0.15); // Moved up to avoid bottom border overlap

          // White background for QR code (same size as QR code)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(qrX, qrY, qrSize, qrSize);

          ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
        }

        // Draw card ID below QR code
        const cardIdY = Math.round(H * 0.88); // Moved up from bottom (was 0.93)
        const cardIdX = Math.round(W * 0.78); // Moved right (was 0.74)
        const fontSize = Math.round(W * 0.035); // Even smaller font (reduced from 0.035)
        
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

function CardDetailModal({ 
  card, 
  allCards, 
  onClose, 
  onSelectCard 
}: { 
  card: QRCard; 
  allCards: QRCard[]; 
  onClose: () => void; 
  onSelectCard: (card: QRCard) => void;
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useTempCardCanvas(card, qrRef);
  const [showBack, setShowBack] = useState(false);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const printWindow = window.open('', '', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Temporary Card - ${card.card_uid}</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <img src="${canvas.toDataURL()}" alt="Temporary Card" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Card Details"
      size="large"
    >
      {/* Split pane layout */}
      <div className="flex gap-4 h-[600px]">
        {/* Left pane — Card List */}
        <div className="w-1/3 border-r border-white/20 pr-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white/60 mb-3">All Temporary Cards ({allCards.length})</h3>
          <div className="space-y-2">
            {allCards.map((c: QRCard) => (
              <div
                key={c.id}
                onClick={() => onSelectCard(c)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  c.id === card.id 
                    ? 'bg-green-500/30 border border-green-500/50' 
                    : 'bg-white/10 border border-white/20 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/20">
                    <QrCode className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-white text-xs truncate">{c.card_uid}</p>
                    <p className="text-xs text-white/60 truncate">{formatCardType(c.card_type)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    c.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {c.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right pane — Card Details */}
        <div className="flex-1 pl-4 overflow-y-auto">
          <div className="flex gap-6">
            {/* Left column — Information */}
            <div className="flex-1 space-y-3 max-w-md">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-2xl">
                <p className="text-xs text-white/60 mb-1">Card ID</p>
                <p className="font-mono font-bold text-base text-white break-all">{card.card_uid}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white/10 border border-white/20 rounded-2xl">
                  <p className="text-xs text-white/60 mb-1">Balance</p>
                  <p className="font-bold text-xl text-green-400">₱100.00</p>
                </div>
                <div className="p-4 bg-white/10 border border-white/20 rounded-2xl">
                  <p className="text-xs text-white/60 mb-1">Status</p>
                  <p className={`font-bold text-xl capitalize ${
                    card.status === 'active' ? 'text-green-400' : 'text-white/60'
                  }`}>
                    {card.status}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-white/10 border border-white/20 rounded-2xl">
                <p className="text-xs text-white/60 mb-1">Issued Date</p>
                <p className="font-semibold text-white text-sm">
                  {new Date(card.created_at).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-2xl">
                <p className="text-xs text-blue-300 mb-2 font-semibold">How it works:</p>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li>• Card has ₱100 initial balance</li>
                  <li>• Can be used for multiple trips</li>
                  <li>• Passenger holds card until trip end</li>
                  <li>• Conductor scans and displays fare</li>
                  <li>• Balance deducted per trip</li>
                </ul>
              </div>
            </div>

            {/* Right column — QR Card */}
            <div className="flex flex-col items-center justify-center gap-4 min-w-56 max-w-72">
              <div ref={qrRef} className="absolute opacity-0 pointer-events-none">
                <QRCodeCanvas value={card.card_uid} size={512} level="H" includeMargin={true} />
              </div>
              
              {showBack ? (
                <img src={tempBackCard} alt="Card back" className="w-full rounded-2xl shadow-lg" />
              ) : (
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-2xl shadow-lg"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowBack(v => !v)}
                  variant="secondary"
                  size="sm"
                >
                  {showBack ? 'Show Front' : 'Show Back'}
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="secondary"
                  size="sm"
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6">
        <Button
          onClick={onClose}
          variant="primary"
          fullWidth
          className="bg-green-500 hover:bg-green-600 border-green-400"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}

function TopUpModal({
  card,
  amount,
  onAmountChange,
  onClose,
  onTopUp,
  isProcessing,
}: {
  card: QRCard;
  amount: string;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onTopUp: () => void;
  isProcessing: boolean;
}) {
  const isValid = amount && parseFloat(amount) > 0;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Top Up Card"
    >
      <div className="space-y-4 mb-6">
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-2xl">
          <p className="text-xs text-white/60 mb-1">Card ID</p>
          <p className="font-mono font-bold text-lg text-white">{card.card_uid}</p>
        </div>
        <FormField name="amount" label="Top-up Amount (₱)">
          {(field) => (
            <Input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => {
                field.onChange(e.target.value);
                onAmountChange(e.target.value);
              }}
              placeholder="Enter amount"
              className="bg-white/10 border-white/20 text-white"
            />
          )}
        </FormField>
        <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-2xl">
          <p className="text-xs text-blue-300 mb-2 font-semibold">Note:</p>
          <p className="text-xs text-blue-200">
            Temporary cards can be topped up with any amount. The balance will be added to the card for multiple trips.
          </p>
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
          onClick={onTopUp}
          disabled={!isValid || isProcessing}
          variant="primary"
          fullWidth
          className="bg-green-500 hover:bg-green-600 border-green-400"
        >
          {isProcessing ? 'Processing...' : 'Top Up'}
        </Button>
      </div>
    </Modal>
  );
}
