'use client';

import { createIncome } from '@/app/actions/incomes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActionState, useState } from 'react';
import { toast } from 'sonner';

export function IncomeForm({ coupleActive }: { coupleActive: boolean }) {
  const [visibility, setVisibility] = useState('PRIVATE');
  const [recurring, setRecurring] = useState(false);
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    formData.append('visibility', visibility);
    const res = await createIncome(formData);
    if (res.success) {
        toast.success('Ingreso guardado');
        (document.getElementById('income-form') as HTMLFormElement)?.reset();
    }
    return res;
  }, null);

  const types = ['Salario', 'Freelance', 'Negocio', 'Comisión', 'Bono', 'Otro'];

  return (
    <form id="income-form" action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Tipo de Ingreso</Label>
        <Select name="type" required defaultValue="Salario">
          <SelectTrigger className="rounded-xl h-12">
            <SelectValue placeholder="Selecciona..." />
          </SelectTrigger>
          <SelectContent>
            {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" placeholder="Ej: Quincena" className="rounded-xl h-12" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto (L)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" className="rounded-xl h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="rounded-xl h-12" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
        <div>
          <Label htmlFor="isRecurring">Ingreso recurrente</Label>
          <p className="text-xs text-gray-500">Se marca para generarlo cada periodo.</p>
        </div>
        <input id="isRecurring" name="isRecurring" type="checkbox" checked={recurring} onChange={(event) => setRecurring(event.target.checked)} />
      </div>

      {recurring && (
        <div className="space-y-2">
          <Label htmlFor="recurrenceFrequency">Frecuencia</Label>
          <Select name="recurrenceFrequency" defaultValue="MONTHLY">
            <SelectTrigger className="rounded-lg h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEEKLY">Semanal</SelectItem>
              <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
              <SelectItem value="MONTHLY">Mensual</SelectItem>
              <SelectItem value="YEARLY">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {coupleActive && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <Label>Visibilidad</Label>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant={visibility === 'PRIVATE' ? 'default' : 'outline'}
              className="flex-1 rounded-xl"
              onClick={() => setVisibility('PRIVATE')}
            >
              Privado
            </Button>
            <Button 
              type="button" 
              variant={visibility === 'SHARED' ? 'default' : 'outline'}
              className="flex-1 rounded-xl"
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

      <Button type="submit" disabled={isPending} className="w-full rounded-xl h-12 bg-gray-900 text-white hover:bg-gray-800">
        {isPending ? 'Guardando...' : 'Guardar Ingreso'}
      </Button>
    </form>
  );
}
