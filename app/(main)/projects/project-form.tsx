'use client';

import { createProject } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useState } from 'react';
import { toast } from 'sonner';

export function ProjectForm({ coupleActive }: { coupleActive: boolean }) {
  const [visibility, setVisibility] = useState('PRIVATE');
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    formData.append('visibility', visibility);
    const res = await createProject(formData);
    if (res.success) {
        toast.success('Proyecto guardado');
        (document.getElementById('project-form') as HTMLFormElement)?.reset();
    }
    return res;
  }, null);

  return (
    <form id="project-form" action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la Meta</Label>
        <Input id="name" name="name" required placeholder="Ej: Boda, Viaje" className="rounded-xl h-12" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetAmount">Monto Meta (L)</Label>
        <Input id="targetAmount" name="targetAmount" type="number" step="0.01" required placeholder="0.00" className="rounded-xl h-12" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetDate">Fecha Meta</Label>
        <Input id="targetDate" name="targetDate" type="date" required className="rounded-xl h-12" />
      </div>

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
        {isPending ? 'Guardando...' : 'Guardar Proyecto'}
      </Button>
    </form>
  );
}
