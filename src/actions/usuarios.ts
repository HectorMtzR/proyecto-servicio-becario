"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/usuarios";
import type { ActionResult, Role } from "@/types";

export interface AdminUserRow {
  id:                 string;
  name:               string;
  email:              string;
  role:               Role;
  isActive:           boolean;
  mustChangePassword: boolean;
  createdAt:          string; // ISO
  profile: null | {
    studentId:          string;
    careerId:           string;
    careerName:         string;
    faculty:            string;
    semester:           number;
    enrollmentYear:     number;
    scholarshipPercent: number;
  };
}

export interface CareerOption {
  id:      string;
  name:    string;
  faculty: string;
}

async function requireAdmin(): Promise<{ error: string } | { adminId: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  if (session.user.role !== "ADMIN") return { error: "Solo el administrador puede gestionar usuarios" };
  return { adminId: session.user.id };
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];

  const users = await db.user.findMany({
    include: { studentProfile: { include: { career: true } } },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return users.map((u) => ({
    id:                 u.id,
    name:               u.name,
    email:              u.email,
    role:               u.role,
    isActive:           u.isActive,
    mustChangePassword: u.mustChangePassword,
    createdAt:          u.createdAt.toISOString(),
    profile: u.studentProfile
      ? {
          studentId:          u.studentProfile.studentId,
          careerId:           u.studentProfile.careerId,
          careerName:         u.studentProfile.career.name,
          faculty:            u.studentProfile.career.faculty,
          semester:           u.studentProfile.semester,
          enrollmentYear:     u.studentProfile.enrollmentYear,
          scholarshipPercent: u.studentProfile.scholarshipPercent,
        }
      : null,
  }));
}

export async function listCareers(): Promise<CareerOption[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];
  const rows = await db.career.findMany({ orderBy: { name: "asc" } });
  return rows.map((c) => ({ id: c.id, name: c.name, faculty: c.faculty }));
}

export async function createUserAction(
  input: CreateUserInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;
    const emailNormalized = data.email.toLowerCase();

    const existing = await db.user.findUnique({ where: { email: emailNormalized } });
    if (existing) return { success: false, error: "Ya existe un usuario con ese correo" };

    if (data.role === "ALUMNO") {
      if (!data.profile) return { success: false, error: "Completa los datos del alumno" };

      const career = await db.career.findUnique({ where: { id: data.profile.careerId } });
      if (!career) return { success: false, error: "Carrera inválida" };

      const matriculaEnUso = await db.studentProfile.findUnique({
        where: { studentId: data.profile.studentId },
      });
      if (matriculaEnUso) return { success: false, error: "La matrícula ya está en uso" };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        email:              emailNormalized,
        name:               data.name,
        passwordHash,
        role:               data.role,
        mustChangePassword: true,
        isActive:           true,
        ...(data.role === "ALUMNO" && data.profile
          ? {
              studentProfile: {
                create: {
                  studentId:          data.profile.studentId,
                  careerId:           data.profile.careerId,
                  semester:           data.profile.semester,
                  enrollmentYear:     data.profile.enrollmentYear,
                  scholarshipPercent: data.profile.scholarshipPercent,
                },
              },
            }
          : {}),
      },
    });

    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/inicio");
    return { success: true, data: { id: user.id } };
  } catch (error) {
    console.error("[createUserAction]", error);
    return { success: false, error: "No se pudo crear el usuario" };
  }
}

export async function updateUserAction(
  input: UpdateUserInput,
): Promise<ActionResult> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;

    const user = await db.user.findUnique({
      where:   { id: data.id },
      include: { studentProfile: true },
    });
    if (!user) return { success: false, error: "Usuario no encontrado" };

    if (user.role === "ALUMNO") {
      if (!data.profile) return { success: false, error: "Faltan datos del alumno" };
      if (!user.studentProfile) {
        return { success: false, error: "El alumno no tiene perfil asociado" };
      }

      const career = await db.career.findUnique({ where: { id: data.profile.careerId } });
      if (!career) return { success: false, error: "Carrera inválida" };

      if (data.profile.studentId !== user.studentProfile.studentId) {
        const enUso = await db.studentProfile.findUnique({
          where: { studentId: data.profile.studentId },
        });
        if (enUso) return { success: false, error: "La matrícula ya está en uso" };
      }

      await db.$transaction([
        db.user.update({ where: { id: user.id }, data: { name: data.name } }),
        db.studentProfile.update({
          where: { userId: user.id },
          data: {
            studentId:          data.profile.studentId,
            careerId:           data.profile.careerId,
            semester:           data.profile.semester,
            enrollmentYear:     data.profile.enrollmentYear,
            scholarshipPercent: data.profile.scholarshipPercent,
          },
        }),
      ]);
    } else {
      await db.user.update({ where: { id: user.id }, data: { name: data.name } });
    }

    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    console.error("[updateUserAction]", error);
    return { success: false, error: "No se pudo actualizar el usuario" };
  }
}

/**
 * Verifica si un usuario puede ser desactivado. Devuelve el motivo de bloqueo
 * si tiene relaciones activas en períodos abiertos.
 */
export async function getDeactivateBlockReason(
  userId: string,
): Promise<ActionResult<{ reason: string | null }>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Usuario no encontrado" };
    if (!user.isActive) return { success: true, data: { reason: null } };

    if (user.role === "ADMIN") {
      const activos = await db.user.count({
        where: { role: "ADMIN", isActive: true, id: { not: userId } },
      });
      if (activos === 0) {
        return {
          success: true,
          data: { reason: "Debe existir al menos un administrador activo en el sistema" },
        };
      }
      return { success: true, data: { reason: null } };
    }

    if (user.role === "ALUMNO") {
      const asignacion = await db.assignment.findFirst({
        where: {
          studentId: userId,
          isActive:  true,
          period:    { isClosed: false },
        },
      });
      if (asignacion) {
        return {
          success: true,
          data: {
            reason:
              "El alumno tiene una asignación activa en un período abierto. Primero desactiva o reasigna esa asignación.",
          },
        };
      }
      return { success: true, data: { reason: null } };
    }

    if (user.role === "JEFE_SERVICIO") {
      const count = await db.assignment.count({
        where: {
          supervisorId: userId,
          isActive:     true,
          period:       { isClosed: false },
        },
      });
      if (count > 0) {
        return {
          success: true,
          data: {
            reason: `El jefe tiene ${count} alumno(s) asignado(s) en un período abierto. Primero reasigna a otro jefe.`,
          },
        };
      }
      return { success: true, data: { reason: null } };
    }

    return { success: true, data: { reason: null } };
  } catch (error) {
    console.error("[getDeactivateBlockReason]", error);
    return { success: false, error: "No se pudo verificar el usuario" };
  }
}

export async function setUserActiveAction(
  userId: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Usuario no encontrado" };

    if (!active) {
      const block = await getDeactivateBlockReason(userId);
      if (!block.success) return { success: false, error: block.error };
      if (block.data?.reason) return { success: false, error: block.data.reason };
    }

    await db.user.update({ where: { id: userId }, data: { isActive: active } });

    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/inicio");
    return { success: true };
  } catch (error) {
    console.error("[setUserActiveAction]", error);
    return { success: false, error: "No se pudo actualizar el estado del usuario" };
  }
}
