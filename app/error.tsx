'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-4">
      <section className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-red-600">Error del servidor</p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-950">No se pudo cargar esta vista.</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {isDevelopment
            ? error.message
            : 'Ocurrió un error inesperado. Intenta de nuevo en unos segundos.'}
        </p>
        {isDevelopment && error.digest ? (
          <p className="mt-3 text-xs text-gray-500">Digest: {error.digest}</p>
        ) : null}
        <Button className="mt-6 rounded-lg" onClick={reset}>
          Intentar de nuevo
        </Button>
      </section>
    </main>
  );
}
