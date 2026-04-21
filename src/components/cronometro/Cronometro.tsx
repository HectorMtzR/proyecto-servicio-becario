"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  startWorkSessionAction,
  stopWorkSessionAction,
  type ActiveSessionData,
} from "@/actions/cronometro";
import {
  stopWorkSessionSchema,
  type StopWorkSessionInput,
} from "@/lib/validations/cronometro";
import { useCronometroStore } from "@/stores/cronometro-store";
import { useCronometro, formatHMS } from "@/hooks/use-cronometro";

interface CronometroProps {
  initialActive: ActiveSessionData | null;
  hasAssignment: boolean;
}

export default function Cronometro({ initialActive, hasAssignment }: CronometroProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const storeStartTime = useCronometroStore((s) => s.startTime);
  const setActiveStore = useCronometroStore((s) => s.setActive);
  const clearStore     = useCronometroStore((s) => s.clear);

  // Sincronizar store con la DB (fuente de verdad) al montar
  useEffect(() => {
    if (initialActive) {
      setActiveStore({
        sessionId:    initialActive.id,
        assignmentId: initialActive.assignmentId,
        startTime:    initialActive.startTime,
      });
    } else {
      clearStore();
    }
    setHydrated(true);
  }, [initialActive, setActiveStore, clearStore]);

  const effectiveStartTime = hydrated
    ? storeStartTime
    : initialActive?.startTime ?? null;

  const isActive    = Boolean(effectiveStartTime);
  const elapsedSecs = useCronometro(effectiveStartTime);
  const { hm, ss }  = formatHMS(elapsedSecs);

  const form = useForm<StopWorkSessionInput>({
    resolver: zodResolver(stopWorkSessionSchema),
    defaultValues: { description: "" },
    mode: "onChange",
  });

  function handleStart() {
    if (!hasAssignment) {
      toast.error("No tienes una asignación activa. Contacta al administrador.");
      return;
    }
    startTransition(async () => {
      const res = await startWorkSessionAction();
      if (!res.success || !res.data) {
        toast.error(res.error ?? "No se pudo iniciar la jornada");
        return;
      }
      setActiveStore({
        sessionId:    res.data.id,
        assignmentId: res.data.assignmentId,
        startTime:    res.data.startTime,
      });
      toast.success("Jornada iniciada");
      router.refresh();
    });
  }

  function handleOpenStop() {
    if (elapsedSecs < 30 * 60) {
      toast.error(
        `La jornada debe durar al menos 30 minutos. Transcurridos: ${Math.floor(elapsedSecs / 60)} min.`,
      );
      return;
    }
    setShowModal(true);
  }

  function onSubmitStop(values: StopWorkSessionInput) {
    startTransition(async () => {
      const res = await stopWorkSessionAction(values);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo detener la jornada");
        return;
      }
      clearStore();
      form.reset();
      setShowModal(false);
      toast.success("Jornada finalizada. Pendiente de validación.");
      router.refresh();
    });
  }

  return (
    <>
      <section className="relative col-span-12 flex flex-col items-center justify-center overflow-hidden rounded-xl bg-surface-container-lowest p-8 text-center shadow-card lg:col-span-8">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary to-orange-400" />

        <span className="mb-4 font-label text-xs font-bold uppercase tracking-[0.2em] text-secondary">
          {isActive ? "Jornada Activa" : "Cronómetro listo"}
        </span>

        <div className="mb-8 flex items-baseline gap-4">
          <span className="font-headline text-8xl font-black tracking-tighter text-on-surface tabular-nums">
            {hm}
          </span>
          <span className="font-headline text-3xl font-bold text-primary tabular-nums">
            {ss}
          </span>
        </div>

        <div className="flex w-full max-w-sm gap-4">
          {!isActive ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={isPending || !hasAssignment}
              className="flex-1 rounded-xl bg-primary-container py-4 text-base font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isPending ? "Iniciando..." : "Iniciar Jornada"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenStop}
              disabled={isPending}
              className="flex-1 rounded-xl border-2 border-orange-200 py-4 text-base font-bold text-primary transition-all hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Finalizar
            </button>
          )}
        </div>

        {!hasAssignment && !isActive && (
          <p className="mt-4 max-w-sm text-sm text-secondary">
            No tienes una asignación activa. Contacta al administrador para
            iniciar tu servicio becario.
          </p>
        )}
      </section>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
          onClick={() => !isPending && setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-surface-container-lowest p-8 shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 font-headline text-2xl font-black tracking-tight text-on-surface">
              Finalizar jornada
            </h2>
            <p className="mb-6 text-sm text-secondary">
              Duración: <span className="font-bold text-on-surface">{hm}:{ss}</span>.
              Describe las actividades realizadas (mínimo 10 caracteres).
            </p>

            <form onSubmit={form.handleSubmit(onSubmitStop)} className="space-y-4">
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                >
                  Descripción de actividades
                </label>
                <textarea
                  id="description"
                  rows={5}
                  {...form.register("description")}
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-container/30"
                  placeholder="Ej: Apoyo en el laboratorio revisando equipos, soporte a estudiantes con..."
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
                  onClick={() => setShowModal(false)}
                  disabled={isPending}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-secondary transition-all hover:bg-surface-container-low disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !form.formState.isValid}
                  className="rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isPending ? "Guardando..." : "Confirmar y finalizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
