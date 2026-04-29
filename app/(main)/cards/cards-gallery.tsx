'use client';

import { deleteCard } from '@/app/actions/cards';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusPill } from '@/components/module-ui';
import { bankAccent, formatLempiras } from '@/lib/finance';
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, RadioTower, ShieldCheck } from 'lucide-react';

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
      className={`relative flex w-full flex-col justify-between overflow-hidden rounded-[22px] border border-white/20 p-6 text-white shadow-3xl shadow-slate-350/50 ${large ? 'h-90 max-w-3xl' : 'h-74 min-h-74'}`}
      style={{ background: `linear-gradient(135deg, ${accent}, #0f172a 78%)` }}
    >
      {card.imageUrl ? <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${card.imageUrl})` }} /> : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.30),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.10),rgba(15,23,42,0.35))]" />
      <div className="absolute right-5 top-5 flex h-10 w-14 items-center justify-center rounded-full border border-white/30 bg-white/15 text-[10px] font-semibold backdrop-blur">
        NFC
      </div>
      <div className="relative">
        <div className="flex justify-between items-start pr-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">{card.bank}</p>
            <p className={large ? 'mt-2 text-2xl font-semibold' : 'mt-2 text-xl font-semibold'}>{card.name}</p>
          </div>
        </div>
        <div className="mt-6 flex h-9 w-12 items-center justify-center rounded-md bg-amber-200/90">
          <div className="h-5 w-8 rounded-sm border border-amber-700/30" />
        </div>
        <p className={`mt-5 font-mono tracking-widest text-white/90 ${large ? 'text-2xl' : 'text-lg'}`}>
          **** **** **** {card.lastFour}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1 text-white/85 backdrop-blur">{card.cardBrand || 'CARD'}</span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-white/85 backdrop-blur">{isCredit ? 'Crédito' : 'Débito'}</span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-white/85 backdrop-blur">Digital First</span>
        </div>
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
          <span>{card.walletEnabled ? 'Token activo' : 'Provisioning pendiente'}</span>
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
      <div className="grid gap-6 xl:grid-cols-2">
        {cards.map((card) => (
          <button key={card.id} type="button" className="rounded-[24px] text-left transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" onClick={() => setSelected(card)}>
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
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-emerald-900">
                  <CheckCircle2 className="mb-2 h-4 w-4" />
                  <p className="font-semibold">Registro local</p>
                  <p className="mt-1 text-xs">Lista para control financiero.</p>
                </div>
                <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-blue-950">
                  <ShieldCheck className="mb-2 h-4 w-4" />
                  <p className="font-semibold">Tokenización</p>
                  <p className="mt-1 text-xs">Preparada para Galileo/VTS/MDES.</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-700">
                  <RadioTower className="mb-2 h-4 w-4" />
                  <p className="font-semibold">Contactless</p>
                  <p className="mt-1 text-xs">Pendiente de provisioning real.</p>
                </div>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Vista preparada para wallet. El pago contactless real requiere token de issuer/procesador antes de activar NFC.
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
