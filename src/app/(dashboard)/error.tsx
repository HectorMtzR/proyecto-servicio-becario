"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
          <span className="material-symbols-outlined text-3xl text-on-error-container">
            error
          </span>
        </div>
        <h1 className="mb-2 font-headline text-3xl font-bold tracking-tight text-on-surface">
          Algo salió mal
        </h1>
        <p className="mb-8 font-body text-secondary">
          Ocurrió un error al cargar esta sección. Puedes intentarlo de nuevo o
          recargar la página.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-primary-container px-6 py-3 font-label font-semibold text-on-primary shadow-lg shadow-orange-200/50 transition hover:-translate-y-0.5"
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
          Reintentar
        </button>
      </div>
    </div>
  );
}
