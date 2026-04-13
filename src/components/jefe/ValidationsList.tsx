"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { aprobarJornadaAction, type PendingValidationData } from "@/actions/validaciones";
import RejectDialog from "./RejectDialog";

interface Props {
  sessions: PendingValidationData[];
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function ValidationsList({ sessions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{
    id:   string;
    name: string;
  } | null>(null);

  function handleApprove(id: string) {
    setProcessingId(id);
    startTransition(async () => {
      const res = await aprobarJornadaAction(id);
      setProcessingId(null);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo aprobar la jornada");
        return;
      }
      toast.success("Jornada aprobada");
      router.refresh();
    });
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-12 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-fixed">
          <span
            className="material-symbols-outlined text-3xl text-on-tertiary-fixed"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <h3 className="font-headline text-xl font-black tracking-tight text-on-surface">
          Todo al día
        </h3>
        <p className="mt-2 text-sm text-secondary">
          No tienes jornadas pendientes de validación.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sessions.map((s) => {
          const busy = isPending && processingId === s.id;
          return (
            <article
              key={s.id}
              className="rounded-xl bg-surface-container-lowest p-6 shadow-card transition-all hover:shadow-card-hover"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-headline text-lg font-black tracking-tight text-on-surface">
                      {s.studentName}
                    </h3>
                    {s.isManual && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-600">
                        <span className="material-symbols-outlined text-[12px]">edit_note</span>
                        Manual
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-label text-xs font-medium uppercase tracking-widest text-secondary">
                    {s.studentMatricula} · {s.studentCareer}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-low px-4 py-2 text-right">
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Duración
                  </p>
                  <p className="font-headline text-lg font-black text-on-surface">
                    {formatDuration(s.totalMinutes)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Fecha
                  </p>
                  <p className="mt-1 text-sm font-medium text-on-surface">
                    {format(new Date(s.startTime), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Inicio
                  </p>
                  <p className="mt-1 text-sm font-medium text-on-surface">
                    {format(new Date(s.startTime), "HH:mm", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Fin
                  </p>
                  <p className="mt-1 text-sm font-medium text-on-surface">
                    {format(new Date(s.endTime), "HH:mm", { locale: es })}
                  </p>
                </div>
              </div>

              {s.description && (
                <div className="mt-5 rounded-xl bg-surface-container-low p-4">
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Descripción de actividades
                  </p>
                  <p className="mt-2 text-sm text-on-surface">{s.description}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setRejectTarget({ id: s.id, name: s.studentName })
                  }
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-error-container bg-transparent px-5 py-2.5 text-sm font-bold text-error transition-all hover:bg-error-container/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(s.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2.5 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  {busy ? "Aprobando..." : "Aprobar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <RejectDialog
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        sessionId={rejectTarget?.id ?? null}
        studentName={rejectTarget?.name ?? ""}
      />
    </>
  );
}
