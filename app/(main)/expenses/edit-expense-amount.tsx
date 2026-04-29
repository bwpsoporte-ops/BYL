'use client';

import { updateExpenseAmount } from '@/app/actions/expenses';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatLempiras } from '@/lib/finance';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

export function EditExpenseAmount({
  expenseId,
  currentAmount,
  label,
}: {
  expenseId: string;
  currentAmount: string;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(currentAmount);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('expenseId', expenseId);
      formData.set('amount', amount);
      const result = await updateExpenseAmount(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Monto actualizado');
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="outline" className="h-8 rounded-md px-3 text-xs" onClick={() => setOpen(true)}>
        Editar monto
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar monto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-950">{label}</p>
              <p className="text-slate-500">Monto actual: {formatLempiras(currentAmount)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`amount-${expenseId}`}>Nuevo monto</Label>
              <Input
                id={`amount-${expenseId}`}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                className="h-11 rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={pending} className="rounded-md bg-[#102a4c] text-white hover:bg-[#173b69]" onClick={save}>
                {pending ? 'Guardando...' : 'Guardar cambio'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
