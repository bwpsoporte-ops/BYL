'use client';

import { createBudget } from '@/app/actions/budgets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CATEGORIES } from '@/lib/finance';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';

export function BudgetForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(async (_prev: unknown, formData: FormData) => {
    return createBudget(formData);
  }, null as Awaited<ReturnType<typeof createBudget>> | null);

  useEffect(() => {
    if (state?.success) {
      toast.success('Presupuesto guardado');
      (document.getElementById('budget-form') as HTMLFormElement | null)?.reset();
      router.refresh();
    }
    if (state?.error) toast.error(state.error);
  }, [router, state]);

  return (
    <form id="budget-form" action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <select id="category" name="category" className="form-control" required>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="monthlyLimit">Límite mensual</Label>
        <Input id="monthlyLimit" name="monthlyLimit" type="number" min="0.01" step="0.01" required className="h-11 rounded-md" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibilidad</Label>
        <select id="visibility" name="visibility" className="form-control">
          <option value="PRIVATE">Privado</option>
          <option value="SHARED">Compartido</option>
        </select>
      </div>
      <Button type="submit" disabled={isPending} className="h-11 w-full rounded-md bg-[#102a4c] text-white hover:bg-[#173b69]">
        {isPending ? 'Guardando...' : 'Guardar límite'}
      </Button>
    </form>
  );
}
