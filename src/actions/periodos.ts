"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createPeriodSchema,
  type CreatePeriodInput,
} from "@/lib/validations/periodos";
import type { ActionResult } from "@/types";

export interface AdminPeriodRow {
  id:               string;
  name:             string;
  startDate:        string; // ISO
  endDate:          string; // ISO
  isActive:         boolean;
  isClosed:         boolean;
  assignmentCount:  number;
  pendingCount:     number;
}

export interface PendingStudentInfo {
  studentId:    string;
  studentName:  string;
  pendingCount: number;
}

async function requireAdmin(): Promise<{ error: string } | { ok: true }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  if (session.user.role !== "ADMIN") return { error: "Solo el administrador puede gestionar períodos" };
  return { ok: true };
}

export async function listPeriodsAdmin(): Promise<AdminPeriodRow[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];

  const periods = await db.period.findMany({
    orderBy: [{ isClosed: "asc" }, { startDate: "desc" }],
    include: {
      _count: { select: { assignments: true } },
      assignments: {
        select: {
          _count: {
            select: {
              workSessions: {
                where: { status: "PENDIENTE", endTime: { not: null } },
              },
            },
          },
        },
      },
    },
  });

  return periods.map((p) => ({
    id:              p.id,
    name:            p.name,
    startDate:       p.startDate.toISOString(),
    endDate:         p.endDate.toISOString(),
    isActive:        p.isActive,
    isClosed:        p.isClosed,
    assignmentCount: p._count.assignments,
    pendingCount:    p.assignments.reduce(
      (acc, a) => acc + a._count.workSessions,
      0,
    ),
  }));
}

export async function createPeriodAction(
  input: CreatePeriodInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const parsed = createPeriodSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;

    const existing = await db.period.findUnique({ where: { name: data.name } });
    if (existing) return { success: false, error: "Ya existe un período con ese nombre" };

    const activeExists = await db.period.findFirst({
      where: { isActive: true, isClosed: false },
    });
    if (activeExists) {
      return {
        success: false,
        error: `Ya existe un período activo (${activeExists.name}). Ciérralo antes de crear uno nuevo.`,
      };
    }

    const start = new Date(data.startDate);
    const end   = new Date(data.endDate);

    const period = await db.period.create({
      data: {
        name:      data.name,
        startDate: start,
        endDate:   end,
        isActive:  true,
        isClosed:  false,
      },
    });

    revalidatePath("/admin/periodos");
    revalidatePath("/admin/inicio");
    return { success: true, data: { id: period.id } };
  } catch (error) {
    console.error("[createPeriodAction]", error);
    return { success: false, error: "No se pudo crear el período" };
  }
}

/**
 * Devuelve la lista de alumnos con jornadas pendientes en el período,
 * para mostrarle al admin qué falta resolver antes de cerrar.
 */
export async function getPeriodPendingSessions(
  periodId: string,
): Promise<ActionResult<{ pending: PendingStudentInfo[]; total: number }>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const period = await db.period.findUnique({ where: { id: periodId } });
    if (!period) return { success: false, error: "Período no encontrado" };

    const sessions = await db.workSession.findMany({
      where: {
        status:     "PENDIENTE",
        endTime:    { not: null },
        assignment: { periodId },
      },
      select: {
        studentId: true,
        student:   { select: { name: true } },
      },
    });

    const map = new Map<string, PendingStudentInfo>();
    for (const s of sessions) {
      const current = map.get(s.studentId);
      if (current) {
        current.pendingCount += 1;
      } else {
        map.set(s.studentId, {
          studentId:    s.studentId,
          studentName:  s.student.name,
          pendingCount: 1,
        });
      }
    }

    return {
      success: true,
      data: {
        pending: Array.from(map.values()).sort((a, b) =>
          a.studentName.localeCompare(b.studentName),
        ),
        total: sessions.length,
      },
    };
  } catch (error) {
    console.error("[getPeriodPendingSessions]", error);
    return { success: false, error: "No se pudo verificar el período" };
  }
}

export async function closePeriodAction(periodId: string): Promise<ActionResult> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const period = await db.period.findUnique({ where: { id: periodId } });
    if (!period) return { success: false, error: "Período no encontrado" };
    if (period.isClosed) return { success: false, error: "El período ya está cerrado" };

    const pending = await db.workSession.count({
      where: {
        status:     "PENDIENTE",
        endTime:    { not: null },
        assignment: { periodId },
      },
    });
    if (pending > 0) {
      return {
        success: false,
        error: `No se puede cerrar: existen ${pending} jornada(s) pendiente(s) de validación.`,
      };
    }

    await db.period.update({
      where: { id: periodId },
      data:  { isClosed: true, isActive: false },
    });

    revalidatePath("/admin/periodos");
    revalidatePath("/admin/inicio");
    return { success: true };
  } catch (error) {
    console.error("[closePeriodAction]", error);
    return { success: false, error: "No se pudo cerrar el período" };
  }
}
