"use client";

import type { PendingStudentInfo } from "@/actions/periodos";

interface Props {
  open:        boolean;
  periodName:  string;
  loading:     boolean;
  pending:     PendingStudentInfo[];
  totalPending: number;
  isPending:   boolean;
  onConfirm:   () => void;
  onCancel:    () => void;
}

export default function ClosePeriodDialog({
  open,
  periodName,
  loading,
  pending,
  totalPending,
  isPending,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const blocked = totalPending > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      onClick={() => !isPending && onCancel()}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface-container-lowest p-8 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-headline text-xl font-black tracking-tight text-on-surface">
          {blocked ? "No se puede cerrar el período" : "Cerrar período"}
        </h2>

        {loading ? (
          <p className="mb-6 text-sm text-secondary">Verificando jornadas pendientes...</p>
        ) : blocked ? (
          <>
            <p className="mb-4 text-sm text-secondary">
              El período <span className="font-semibold text-on-surface">{periodName}</span>{" "}
              tiene <span className="font-semibold text-error">{totalPending}</span> jornada(s)
              pendiente(s) de validación. Resuélvelas antes de cerrar.
            </p>
            <div className="mb-6 space-y-2 rounded-xl bg-surface-container-low p-4">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                Alumnos con jornadas pendientes
              </p>
              <ul className="divide-y divide-zinc-50">
                {pending.map((p) => (
                  <li
                    key={p.studentId}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-on-surface">{p.studentName}</span>
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600">
                      {p.pendingCount} pendiente(s)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="mb-6 text-sm text-secondary">
            ¿Deseas cerrar el período{" "}
            <span className="font-semibold text-on-surface">{periodName}</span>? Una vez
            cerrado, no se podrán registrar ni modificar jornadas y no se puede reabrir.
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl px-5 py-3 text-sm font-bold text-secondary transition-all hover:bg-surface-container-low disabled:opacity-60"
          >
            {blocked ? "Cerrar" : "Cancelar"}
          </button>
          {!blocked && !loading && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="rounded-xl bg-error px-6 py-3 text-sm font-bold text-white transition-all hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Cerrando..." : "Cerrar período"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
