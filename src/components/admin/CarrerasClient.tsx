"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCareerAction, type AdminCareerRow } from "@/actions/carreras";
import CareerFormModal from "./CareerFormModal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface Props {
  careers: AdminCareerRow[];
}

export default function CarrerasClient({ careers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modal, setModal] = useState<
    { mode: "create" } | { mode: "edit"; career: AdminCareerRow } | null
  >(null);

  const [confirm, setConfirm] = useState<AdminCareerRow | null>(null);

  function openDelete(career: AdminCareerRow) {
    setConfirm(career);
  }

  function handleDelete() {
    if (!confirm) return;
    const id = confirm.id;
    startTransition(async () => {
      const res = await deleteCareerAction(id);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo eliminar la carrera");
        setConfirm(null);
        return;
      }
      toast.success("Carrera eliminada");
      setConfirm(null);
      router.refresh();
    });
  }

  const blocked = confirm ? confirm.studentCount > 0 : false;

  return (
    <section className="space-y-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-black tracking-tight text-on-surface">
            Catálogo de carreras
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {careers.length} carrera(s) registrada(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Crear carrera
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
        {careers.length === 0 ? (
          <div className="p-12 text-center text-sm text-secondary">
            No hay carreras registradas.
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
                    Facultad
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Alumnos
                  </th>
                  <th className="px-6 py-4 text-right font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {careers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface-bright">
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-secondary">{c.faculty}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                        {c.studentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setModal({ mode: "edit", career: c })}
                          className="inline-flex items-center gap-1 rounded-xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-container-high"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(c)}
                          className="inline-flex items-center gap-1 rounded-xl border-2 border-error-container px-3 py-2 text-xs font-bold text-error transition-all hover:bg-error-container/40"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CareerFormModal
        open={modal !== null}
        mode={modal?.mode ?? "create"}
        career={modal?.mode === "edit" ? modal.career : null}
        onClose={() => setModal(null)}
      />

      <ConfirmDialog
        open={confirm !== null}
        title={blocked ? "No se puede eliminar" : "Eliminar carrera"}
        message={
          blocked
            ? `La carrera "${confirm?.name}" tiene ${confirm?.studentCount} alumno(s) asociado(s). Primero reasigna o desactiva esos alumnos.`
            : `¿Deseas eliminar la carrera "${confirm?.name}"? Esta acción no se puede deshacer.`
        }
        confirmText={blocked ? "Entendido" : "Eliminar"}
        tone={blocked ? "primary" : "danger"}
        isPending={isPending}
        onConfirm={() => {
          if (blocked) {
            setConfirm(null);
            return;
          }
          handleDelete();
        }}
        onCancel={() => {
          if (isPending) return;
          setConfirm(null);
        }}
      />
    </section>
  );
}
