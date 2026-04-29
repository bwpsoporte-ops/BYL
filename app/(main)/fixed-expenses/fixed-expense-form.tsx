'use client';

import { createFixedExpense } from '@/app/actions/fixed-expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CATEGORIES, PAYMENT_METHODS } from '@/lib/finance';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';

export function FixedExpenseForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, formData: FormData) => {
    return createFixedExpense(formData);
  }, null as Awaited<ReturnType<typeof createFixedExpense>> | null);

  useEffect(() => {
    if (state?.success) {
      toast.success('Gasto fijo guardado');
      (document.getElementById('fixed-expense-form') as HTMLFormElement | null)?.reset();
      router.refresh();
    }
    if (state?.error) toast.error(state.error);
  }, [router, state]);

  return (
    <form id="fixed-expense-form" action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Renta, internet, seguro" className="h-11 rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required className="h-11 rounded-md" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dayOfMonth">Día</Label>
          <Input id="dayOfMonth" name="dayOfMonth" type="number" min="1" max="31" defaultValue="1" required className="h-11 rounded-md" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <select id="category" name="category" className="form-control">
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Método de pago</Label>
        <select id="paymentMethod" name="paymentMethod" className="form-control">
          {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibilidad</Label>
        <select id="visibility" name="visibility" className="form-control">
          <option value="PRIVATE">Privado</option>
          <option value="SHARED">Compartido</option>
        </select>
      </div>
      <Button type="submit" disabled={isPending} className="h-11 w-full rounded-md bg-[#102a4c] text-white hover:bg-[#173b69]">
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  );
}
