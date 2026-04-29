'use client';

import { createCard } from '@/app/actions/cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BANK_PRESETS } from '@/lib/finance';
import { useActionState, useState } from 'react';
import { toast } from 'sonner';

export function CreditCardForm({ coupleActive }: { coupleActive: boolean }) {
  const [visibility, setVisibility] = useState('PRIVATE');
  const [cardType, setCardType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [cardNumber, setCardNumber] = useState('');
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    formData.append('visibility', visibility);
    const res = await createCard(formData);
    if (res.success) {
        toast.success('Tarjeta guardada');
        (document.getElementById('card-form') as HTMLFormElement)?.reset();
        setCardNumber('');
    }
    return res;
  }, null);
  const digits = cardNumber.replace(/\D/g, '');
  const brand = detectCardBrand(digits);

  return (
    <form id="card-form" action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bank">Banco</Label>
        <Select name="bank" required defaultValue="BAC">
          <SelectTrigger className="h-11 rounded-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BANK_PRESETS.map((bank) => (
              <SelectItem key={bank.name} value={bank.name}>{bank.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo de tarjeta</Label>
        <input type="hidden" name="cardType" value={cardType} />
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={cardType === 'CREDIT' ? 'default' : 'outline'} className="h-10 rounded-md" onClick={() => setCardType('CREDIT')}>
            Crédito
          </Button>
          <Button type="button" variant={cardType === 'DEBIT' ? 'default' : 'outline'} className="h-10 rounded-md" onClick={() => setCardType('DEBIT')}>
            Débito
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nombre / Alias</Label>
        <Input id="name" name="name" required placeholder="Ej: Platinum" className="h-11 rounded-md" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardNumber">Número de tarjeta</Label>
        <Input
          id="cardNumber"
          name="cardNumber"
          required
          inputMode="numeric"
          autoComplete="off"
          value={formatCardNumber(cardNumber)}
          onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 19))}
          placeholder="0000 0000 0000 0000"
          className="h-11 rounded-md font-mono"
        />
        <p className="text-xs text-slate-500">
          Detectado: {brand}. Se guarda solo la marca y los últimos 4 dígitos, no el número completo.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cvvPreview">Código de seguridad</Label>
        <Input id="cvvPreview" inputMode="numeric" maxLength={4} autoComplete="off" placeholder="No se guarda" className="h-11 rounded-md font-mono" />
        <p className="text-xs text-slate-500">El CVV no se envía ni se guarda por seguridad.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">{cardType === 'CREDIT' ? 'Saldo actual utilizado (L)' : 'Saldo disponible de débito (L)'}</Label>
        <Input id="balance" name="balance" type="number" step="0.01" defaultValue="0" className="h-11 rounded-md" />
      </div>

      {cardType === 'CREDIT' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="creditLimit">Límite de crédito (L)</Label>
            <Input id="creditLimit" name="creditLimit" type="number" step="0.01" required placeholder="0.00" className="h-11 rounded-md" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="minPayment">Pago mínimo (L)</Label>
            <Input id="minPayment" name="minPayment" type="number" step="0.01" defaultValue="0" className="h-11 rounded-md" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cutDate">Corte</Label>
              <Input id="cutDate" name="cutDate" type="date" required className="h-11 rounded-md" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Pago</Label>
              <Input id="dueDate" name="dueDate" type="date" required className="h-11 rounded-md" />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Imagen de referencia</Label>
        <Input id="imageUrl" name="imageUrl" placeholder="URL opcional de imagen de la tarjeta" className="h-11 rounded-md" />
        <p className="text-xs text-slate-500">No guardes foto con número completo, CVV o datos sensibles.</p>
      </div>

      {coupleActive && (
        <div className="space-y-2 border-t border-slate-100 pt-2">
          <Label>Visibilidad</Label>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant={visibility === 'PRIVATE' ? 'default' : 'outline'}
              className="flex-1 rounded-md"
              onClick={() => setVisibility('PRIVATE')}
            >
              Privado
            </Button>
            <Button 
              type="button" 
              variant={visibility === 'SHARED' ? 'default' : 'outline'}
              className="flex-1 rounded-md"
              onClick={() => setVisibility('SHARED')}
            >
              Compartido
            </Button>
          </div>
        </div>
      )}

      {(state as any)?.error && (
        <p className="text-red-500 text-sm">{(state as any).error}</p>
      )}

      <Button type="submit" disabled={isPending} className="h-11 w-full rounded-md bg-[#102a4c] text-white hover:bg-[#173b69]">
        {isPending ? 'Guardando...' : 'Guardar tarjeta'}
      </Button>
    </form>
  );
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
}

function detectCardBrand(digits: string) {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (digits.length >= 4) return 'Otra';
  return 'Pendiente';
}
