'use client';

import { deleteCard } from '@/app/actions/cards';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusPill } from '@/components/module-ui';
import { bankAccent, formatLempiras } from '@/lib/finance';
import { useState } from 'react';
import { toast } from 'sonner';

type CardItem = {
  id: string;
  bank: string;
  name: string;
  lastFour: string;
  cardBrand: string | null;
  cardType: string;
  creditLimit: string;
  balance: string;
  visibility: string;
  imageUrl: string | null;
  walletEnabled: boolean;
};

function VisualCard({ card, large = false }: { card: CardItem; large?: boolean }) {
  const isCredit = card.cardType === 'CREDIT';
  const available = isCredit ? Number(card.creditLimit) - Number(card.balance) : Number(card.balance);
  const usagePercentage = isCredit && Number(card.creditLimit) > 0 ? (Number(card.balance) / Number(card.creditLimit)) * 100 : 0;
  const accent = bankAccent(card.bank);

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-lg p-6 text-white shadow-sm ${large ? 'h-72' : 'h-60'}`}
      style={{ backgroundColor: accent }}
    >
      {card.imageUrl ? <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${card.imageUrl})` }} /> : null}
      <div className="absolute inset-0 bg-slate-950/25" />
      <div className="relative">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-white/75 text-sm">{card.bank} {card.cardBrand ? `· ${card.cardBrand}` : ''}</p>
            <p className={large ? 'text-2xl font-semibold' : 'text-lg font-semibold'}>{card.name}</p>
          </div>
          <span className="rounded bg-white px-2 py-1 text-xs font-medium text-slate-950">
            {isCredit ? 'Crédito' : 'Débito'}
          </span>
        </div>
        <p className={`mt-6 font-mono tracking-widest text-white/80 ${large ? 'text-2xl' : 'text-base'}`}>
          **** **** **** {card.lastFour}
        </p>
      </div>
      <div className="relative mt-6 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-white/70">{isCredit ? 'Saldo utilizado' : 'Saldo débito'}</p>
            <p className="font-medium">{formatLempiras(card.balance)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Disponible</p>
            <p className="font-medium">{formatLempiras(available)}</p>
          </div>
        </div>
        {isCredit ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className={`h-full ${usagePercentage > 80 ? 'bg-red-300' : 'bg-white'}`} style={{ width: `${Math.min(usagePercentage, 100)}%` }} />
          </div>
        ) : null}
        <div className="flex justify-between text-xs text-white/75">
          <span>{card.visibility === 'SHARED' ? 'Compartida' : 'Privada'}</span>
          <span>{card.walletEnabled ? 'Wallet activo' : 'Sin pago contactless'}</span>
        </div>
      </div>
    </div>
  );
}

export function CardsGallery({ cards }: { cards: CardItem[] }) {
  const [selected, setSelected] = useState<CardItem | null>(null);

  async function handleDelete(cardId: string) {
    const formData = new FormData();
    formData.set('cardId', cardId);
    const result = await deleteCard(formData);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Tarjeta eliminada');
    setSelected(null);
  }

  if (cards.length === 0) {
    return <div className="panel col-span-full p-8 text-center text-slate-500">No tienes tarjetas registradas.</div>;
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <button key={card.id} type="button" className="text-left transition-transform hover:-translate-y-0.5" onClick={() => setSelected(card)}>
            <VisualCard card={card} />
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.bank} · {selected.name}</DialogTitle>
              </DialogHeader>
              <VisualCard card={selected} large />
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-md border border-slate-200 p-3">
                  <p className="text-slate-500">Tipo</p>
                  <p className="font-semibold text-slate-950">{selected.cardType === 'CREDIT' ? 'Crédito' : 'Débito'}</p>
                </div>
                <div className="rounded-md border border-slate-200 p-3">
                  <p className="text-slate-500">Visibilidad</p>
                  <StatusPill tone={selected.visibility === 'SHARED' ? 'blue' : 'neutral'}>{selected.visibility === 'SHARED' ? 'Compartida' : 'Privada'}</StatusPill>
                </div>
                <div className="rounded-md border border-slate-200 p-3">
                  <p className="text-slate-500">Marca</p>
                  <p className="font-semibold text-slate-950">{selected.cardBrand || 'No detectada'}</p>
                </div>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Por seguridad no se guarda número completo ni CVV. Para pagar en POS se requiere Apple Pay, Google Wallet o tokenización certificada del banco.
              </div>
              <div className="flex justify-end">
                <Button variant="destructive" className="rounded-md" onClick={() => handleDelete(selected.id)}>
                  Eliminar tarjeta
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
