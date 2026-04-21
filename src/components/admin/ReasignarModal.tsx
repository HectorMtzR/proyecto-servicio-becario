"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  removeAssignmentSchema,
  type RemoveAssignmentInput,
} from "@/lib/validations/asignaciones";
import {
  removeOrReassignAssignmentAction,
  type AdminAssignmentRow,
  type SupervisorOption,
} from "@/actions/asignaciones";

interface Props {
  open:        boolean;
  assignment:  AdminAssignmentRow | null;
  supervisors: SupervisorOption[];
  onClose:     () => void;
}

interface FormValues {
  assignmentId:    string;
  reason:          string;
  newSupervisorId: string;
  newDepartment:   string;
}

export default function ReasignarModal({
  open,
  assignment,
  supervisors,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reassign, setReassign] = useState(false);

  const form = useForm<FormValues>({
    resolver:      zodResolver(removeAssignmentSchema) as never,
    defaultValues: {
      assignmentId:    "",
      reason:          "",
      newSupervisorId: "",
      newDepartment:   "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open || !assignment) return;
    setReassign(false);
    form.reset({
      assignmentId:    assignment.id,
      reason:          "",
      newSupervisorId: "",
      newDepartment:   "",
    });
  }, [open, assignment, form]);

  const availableSupervisors = useMemo(() => {
    if (!assignment) return supervisors;
    return supervisors.filter((s) => s.id !== assignment.supervisorId);
  }, [supervisors, assignment]);

  if (!open || !assignment) return null;

  const errors = form.formState.errors;
  const pendingCount = assignment.pendingValidationCount;
  const hasPending = pendingCount > 0;
  const accumulatedHours = Math.round((assignment.accumulatedMinutes / 60) * 10) / 10;

  function handleReassignToggle(next: boolean) {
    setReassign(next);
    if (!next) {
      form.setValue("newSupervisorId", "", { shouldValidate: true });
      form.setValue("newDepartment", "", { shouldValidate: true });
    }
  }

  function onSubmit(values: FormValues) {
    if (hasPending) return;
    const payload: RemoveAssignmentInput = {
      assignmentId:    values.assignmentId,
      reason:          values.reason.trim(),
      newSupervisorId: reassign && values.newSupervisorId ? values.newSupervisorId : undefined,
      newDepartment:   reassign && values.newDepartment ? values.newDepartment.trim() : undefined,
    };
    startTransition(async () => {
      const res = await removeOrReassignAssignmentAction(payload);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo procesar la operación");
        return;
      }
      toast.success(
        reassign
          ? "Asignación removida y alumno reasignado"
          : "Asignación removida",
      );
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface-container-lowest p-8 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-headline text-2xl font-black tracking-tight text-on-surface">
          Reasignar / Remover asignación
        </h2>
        <p className="mb-6 text-sm text-secondary">
          Marca la asignación actual como removida. Opcionalmente, reasigna al alumno
          a otro jefe dentro del mismo período. Las horas acumuladas se transfieren.
        </p>

        <div className="mb-6 rounded-xl bg-surface-container-low p-5">
          <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
            Alumno
          </p>
          <p className="mt-1 text-sm font-medium text-on-surface">
            {assignment.studentName}
          </p>
          <p className="mt-0.5 text-xs text-secondary">
            {assignment.studentMatricula ?? "Sin matrícula"} · Jefe actual:{" "}
            {assignment.supervisorName} · Departamento: {assignment.department}
          </p>
          <p className="mt-2 text-xs text-secondary">
            Período: {assignment.periodName} · Meta: {assignment.targetHours}h ·
            Acumuladas a transferir: <span className="font-bold">{accumulatedHours}h</span>
          </p>
        </div>

        {hasPending && (
          <div className="mb-6 rounded-xl bg-error-container p-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-error-container">
              Acción bloqueada
            </p>
            <p className="mt-1 text-sm font-medium text-on-error-container">
              Hay {pendingCount} jornada{pendingCount === 1 ? "" : "s"} pendiente
              {pendingCount === 1 ? "" : "s"} de validación.
            </p>
            <p className="mt-1 text-xs text-on-error-container">
              El jefe debe aprobar o rechazar esas jornadas antes de poder reasignar
              o remover esta asignación.
            </p>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="r-reason"
              className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
            >
              Motivo de remoción
            </label>
            <textarea
              id="r-reason"
              rows={3}
              disabled={isPending || hasPending}
              maxLength={500}
              placeholder="Describe por qué se remueve esta asignación (mín. 3 caracteres)"
              {...form.register("reason")}
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30 disabled:opacity-70"
            />
            {errors.reason && (
              <p className="mt-2 text-xs font-medium text-error">
                {errors.reason.message}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-surface-container-low p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                disabled={isPending || hasPending}
                checked={reassign}
                onChange={(e) => handleReassignToggle(e.target.checked)}
                className="h-4 w-4 accent-primary-container"
              />
              <span className="text-sm font-medium text-on-surface">
                ¿Asignar a otro jefe?
              </span>
            </label>
            <p className="mt-1 pl-7 text-xs text-secondary">
              Si no seleccionas esta opción, la asignación solo se removerá y el
              alumno quedará sin jefe asignado en este período.
            </p>
          </div>

          {reassign && (
            <>
              <div>
                <label
                  htmlFor="r-supervisor"
                  className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                >
                  Nuevo jefe
                </label>
                <select
                  id="r-supervisor"
                  disabled={isPending || hasPending}
                  {...form.register("newSupervisorId")}
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30 disabled:opacity-70"
                >
                  <option value="">Selecciona un jefe</option>
                  {availableSupervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.newSupervisorId && (
                  <p className="mt-2 text-xs font-medium text-error">
                    {errors.newSupervisorId.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="r-department"
                  className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                >
                  Nuevo departamento
                </label>
                <input
                  id="r-department"
                  type="text"
                  disabled={isPending || hasPending}
                  placeholder="Ej. Coordinación Académica"
                  {...form.register("newDepartment")}
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30 disabled:opacity-70"
                />
                {errors.newDepartment && (
                  <p className="mt-2 text-xs font-medium text-error">
                    {errors.newDepartment.message}
                  </p>
                )}
              </div>
            </>
          )}

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
              disabled={isPending || hasPending}
              className="rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isPending ? "Procesando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
