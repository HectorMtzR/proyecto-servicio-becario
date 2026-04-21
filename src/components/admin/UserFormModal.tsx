"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createUserSchema,
  editUserFormSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/usuarios";
import {
  createUserAction,
  updateUserAction,
  type AdminUserRow,
  type CareerOption,
} from "@/actions/usuarios";
import type { Role } from "@/types";
import type { ScholarshipType } from "@prisma/client";

const SCHOLARSHIP_TYPE_OPTIONS: { value: ScholarshipType; label: string }[] = [
  { value: "ACADEMICA",        label: "Académica" },
  { value: "EXCELENCIA",       label: "Excelencia" },
  { value: "DEPORTIVA",        label: "Deportiva" },
  { value: "CULTURAL",         label: "Cultural" },
  { value: "COMERCIAL",        label: "Comercial" },
  { value: "LIDERAZGO_SOCIAL", label: "Liderazgo Social" },
  { value: "SEP",              label: "SEP" },
];

type Mode = "create" | "edit";

interface Props {
  open:    boolean;
  mode:    Mode;
  user?:   AdminUserRow | null;
  careers: CareerOption[];
  onClose: () => void;
}

type FormValues = {
  name:     string;
  email:    string;
  password: string;
  role:     Role;
  profile: {
    studentId:          string;
    careerId:           string;
    semester:           number;
    enrollmentYear:     number;
    scholarshipPercent: number;
    scholarshipType:    ScholarshipType;
  };
};

const emptyProfile: FormValues["profile"] = {
  studentId:          "",
  careerId:           "",
  semester:           1,
  enrollmentYear:     new Date().getFullYear(),
  scholarshipPercent: 50,
  scholarshipType:    "ACADEMICA",
};

export default function UserFormModal({ open, mode, user, careers, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(mode === "create" ? createUserSchema : editUserFormSchema) as never,
    defaultValues: {
      name:     "",
      email:    "",
      password: "",
      role:     "ALUMNO",
      profile:  emptyProfile,
    },
    mode: "onChange",
  });

  const role = form.watch("role");
  const isAlumno = role === "ALUMNO";
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && user) {
      form.reset({
        name:     user.name,
        email:    user.email,
        password: "",
        role:     user.role,
        profile:  user.profile
          ? {
              studentId:          user.profile.studentId,
              careerId:           user.profile.careerId,
              semester:           user.profile.semester,
              enrollmentYear:     user.profile.enrollmentYear,
              scholarshipPercent: user.profile.scholarshipPercent,
              scholarshipType:    user.profile.scholarshipType,
            }
          : emptyProfile,
      });
    } else {
      form.reset({
        name:     "",
        email:    "",
        password: "",
        role:     "ALUMNO",
        profile:  emptyProfile,
      });
    }
  }, [open, mode, user, form]);

  if (!open) return null;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      if (isEdit && user) {
        const payload: UpdateUserInput = {
          id:   user.id,
          name: values.name,
          profile: user.role === "ALUMNO" ? values.profile : undefined,
        };
        const res = await updateUserAction(payload);
        if (!res.success) {
          toast.error(res.error ?? "No se pudo actualizar el usuario");
          return;
        }
        toast.success("Usuario actualizado");
        onClose();
        router.refresh();
      } else {
        const payload: CreateUserInput = {
          name:     values.name,
          email:    values.email,
          password: values.password,
          role:     values.role,
          profile:  values.role === "ALUMNO" ? values.profile : undefined,
        };
        const res = await createUserAction(payload);
        if (!res.success) {
          toast.error(res.error ?? "No se pudo crear el usuario");
          return;
        }
        toast.success("Usuario creado. Debe cambiar la contraseña al iniciar sesión.");
        onClose();
        router.refresh();
      }
    });
  }

  const errors = form.formState.errors;

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
          {isEdit ? "Editar usuario" : "Crear usuario"}
        </h2>
        <p className="mb-6 text-sm text-secondary">
          {isEdit
            ? "No se permite cambiar el correo ni el rol. Si modificas el porcentaje de beca, solo afectará a nuevas asignaciones."
            : "Se asignará una contraseña temporal que el usuario deberá cambiar en su primer inicio de sesión."}
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="u-name"
              className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
            >
              Nombre completo
            </label>
            <input
              id="u-name"
              type="text"
              disabled={isPending}
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
                htmlFor="u-email"
                className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
              >
                Correo institucional
              </label>
              <input
                id="u-email"
                type="email"
                disabled={isPending || isEdit}
                {...form.register("email")}
                placeholder="nombre@anahuac.mx"
                className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30 disabled:opacity-70"
              />
              {errors.email && (
                <p className="mt-2 text-xs font-medium text-error">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="u-role"
                className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
              >
                Rol
              </label>
              <select
                id="u-role"
                disabled={isPending || isEdit}
                {...form.register("role")}
                className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30 disabled:opacity-70"
              >
                <option value="ALUMNO">Alumno</option>
                <option value="JEFE_SERVICIO">Jefe de Servicio</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label
                htmlFor="u-password"
                className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
              >
                Contraseña temporal
              </label>
              <input
                id="u-password"
                type="text"
                disabled={isPending}
                {...form.register("password")}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
              />
              {errors.password && (
                <p className="mt-2 text-xs font-medium text-error">{errors.password.message}</p>
              )}
            </div>
          )}

          {isAlumno && (
            <div className="rounded-xl bg-surface-container-low p-5">
              <p className="mb-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                Datos del alumno
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="u-matricula"
                    className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                  >
                    Matrícula
                  </label>
                  <input
                    id="u-matricula"
                    type="text"
                    disabled={isPending}
                    {...form.register("profile.studentId")}
                    className="w-full rounded-xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                  />
                  {errors.profile?.studentId && (
                    <p className="mt-2 text-xs font-medium text-error">
                      {errors.profile.studentId.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="u-career"
                    className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                  >
                    Carrera
                  </label>
                  <select
                    id="u-career"
                    disabled={isPending}
                    {...form.register("profile.careerId")}
                    className="w-full rounded-xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                  >
                    <option value="">Selecciona una carrera</option>
                    {careers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.faculty}
                      </option>
                    ))}
                  </select>
                  {errors.profile?.careerId && (
                    <p className="mt-2 text-xs font-medium text-error">
                      {errors.profile.careerId.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="u-semester"
                    className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                  >
                    Semestre
                  </label>
                  <input
                    id="u-semester"
                    type="number"
                    min={1}
                    max={20}
                    disabled={isPending}
                    {...form.register("profile.semester", { valueAsNumber: true })}
                    className="w-full rounded-xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                  />
                  {errors.profile?.semester && (
                    <p className="mt-2 text-xs font-medium text-error">
                      {errors.profile.semester.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="u-year"
                    className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                  >
                    Año de ingreso
                  </label>
                  <input
                    id="u-year"
                    type="number"
                    min={1990}
                    max={2100}
                    disabled={isPending}
                    {...form.register("profile.enrollmentYear", { valueAsNumber: true })}
                    className="w-full rounded-xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                  />
                  {errors.profile?.enrollmentYear && (
                    <p className="mt-2 text-xs font-medium text-error">
                      {errors.profile.enrollmentYear.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="u-scholarship"
                    className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                  >
                    Porcentaje de beca (1-100)
                  </label>
                  <input
                    id="u-scholarship"
                    type="number"
                    min={1}
                    max={100}
                    disabled={isPending}
                    {...form.register("profile.scholarshipPercent", { valueAsNumber: true })}
                    className="w-full rounded-xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                  />
                  {errors.profile?.scholarshipPercent && (
                    <p className="mt-2 text-xs font-medium text-error">
                      {errors.profile.scholarshipPercent.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="u-scholarship-type"
                    className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
                  >
                    Tipo de beca
                  </label>
                  <select
                    id="u-scholarship-type"
                    disabled={isPending}
                    {...form.register("profile.scholarshipType")}
                    className="w-full rounded-xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
                  >
                    {SCHOLARSHIP_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.profile?.scholarshipType && (
                    <p className="mt-2 text-xs font-medium text-error">
                      {errors.profile.scholarshipType.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-secondary">
                    El porcentaje determina la meta de horas. Solo aplica a nuevas asignaciones.
                  </p>
                </div>
              </div>
            </div>
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
              disabled={isPending}
              className="rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
