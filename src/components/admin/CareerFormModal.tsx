"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createCareerSchema,
  type CreateCareerInput,
  type UpdateCareerInput,
} from "@/lib/validations/carreras";
import {
  createCareerAction,
  updateCareerAction,
  type AdminCareerRow,
} from "@/actions/carreras";

type Mode = "create" | "edit";

interface Props {
  open:    boolean;
  mode:    Mode;
  career?: AdminCareerRow | null;
  onClose: () => void;
}

interface FormValues {
  name:    string;
  faculty: string;
}

export default function CareerFormModal({ open, mode, career, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(createCareerSchema) as never,
    defaultValues: { name: "", faculty: "" },
    mode: "onChange",
  });

  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    if (isEdit && career) {
      form.reset({ name: career.name, faculty: career.faculty });
    } else {
      form.reset({ name: "", faculty: "" });
    }
  }, [open, isEdit, career, form]);

  if (!open) return null;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      if (isEdit && career) {
        const payload: UpdateCareerInput = {
          id:      career.id,
          name:    values.name,
          faculty: values.faculty,
        };
        const res = await updateCareerAction(payload);
        if (!res.success) {
          toast.error(res.error ?? "No se pudo actualizar la carrera");
          return;
        }
        toast.success("Carrera actualizada");
      } else {
        const payload: CreateCareerInput = {
          name:    values.name,
          faculty: values.faculty,
        };
        const res = await createCareerAction(payload);
        if (!res.success) {
          toast.error(res.error ?? "No se pudo crear la carrera");
          return;
        }
        toast.success("Carrera creada");
      }
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
          {isEdit ? "Editar carrera" : "Crear carrera"}
        </h2>
        <p className="mb-6 text-sm text-secondary">
          Define el nombre de la carrera y la facultad a la que pertenece.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="c-name"
              className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
            >
              Nombre de la carrera
            </label>
            <input
              id="c-name"
              type="text"
              disabled={isPending}
              {...form.register("name")}
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
            />
            {errors.name && (
              <p className="mt-2 text-xs font-medium text-error">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="c-faculty"
              className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
            >
              Facultad
            </label>
            <input
              id="c-faculty"
              type="text"
              disabled={isPending}
              {...form.register("faculty")}
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
            />
            {errors.faculty && (
              <p className="mt-2 text-xs font-medium text-error">{errors.faculty.message}</p>
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
              {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear carrera"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
