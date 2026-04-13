"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export interface PendingValidationData {
  id:             string;
  studentName:    string;
  studentMatricula: string;
  studentCareer:  string;
  startTime:      string; // ISO
  endTime:        string; // ISO
  totalMinutes:   number;
  description:    string | null;
  isManual:       boolean;
  createdAt:      string; // ISO
}

export interface SupervisedStudentData {
  assignmentId:       string;
  studentId:          string;
  studentName:        string;
  studentMatricula:   string;
  career:             string;
  faculty:            string;
  scholarshipPercent: number;
  targetHours:        number;
  accumulatedHours:   number;
  progressPercent:    number;
  department:         string;
  estatus:            "En Tiempo" | "Atrasado" | "Sin Datos";
  pendingCount:       number;
}

/**
 * Jornadas terminadas (endTime != null) con status PENDIENTE de alumnos
 * asignados a este jefe en período activo.
 */
export async function getPendingValidations(): Promise<PendingValidationData[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "JEFE_SERVICIO") return [];

  const rows = await db.workSession.findMany({
    where: {
      status:  "PENDIENTE",
      endTime: { not: null },
      assignment: {
        supervisorId: session.user.id,
        isActive:     true,
        period:       { isClosed: false, isActive: true },
      },
    },
    include: {
      student: {
        include: {
          studentProfile: { include: { career: true } },
        },
      },
    },
    orderBy: { endTime: "asc" },
  });

  return rows.map((r) => ({
    id:               r.id,
    studentName:      r.student.name,
    studentMatricula: r.student.studentProfile?.studentId ?? "—",
    studentCareer:    r.student.studentProfile?.career.name ?? "—",
    startTime:        r.startTime.toISOString(),
    endTime:          r.endTime!.toISOString(),
    totalMinutes:     r.totalMinutes ?? 0,
    description:      r.description,
    isManual:         r.isManual,
    createdAt:        r.createdAt.toISOString(),
  }));
}

async function assertSupervisorOwnsSession(sessionId: string, supervisorId: string) {
  const ws = await db.workSession.findUnique({
    where:   { id: sessionId },
    include: { assignment: { include: { period: true } } },
  });
  if (!ws) return { error: "Jornada no encontrada" as const };
  if (ws.assignment.supervisorId !== supervisorId) {
    return { error: "No puedes validar jornadas de alumnos que no te están asignados" as const };
  }
  if (!ws.assignment.isActive) {
    return { error: "La asignación ya no está activa" as const };
  }
  if (ws.assignment.period.isClosed) {
    return { error: "El período está cerrado" as const };
  }
  if (ws.status !== "PENDIENTE") {
    return { error: "La jornada ya fue validada" as const };
  }
  if (!ws.endTime || ws.totalMinutes === null) {
    return { error: "La jornada aún no ha terminado" as const };
  }
  return { ws };
}

export async function aprobarJornadaAction(
  sessionId: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "JEFE_SERVICIO") {
      return { success: false, error: "Solo los jefes pueden validar jornadas" };
    }

    const check = await assertSupervisorOwnsSession(sessionId, session.user.id);
    if ("error" in check) return { success: false, error: check.error };
    const { ws } = check;

    await db.$transaction([
      db.workSession.update({
        where: { id: sessionId },
        data:  {
          status:      "APROBADA",
          validatedBy: session.user.id,
          validatedAt: new Date(),
        },
      }),
      db.assignment.update({
        where: { id: ws.assignmentId },
        data:  { accumulatedMinutes: { increment: ws.totalMinutes! } },
      }),
    ]);

    revalidatePath("/jefe/validaciones");
    revalidatePath("/jefe/alumnos");
    revalidatePath("/jefe/inicio");
    return { success: true };
  } catch (error) {
    console.error("[aprobarJornadaAction]", error);
    return { success: false, error: "No se pudo aprobar la jornada" };
  }
}

export async function rechazarJornadaAction(
  sessionId: string,
  comment:   string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "JEFE_SERVICIO") {
      return { success: false, error: "Solo los jefes pueden validar jornadas" };
    }

    const trimmed = comment.trim();
    if (trimmed.length < 10) {
      return {
        success: false,
        error:   "El comentario de rechazo debe tener al menos 10 caracteres",
      };
    }
    if (trimmed.length > 500) {
      return { success: false, error: "El comentario no puede exceder 500 caracteres" };
    }

    const check = await assertSupervisorOwnsSession(sessionId, session.user.id);
    if ("error" in check) return { success: false, error: check.error };

    await db.workSession.update({
      where: { id: sessionId },
      data:  {
        status:           "RECHAZADA",
        rejectionComment: trimmed,
        validatedBy:      session.user.id,
        validatedAt:      new Date(),
      },
    });

    revalidatePath("/jefe/validaciones");
    revalidatePath("/jefe/alumnos");
    revalidatePath("/jefe/inicio");
    return { success: true };
  } catch (error) {
    console.error("[rechazarJornadaAction]", error);
    return { success: false, error: "No se pudo rechazar la jornada" };
  }
}

/**
 * Alumnos asignados a este jefe en período activo, con progreso.
 */
export async function getSupervisedStudents(): Promise<SupervisedStudentData[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "JEFE_SERVICIO") return [];

  const assignments = await db.assignment.findMany({
    where: {
      supervisorId: session.user.id,
      isActive:     true,
      period:       { isClosed: false, isActive: true },
    },
    include: {
      student: {
        include: {
          studentProfile: { include: { career: true } },
        },
      },
      period: true,
      _count: {
        select: {
          workSessions: {
            where: { status: "PENDIENTE", endTime: { not: null } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return assignments.map((a) => {
    const profile = a.student.studentProfile;
    const accumulatedHours = a.accumulatedMinutes / 60;
    const progressPercent  = a.targetHours === 0
      ? 0
      : Math.min(100, Math.round((accumulatedHours / a.targetHours) * 100));

    const totalMs  = a.period.endDate.getTime() - a.period.startDate.getTime();
    const doneMs   = now.getTime() - a.period.startDate.getTime();
    const timeFrac = totalMs > 0 ? Math.max(0, Math.min(1, doneMs / totalMs)) : 0;

    let estatus: SupervisedStudentData["estatus"];
    if (a.accumulatedMinutes === 0 && timeFrac < 0.1) {
      estatus = "Sin Datos";
    } else {
      const expectedHours = a.targetHours * timeFrac;
      estatus = accumulatedHours >= expectedHours ? "En Tiempo" : "Atrasado";
    }

    return {
      assignmentId:       a.id,
      studentId:          a.studentId,
      studentName:        a.student.name,
      studentMatricula:   profile?.studentId ?? "—",
      career:             profile?.career.name ?? "—",
      faculty:            profile?.career.faculty ?? "—",
      scholarshipPercent: profile?.scholarshipPercent ?? 0,
      targetHours:        a.targetHours,
      accumulatedHours:   Math.round(accumulatedHours * 10) / 10,
      progressPercent,
      department:         a.department,
      estatus,
      pendingCount:       a._count.workSessions,
    };
  });
}

export interface StudentDetailData {
  student: {
    id:         string;
    name:       string;
    matricula:  string;
    career:     string;
    faculty:    string;
    semester:   number;
    scholarshipPercent: number;
  };
  assignment: {
    department:       string;
    targetHours:      number;
    accumulatedHours: number;
    progressPercent:  number;
  };
  sessions: {
    id:           string;
    startTime:    string;
    endTime:      string | null;
    totalMinutes: number;
    status:       "PENDIENTE" | "APROBADA" | "RECHAZADA" | "CANCELADA";
    isManual:     boolean;
    description:  string | null;
    rejectionComment: string | null;
  }[];
}

export async function getStudentDetail(
  studentId: string,
): Promise<StudentDetailData | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "JEFE_SERVICIO") return null;

  const assignment = await db.assignment.findFirst({
    where: {
      studentId,
      supervisorId: session.user.id,
      isActive:     true,
      period:       { isClosed: false, isActive: true },
    },
    include: {
      student:     { include: { studentProfile: { include: { career: true } } } },
      workSessions: { orderBy: { startTime: "desc" } },
    },
  });

  if (!assignment) return null;

  const profile = assignment.student.studentProfile;
  const accumulatedHours = assignment.accumulatedMinutes / 60;
  const progressPercent  = assignment.targetHours === 0
    ? 0
    : Math.min(100, Math.round((accumulatedHours / assignment.targetHours) * 100));

  return {
    student: {
      id:                 assignment.student.id,
      name:               assignment.student.name,
      matricula:          profile?.studentId ?? "—",
      career:             profile?.career.name ?? "—",
      faculty:            profile?.career.faculty ?? "—",
      semester:           profile?.semester ?? 0,
      scholarshipPercent: profile?.scholarshipPercent ?? 0,
    },
    assignment: {
      department:       assignment.department,
      targetHours:      assignment.targetHours,
      accumulatedHours: Math.round(accumulatedHours * 10) / 10,
      progressPercent,
    },
    sessions: assignment.workSessions.map((s) => ({
      id:               s.id,
      startTime:        s.startTime.toISOString(),
      endTime:          s.endTime?.toISOString() ?? null,
      totalMinutes:     s.totalMinutes ?? 0,
      status:           s.status,
      isManual:         s.isManual,
      description:      s.description,
      rejectionComment: s.rejectionComment,
    })),
  };
}
