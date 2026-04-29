'use client';

import { createExpense } from '@/app/actions/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActionState, useState } from 'react';
import { toast } from 'sonner';

type ExpenseCardOption = {
  id: string;
  bank: string;
  name: string;
  lastFour: string;
  cardType: string;
};

export function ExpenseForm({ coupleActive, cards }: { coupleActive: boolean; cards: ExpenseCardOption[] }) {
  const [visibility, setVisibility] = useState('PRIVATE');
  const [splitType, setSplitType] = useState('50/50');
  const [paymentMethod, setPaymentMethod] = useState('Tarjeta de credito');
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    formData.append('visibility', visibility);
    const res = await createExpense(formData);
    if (res.success) {
        toast.success('Gasto guardado correctamente');
        (document.getElementById('expense-form') as HTMLFormElement)?.reset();
    }
    return res;
  }, null);

  const categories = [
    'Comida', 'Transporte', 'Casa', 'Universidad', 'Carro', 'Salud', 
    'Deudas', 'Tarjeta', 'Entretenimiento', 'Restaurantes', 
    'Servicios del hogar', 'Supermercado', 'Ropa', 'Educación', 'Emergencias', 'Otro'
  ];

  const cardRequired = paymentMethod === 'Tarjeta de credito' || paymentMethod === 'Tarjeta de debito';
  const selectableCards = cards.filter((card) => (
    paymentMethod === 'Tarjeta de credito' ? card.cardType === 'CREDIT' : paymentMethod === 'Tarjeta de debito' ? card.cardType === 'DEBIT' : false
  ));

  return (
    <form id="expense-form" action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select name="category" required defaultValue="Comida">
          <SelectTrigger className="h-11 rounded-md">
            <SelectValue placeholder="Selecciona..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Descripción Corta</Label>
        <Input id="type" name="type" required placeholder="Ej: Supermercado, restaurante o servicio" className="h-11 rounded-md" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto (L)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" className="h-11 rounded-md" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="h-11 rounded-md" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Método de Pago</Label>
        <Select name="paymentMethod" required defaultValue="Tarjeta de credito" onValueChange={(value) => setPaymentMethod(value || 'Tarjeta de credito')}>
          <SelectTrigger className="h-11 rounded-md">
            <SelectValue placeholder="Selecciona..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Efectivo">Efectivo</SelectItem>
            <SelectItem value="Tarjeta de debito">Tarjeta de débito</SelectItem>
            <SelectItem value="Tarjeta de credito">Tarjeta de crédito</SelectItem>
            <SelectItem value="Transferencia">Transferencia</SelectItem>
            <SelectItem value="Banco">Banco</SelectItem>
            <SelectItem value="Otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {cardRequired && (
        <div className="space-y-2">
          <Label htmlFor="cardId">Tarjeta utilizada</Label>
          <Select name="cardId" required={selectableCards.length > 0}>
            <SelectTrigger className="h-11 rounded-md">
              <SelectValue placeholder={selectableCards.length ? 'Selecciona una tarjeta' : 'No hay tarjetas de este tipo'} />
            </SelectTrigger>
            <SelectContent>
              {selectableCards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.bank} {card.name} ****{card.lastFour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectableCards.length === 0 ? (
            <p className="text-xs text-amber-700">Primero registra una tarjeta de este tipo en el módulo Tarjetas.</p>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="receiptFile">Comprobante</Label>
        <Input id="receiptFile" name="receiptFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="h-11 rounded-md file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm" />
        <p className="text-xs text-slate-500">JPG, PNG, WEBP o PDF. Queda pendiente para OCR/revisión antes de confirmar datos extraídos.</p>
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

      {visibility === 'SHARED' && (
        <div className="space-y-3 rounded-md bg-slate-50 p-4">
          <Label htmlFor="splitType">División</Label>
          <Select name="splitType" defaultValue="50/50" onValueChange={(value) => setSplitType(value || '50/50')}>
            <SelectTrigger className="rounded-md bg-white">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50/50">50 / 50</SelectItem>
              <SelectItem value="70/30">70 / 30 (Yo pago 70%)</SelectItem>
              <SelectItem value="30/70">30 / 70 (Yo pago 30%)</SelectItem>
              <SelectItem value="CUSTOM">Personalizada</SelectItem>
            </SelectContent>
          </Select>
          {splitType === 'CUSTOM' && (
            <div className="space-y-2">
              <Label htmlFor="ownerShare">Porcentaje para Bryan / OWNER</Label>
              <Input id="ownerShare" name="ownerShare" type="number" min="0" max="100" defaultValue="50" className="rounded-md bg-white" />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ownerContribution">Aportó OWNER (L)</Label>
              <Input id="ownerContribution" name="ownerContribution" type="number" step="0.01" min="0" defaultValue="0" className="rounded-md bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerContribution">Aportó PARTNER (L)</Label>
              <Input id="partnerContribution" name="partnerContribution" type="number" step="0.01" min="0" defaultValue="0" className="rounded-md bg-white" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">El sistema calcula la deuda interna según la división y lo que aportó cada persona.</p>
        </div>
      )}

      {(state as any)?.error && (
        <p className="text-red-500 text-sm">{(state as any).error}</p>
      )}

      <Button type="submit" disabled={isPending} className="h-11 w-full rounded-md bg-[#102a4c] text-white hover:bg-[#173b69]">
        {isPending ? 'Guardando...' : 'Guardar gasto'}
      </Button>
    </form>
  );
}
