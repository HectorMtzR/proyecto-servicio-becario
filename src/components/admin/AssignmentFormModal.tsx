"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createAssignmentSchema,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
} from "@/lib/validations/asignaciones";
import {
  createAssignmentAction,
  updateAssignmentAction,
  type AdminAssignmentRow,
  type StudentOption,
  type SupervisorOption,
  type ActivePeriodInfo,
} from "@/actions/asignaciones";

type Mode = "create" | "edit";

interface Props {
  open:              boolean;
  mode:              Mode;
  assignment?:       AdminAssignmentRow | null;
  activePeriod:      ActivePeriodInfo | null;
  availableStudents: StudentOption[];
  supervisors:       SupervisorOption[];
  onClose:           () => void;
}

interface FormValues {
  studentId:    string;
  supervisorId: string;
  department:   string;
}

export default function AssignmentFormModal({
  open,
  mode,
  assignment,
  activePeriod,
  availableStudents,
  supervisors,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";

  const form = useForm<FormValues>({
    resolver: zodResolver(createAssignmentSchema) as never,
    defaultValues: { studentId: "", supervisorId: "", department: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && assignment) {
      form.reset({
        studentId:    assignment.studentId,
        supervisorId: assignment.supervisorId,
        department:   assignment.department,
      });
    } else {
      form.reset({ studentId: "", supervisorId: "", department: "" });
    }
  }, [open, isEdit, assignment, form]);

  if (!open) return null;

  const selectedStudentId = form.watch("studentId");
  const selectedStudent = availableStudents.find((s) => s.id === selectedStudentId);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      if (isEdit && assignment) {
        const payload: UpdateAssignmentInput = {
          id:           assignment.id,
          supervisorId: values.supervisorId,
          department:   values.department,
        };
        const res = await updateAssignmentAction(payload);
        if (!res.success) {
          toast.error(res.error ?? "No se pudo actualizar la asignación");
          return;
        }
        toast.success("Asignación actualizada");
      } else {
        const payload: CreateAssignmentInput = {
          studentId:    values.studentId,
          supervisorId: values.supervisorId,
          department:   values.department,
        };
        const res = await createAssignmentAction(payload);
        if (!res.success) {
          toast.error(res.error ?? "No se pudo crear la asignación");
          return;
        }
        toast.success("Asignación creada");
      }
      onClose();
      router.refresh();
    });
  }

  const errors = form.formState.errors;
  const canCreate = !isEdit && activePeriod !== null;

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
          {isEdit ? "Editar asignación" : "Crear asignación"}
        </h2>
        <p className="mb-6 text-sm text-secondary">
          {isEdit
            ? "Solo se puede cambiar el departamento y el jefe asignado."
            : activePeriod
              ? `La asignación se creará en el período activo: ${activePeriod.name}. La meta de horas se calcula automáticamente desde el porcentaje de beca del alumno.`
              : "No hay un período activo abierto. Crea uno antes de registrar asignaciones."}
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {isEdit && assignment ? (
            <div className="rounded-xl bg-surface-container-low p-5">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                Alumno
              </p>
              <p className="mt-1 text-sm font-medium text-on-surface">
                {assignment.studentName}
              </p>
              <p className="mt-0.5 text-xs text-secondary">
                {assignment.studentMatricula ?? "Sin matrícula"} · Período:{" "}
                {assignment.periodName}
              </p>
              <p className="mt-2 text-xs text-secondary">
                Meta: {assignment.targetHours}h · Acumuladas:{" "}
                {Math.round((assignment.accumulatedMinutes / 60) * 10) / 10}h
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="a-student"
                className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
              >
                Alumno
              </label>
              <select
                id="a-student"
                disabled={isPending || !canCreate || availableStudents.length === 0}
                {...form.register("studentId")}
                className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30 disabled:opacity-70"
              >
                <option value="">Selecciona un alumno</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.matricula} · {s.scholarshipPercent}% beca
                  </option>
                ))}
              </select>
              {errors.studentId && (
                <p className="mt-2 text-xs font-medium text-error">
                  {errors.studentId.message}
                </p>
              )}
              {canCreate && availableStudents.length === 0 && (
                <p className="mt-2 text-xs text-secondary">
                  Todos los alumnos activos ya tienen asignación en el período vigente.
                </p>
              )}
              {selectedStudent && (
                <p className="mt-2 text-xs text-secondary">
                  Meta de horas calculada: {selectedStudent.scholarshipPercent}h
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="a-supervisor"
              className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
            >
              Jefe de servicio
            </label>
            <select
              id="a-supervisor"
              disabled={isPending || (!isEdit && !canCreate)}
              {...form.register("supervisorId")}
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30 disabled:opacity-70"
            >
              <option value="">Selecciona un jefe</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supervisorId && (
              <p className="mt-2 text-xs font-medium text-error">
                {errors.supervisorId.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="a-department"
              className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
            >
              Departamento
            </label>
            <input
              id="a-department"
              type="text"
              disabled={isPending || (!isEdit && !canCreate)}
              placeholder="Ej. Laboratorios TI"
              {...form.register("department")}
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30 disabled:opacity-70"
            />
            {errors.department && (
              <p className="mt-2 text-xs font-medium text-error">
                {errors.department.message}
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
              disabled={isPending || (!isEdit && !canCreate)}
              className="rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isPending
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear asignación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
