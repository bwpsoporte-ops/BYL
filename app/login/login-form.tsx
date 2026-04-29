'use client';

import { loginUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const initialState = {
  error: '',
};

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await loginUser(formData);
  }, initialState);

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Usuario</Label>
        <Input 
          id="username" 
          name="username" 
          type="text" 
          required 
          placeholder="Ej: bryan" 
          className="h-12 rounded-lg"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          required 
          placeholder="••••••••" 
          className="h-12 rounded-lg"
        />
      </div>
      {state?.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
      <Button 
        type="submit" 
        disabled={isPending} 
        className="h-12 w-full rounded-lg bg-gray-950 text-white hover:bg-gray-800"
      >
        {isPending ? 'Iniciando...' : 'Ingresar'}
      </Button>
    </form>
  );
}
