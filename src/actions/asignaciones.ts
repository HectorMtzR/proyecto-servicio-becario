"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
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
      where:  { periodId: activePeriod.id },
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

    const duplicate = await db.assignment.findUnique({
      where: { studentId_periodId: { studentId: data.studentId, periodId: activePeriod.id } },
    });
    if (duplicate) {
      return { success: false, error: "El alumno ya tiene una asignación en este período" };
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
