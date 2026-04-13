"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cancelWorkSessionAction, type RecentSessionData } from "@/actions/jornadas";
import StatusChip from "@/components/shared/StatusChip";

export default function RecentActivity({ sessions }: { sessions: RecentSessionData[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  function handleCancel(id: string) {
    setOpenMenu(null);
    startTransition(async () => {
      const res = await cancelWorkSessionAction(id);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo cancelar la jornada");
        return;
      }
      toast.success("Jornada cancelada");
      router.refresh();
    });
  }

  return (
    <section className="col-span-12 overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
      <div className="flex items-center justify-between p-8 pb-6">
        <h3 className="font-headline text-xl font-black tracking-tight text-on-surface">
          Actividad Reciente
        </h3>
      </div>

      {sessions.length === 0 ? (
        <div className="px-8 pb-8 text-sm text-secondary">
          Aún no tienes jornadas registradas. Inicia el cronómetro o registra una
          jornada manual para verla aquí.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                  Fecha
                </th>
                <th className="px-8 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                  Jefe de Servicio
                </th>
                <th className="px-8 py-4 text-center font-label text-xs font-bold uppercase tracking-widest text-secondary">
                  Horas
                </th>
                <th className="px-8 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                  Estado
                </th>
                <th className="px-8 py-4 text-right font-label text-xs font-bold uppercase tracking-widest text-secondary" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sessions.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-surface-bright">
                  <td className="px-8 py-5 text-sm font-medium text-on-surface">
                    {format(new Date(s.date), "d MMM, yyyy", { locale: es })}
                  </td>
                  <td className="px-8 py-5 text-sm text-secondary">
                    {s.supervisorName}
                    {s.isManual && (
                      <span
                        className="material-symbols-outlined ml-2 align-middle text-[14px] text-secondary"
                        title="Registro manual"
                      >
                        edit_note
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center text-sm font-bold text-on-surface">
                    {s.hours > 0 ? s.hours.toFixed(1) : "—"}
                  </td>
                  <td className="px-8 py-5">
                    <StatusChip status={s.status} />
                  </td>
                  <td className="relative px-8 py-5 text-right">
                    {s.canCancel ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(openMenu === s.id ? null : s.id)
                          }
                          disabled={isPending}
                          className="rounded-lg p-1 text-secondary transition-colors hover:bg-surface-container-low hover:text-on-surface disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined align-middle">
                            more_vert
                          </span>
                        </button>
                        {openMenu === s.id && (
                          <div className="absolute right-8 top-14 z-20 w-48 rounded-xl bg-surface-container-lowest p-2 shadow-card-hover">
                            <button
                              type="button"
                              onClick={() => handleCancel(s.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-error transition-colors hover:bg-error-container/40"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                close
                              </span>
                              Cancelar jornada
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-secondary/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
