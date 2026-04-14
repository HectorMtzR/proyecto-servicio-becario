"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  closePeriodAction,
  getPeriodPendingSessions,
  type AdminPeriodRow,
  type PendingStudentInfo,
} from "@/actions/periodos";
import PeriodFormModal from "./PeriodFormModal";
import ClosePeriodDialog from "./ClosePeriodDialog";

interface Props {
  periods: AdminPeriodRow[];
}

export default function PeriodosClient({ periods }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showCreate, setShowCreate] = useState(false);

  const [closeTarget, setCloseTarget] = useState<AdminPeriodRow | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closePending, setClosePending] = useState<PendingStudentInfo[]>([]);
  const [closeTotal, setCloseTotal] = useState(0);

  async function openClose(period: AdminPeriodRow) {
    setCloseTarget(period);
    setCloseLoading(true);
    setClosePending([]);
    setCloseTotal(0);
    const res = await getPeriodPendingSessions(period.id);
    if (!res.success) {
      toast.error(res.error ?? "No se pudo verificar el período");
      setCloseLoading(false);
      setCloseTarget(null);
      return;
    }
    setClosePending(res.data?.pending ?? []);
    setCloseTotal(res.data?.total ?? 0);
    setCloseLoading(false);
  }

  function handleClose() {
    if (!closeTarget) return;
    const id = closeTarget.id;
    startTransition(async () => {
      const res = await closePeriodAction(id);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo cerrar el período");
        return;
      }
      toast.success("Período cerrado");
      setCloseTarget(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-black tracking-tight text-on-surface">
            Gestión de períodos
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {periods.length} período(s) registrado(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Crear período
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
        {periods.length === 0 ? (
          <div className="p-12 text-center text-sm text-secondary">
            No hay períodos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-zinc-50">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Inicio
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Fin
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Asignaciones
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Pendientes
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {periods.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-bright">
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {format(new Date(p.startDate), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {format(new Date(p.endDate), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">{p.assignmentCount}</td>
                    <td className="px-6 py-4">
                      {p.pendingCount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600">
                          {p.pendingCount} pendiente(s)
                        </span>
                      ) : (
                        <span className="text-sm text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.isClosed ? (
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                          Cerrado
                        </span>
                      ) : p.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-tertiary-fixed">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.isClosed ? (
                        <span className="text-xs text-secondary">Histórico</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openClose(p)}
                          className="inline-flex items-center gap-1 rounded-xl border-2 border-error-container px-3 py-2 text-xs font-bold text-error transition-all hover:bg-error-container/40"
                        >
                          <span className="material-symbols-outlined text-[16px]">lock</span>
                          Cerrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PeriodFormModal open={showCreate} onClose={() => setShowCreate(false)} />

      <ClosePeriodDialog
        open={closeTarget !== null}
        periodName={closeTarget?.name ?? ""}
        loading={closeLoading}
        pending={closePending}
        totalPending={closeTotal}
        isPending={isPending}
        onConfirm={handleClose}
        onCancel={() => {
          if (isPending) return;
          setCloseTarget(null);
        }}
      />
    </section>
  );
}
