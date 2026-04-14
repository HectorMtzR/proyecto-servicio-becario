"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createPeriodSchema,
  type CreatePeriodInput,
} from "@/lib/validations/periodos";
import { createPeriodAction } from "@/actions/periodos";

interface Props {
  open:    boolean;
  onClose: () => void;
}

export default function PeriodFormModal({ open, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreatePeriodInput>({
    resolver: zodResolver(createPeriodSchema) as never,
    defaultValues: { name: "", startDate: "", endDate: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ name: "", startDate: "", endDate: "" });
  }, [open, form]);

  if (!open) return null;

  function onSubmit(values: CreatePeriodInput) {
    startTransition(async () => {
      const res = await createPeriodAction(values);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo crear el período");
        return;
      }
      toast.success("Período creado");
      onClose();
      router.refresh();
    });
  }

  const errors = form.formState.errors;

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
          Crear período
        </h2>
        <p className="mb-6 text-sm text-secondary">
          Solo puede haber un período activo a la vez. Los períodos cerrados no
          se pueden reabrir.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="p-name"
              className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
            >
              Nombre del período
            </label>
            <input
              id="p-name"
              type="text"
              disabled={isPending}
              placeholder="Ej. Agosto - Diciembre 2026"
              {...form.register("name")}
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
            />
            {errors.name && (
              <p className="mt-2 text-xs font-medium text-error">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="p-start"
                className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
              >
                Fecha de inicio
              </label>
              <input
                id="p-start"
                type="date"
                disabled={isPending}
                {...form.register("startDate")}
                className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
              />
              {errors.startDate && (
                <p className="mt-2 text-xs font-medium text-error">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="p-end"
                className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
              >
                Fecha de fin
              </label>
              <input
                id="p-end"
                type="date"
                disabled={isPending}
                {...form.register("endDate")}
                className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
              />
              {errors.endDate && (
                <p className="mt-2 text-xs font-medium text-error">{errors.endDate.message}</p>
              )}
            </div>
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
              {isPending ? "Guardando..." : "Crear período"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
