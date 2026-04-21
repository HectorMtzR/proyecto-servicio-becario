"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  removeAssignmentSchema,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
  type RemoveAssignmentInput,
} from "@/lib/validations/asignaciones";
import type { ActionResult } from "@/types";

export interface AdminAssignmentRow {
  id:                 string;
  studentId:          string;
  studentName:        string;
  studentMatricula:   string | null;
  scholarshipPercent: number | null;
  supervisorId:       string;
  supervisorName:     string;
  periodId:           string;
  periodName:         string;
  periodIsClosed:     boolean;
  department:         string;
  targetHours:        number;
  accumulatedMinutes: number;
  isActive:           boolean;
  removalReason:      string | null;
  removedAt:          string | null;
  removedByName:      string | null;
  pendingValidationCount: number;
}

export interface ActivePeriodInfo {
  id:       string;
  name:     string;
  isClosed: boolean;
}

export interface StudentOption {
  id:                 string;
  name:               string;
  matricula:          string;
  scholarshipPercent: number;
}

export interface SupervisorOption {
  id:   string;
  name: string;
}

export interface AssignmentsData {
  assignments:       AdminAssignmentRow[];
  activePeriod:      ActivePeriodInfo | null;
  availableStudents: StudentOption[];
  supervisors:       SupervisorOption[];
}

async function requireAdmin(): Promise<{ error: string } | { ok: true }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  if (session.user.role !== "ADMIN") {
    return { error: "Solo el administrador puede gestionar asignaciones" };
  }
  return { ok: true };
}

export async function listAssignmentsData(): Promise<AssignmentsData> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return {
      assignments:       [],
      activePeriod:      null,
      availableStudents: [],
      supervisors:       [],
    };
  }

  const [assignments, activePeriod, supervisors] = await Promise.all([
    db.assignment.findMany({
      orderBy: [
        { isActive: "desc" },
        { period: { startDate: "desc" } },
        { createdAt: "desc" },
      ],
      include: {
        student: {
          include: { studentProfile: true },
        },
        supervisor: true,
        period:     true,
        removedBy:  { select: { id: true, name: true } },
        workSessions: {
          where:  { status: "PENDIENTE", endTime: { not: null } },
          select: { id: true },
        },
      },
    }),
    db.period.findFirst({
      where: { isActive: true, isClosed: false },
    }),
    db.user.findMany({
      where:   { role: "JEFE_SERVICIO", isActive: true },
      orderBy: { name: "asc" },
      select:  { id: true, name: true },
    }),
  ]);

  let availableStudents: StudentOption[] = [];
  if (activePeriod) {
    const assignedStudentIds = await db.assignment.findMany({
      where:  { periodId: activePeriod.id, isActive: true },
      select: { studentId: true },
    });
    const assignedSet = new Set(assignedStudentIds.map((a) => a.studentId));

    const students = await db.user.findMany({
      where: {
        role:           "ALUMNO",
        isActive:       true,
        studentProfile: { isNot: null },
      },
      orderBy: { name: "asc" },
      include: { studentProfile: true },
    });

    availableStudents = students
      .filter((s) => !assignedSet.has(s.id) && s.studentProfile !== null)
      .map((s) => ({
        id:                 s.id,
        name:               s.name,
        matricula:          s.studentProfile!.studentId,
        scholarshipPercent: s.studentProfile!.scholarshipPercent,
      }));
  }

  return {
    assignments: assignments.map((a) => ({
      id:                 a.id,
      studentId:          a.studentId,
      studentName:        a.student.name,
      studentMatricula:   a.student.studentProfile?.studentId ?? null,
      scholarshipPercent: a.student.studentProfile?.scholarshipPercent ?? null,
      supervisorId:       a.supervisorId,
      supervisorName:     a.supervisor.name,
      periodId:           a.periodId,
      periodName:         a.period.name,
      periodIsClosed:     a.period.isClosed,
      department:         a.department,
      targetHours:        a.targetHours,
      accumulatedMinutes: a.accumulatedMinutes,
      isActive:           a.isActive,
      removalReason:      a.removalReason,
      removedAt:          a.removedAt?.toISOString() ?? null,
      removedByName:      a.removedBy?.name ?? null,
      pendingValidationCount: a.workSessions.length,
    })),
    activePeriod: activePeriod
      ? { id: activePeriod.id, name: activePeriod.name, isClosed: activePeriod.isClosed }
      : null,
    availableStudents,
    supervisors: supervisors.map((s) => ({ id: s.id, name: s.name })),
  };
}

export async function createAssignmentAction(
  input: CreateAssignmentInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const parsed = createAssignmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;

    const activePeriod = await db.period.findFirst({
      where: { isActive: true, isClosed: false },
    });
    if (!activePeriod) {
      return { success: false, error: "No hay un período activo abierto" };
    }

    const student = await db.user.findUnique({
      where:   { id: data.studentId },
      include: { studentProfile: true },
    });
    if (!student || student.role !== "ALUMNO") {
      return { success: false, error: "Alumno inválido" };
    }
    if (!student.isActive) {
      return { success: false, error: "El alumno está desactivado" };
    }
    if (!student.studentProfile) {
      return { success: false, error: "El alumno no tiene perfil académico" };
    }

    const supervisor = await db.user.findUnique({ where: { id: data.supervisorId } });
    if (!supervisor || supervisor.role !== "JEFE_SERVICIO") {
      return { success: false, error: "Jefe inválido" };
    }
    if (!supervisor.isActive) {
      return { success: false, error: "El jefe está desactivado" };
    }

    const duplicate = await db.assignment.findFirst({
      where: {
        studentId: data.studentId,
        periodId:  activePeriod.id,
        isActive:  true,
      },
    });
    if (duplicate) {
      return { success: false, error: "El alumno ya tiene una asignación activa en este período" };
    }

    const assignment = await db.assignment.create({
      data: {
        studentId:    data.studentId,
        supervisorId: data.supervisorId,
        periodId:     activePeriod.id,
        department:   data.department,
        targetHours:  student.studentProfile.scholarshipPercent,
        isActive:     true,
      },
    });

    revalidatePath("/admin/asignaciones");
    revalidatePath("/admin/inicio");
    return { success: true, data: { id: assignment.id } };
  } catch (error) {
    console.error("[createAssignmentAction]", error);
    return { success: false, error: "No se pudo crear la asignación" };
  }
}

export async function updateAssignmentAction(
  input: UpdateAssignmentInput,
): Promise<ActionResult> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const parsed = updateAssignmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;

    const assignment = await db.assignment.findUnique({
      where:   { id: data.id },
      include: { period: true },
    });
    if (!assignment) return { success: false, error: "Asignación no encontrada" };
    if (assignment.period.isClosed) {
      return { success: false, error: "No se puede modificar una asignación en período cerrado" };
    }
    if (!assignment.isActive) {
      return { success: false, error: "No se puede modificar una asignación removida" };
    }

    const supervisor = await db.user.findUnique({ where: { id: data.supervisorId } });
    if (!supervisor || supervisor.role !== "JEFE_SERVICIO") {
      return { success: false, error: "Jefe inválido" };
    }
    if (!supervisor.isActive) {
      return { success: false, error: "El jefe está desactivado" };
    }

    await db.assignment.update({
      where: { id: data.id },
      data:  {
        supervisorId: data.supervisorId,
        department:   data.department,
      },
    });

    revalidatePath("/admin/asignaciones");
    return { success: true };
  } catch (error) {
    console.error("[updateAssignmentAction]", error);
    return { success: false, error: "No se pudo actualizar la asignación" };
  }
}

export async function removeOrReassignAssignmentAction(
  input: RemoveAssignmentInput,
): Promise<ActionResult<{ newAssignmentId: string | null }>> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Solo el administrador puede gestionar asignaciones" };
    }
    const adminId = session.user.id;

    const parsed = removeAssignmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where:   { id: data.assignmentId },
        include: {
          period:       true,
          workSessions: true,
        },
      });
      if (!assignment) {
        return { ok: false as const, error: "Asignación no encontrada" };
      }
      if (assignment.period.isClosed) {
        return { ok: false as const, error: "No se puede modificar una asignación en período cerrado" };
      }
      if (!assignment.isActive) {
        return { ok: false as const, error: "La asignación ya está removida" };
      }

      const pendingTerminated = assignment.workSessions.filter(
        (ws) => ws.status === "PENDIENTE" && ws.endTime !== null,
      ).length;
      if (pendingTerminated > 0) {
        return {
          ok:    false as const,
          error: `Hay ${pendingTerminated} jornada(s) pendientes de validación. El jefe debe resolverlas antes de reasignar.`,
        };
      }

      let newSupervisor: { id: string; role: string; isActive: boolean } | null = null;
      if (data.newSupervisorId) {
        const sup = await tx.user.findUnique({
          where:  { id: data.newSupervisorId },
          select: { id: true, role: true, isActive: true },
        });
        if (!sup || sup.role !== "JEFE_SERVICIO") {
          return { ok: false as const, error: "Jefe inválido" };
        }
        if (!sup.isActive) {
          return { ok: false as const, error: "El jefe está desactivado" };
        }
        if (sup.id === assignment.supervisorId) {
          return { ok: false as const, error: "Selecciona un jefe distinto al actual" };
        }
        newSupervisor = sup;
      }

      await tx.assignment.update({
        where: { id: assignment.id },
        data:  {
          isActive:      false,
          removedAt:     new Date(),
          removedById:   adminId,
          removalReason: data.reason,
        },
      });

      let newAssignmentId: string | null = null;
      if (newSupervisor && data.newDepartment) {
        const created = await tx.assignment.create({
          data: {
            studentId:          assignment.studentId,
            supervisorId:       newSupervisor.id,
            periodId:           assignment.periodId,
            department:         data.newDepartment.trim(),
            targetHours:        assignment.targetHours,
            accumulatedMinutes: assignment.accumulatedMinutes,
            isActive:           true,
          },
        });
        newAssignmentId = created.id;

        await tx.workSession.updateMany({
          where: {
            assignmentId: assignment.id,
            endTime:      null,
          },
          data: { assignmentId: created.id },
        });
      }

      return { ok: true as const, newAssignmentId };
    });

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    revalidatePath("/admin/asignaciones");
    revalidatePath("/admin/inicio");
    return { success: true, data: { newAssignmentId: result.newAssignmentId } };
  } catch (error) {
    console.error("[removeOrReassignAssignmentAction]", error);
    return { success: false, error: "No se pudo procesar la operación" };
  }
}
