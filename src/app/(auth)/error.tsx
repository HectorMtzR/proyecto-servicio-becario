"use client";

import { useEffect } from "react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AuthError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-8">
      <div className="max-w-md text-center">
        <h1 className="mb-2 font-headline text-2xl font-bold tracking-tight text-on-surface">
          No se pudo cargar la página
        </h1>
        <p className="mb-6 font-body text-secondary">
          Intenta de nuevo o recarga desde el navegador.
        </p>
        <button
          onClick={reset}
          className="rounded-full bg-primary-container px-6 py-3 font-label font-semibold text-on-primary"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
