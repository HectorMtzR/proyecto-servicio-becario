"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { crearJornadaManualAction } from "@/actions/jornadas";
import {
  jornadaManualSchema,
  type JornadaManualInput,
} from "@/lib/validations/jornada-manual";

interface Props {
  open:          boolean;
  onClose:       () => void;
  hasAssignment: boolean;
}

function todayISO() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function RegistroManualModal({ open, onClose, hasAssignment }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<JornadaManualInput>({
    resolver: zodResolver(jornadaManualSchema),
    defaultValues: {
      date:        todayISO(),
      startTime:   "",
      endTime:     "",
      description: "",
    },
    mode: "onChange",
  });

  if (!open) return null;

  function onSubmit(values: JornadaManualInput) {
    startTransition(async () => {
      const res = await crearJornadaManualAction(values);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo registrar la jornada");
        return;
      }
      toast.success("Jornada registrada. Pendiente de validación.");
      form.reset({
        date:        todayISO(),
        startTime:   "",
        endTime:     "",
        description: "",
      });
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      onClick={() => !isPending && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-surface-container-lowest p-8 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-headline text-2xl font-black tracking-tight text-on-surface">
          Registrar Jornada Manual
        </h2>
        <p className="mb-6 text-sm text-secondary">
          Registra una jornada que no capturaste con el cronómetro. Pasará por
          validación de tu jefe como cualquier otra (mínimo 30 minutos).
        </p>

        {!hasAssignment ? (
          <div className="rounded-xl bg-error-container/40 p-4 text-sm text-on-error-container">
            No tienes una asignación activa. Contacta al administrador.
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-5 py-2 text-sm font-bold text-secondary transition-all hover:bg-surface-container-low"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="date"
                className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
              >
                Fecha
              </label>
              <input
                id="date"
                type="date"
                max={todayISO()}
                {...form.register("date")}
                className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                disabled={isPending}
              />
              {form.formState.errors.date && (
                <p className="mt-2 text-xs font-medium text-error">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startTime"
                  className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                >
                  Hora de inicio
                </label>
                <input
                  id="startTime"
                  type="time"
                  {...form.register("startTime")}
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                  disabled={isPending}
                />
                {form.formState.errors.startTime && (
                  <p className="mt-2 text-xs font-medium text-error">
                    {form.formState.errors.startTime.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="endTime"
                  className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                >
                  Hora de fin
                </label>
                <input
                  id="endTime"
                  type="time"
                  {...form.register("endTime")}
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                  disabled={isPending}
                />
                {form.formState.errors.endTime && (
                  <p className="mt-2 text-xs font-medium text-error">
                    {form.formState.errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="manual-description"
                className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
              >
                Descripción de actividades
              </label>
              <textarea
                id="manual-description"
                rows={4}
                {...form.register("description")}
                className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                placeholder="Describe las actividades que realizaste (mín. 10 caracteres)"
                disabled={isPending}
              />
              {form.formState.errors.description && (
                <p className="mt-2 text-xs font-medium text-error">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-xl px-5 py-3 text-sm font-bold text-secondary transition-all hover:bg-surface-container-low disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isPending ? "Guardando..." : "Registrar Jornada"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
