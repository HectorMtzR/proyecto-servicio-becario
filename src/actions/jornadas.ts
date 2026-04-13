"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { differenceInWeeks, startOfMonth, endOfMonth } from "date-fns";
import {
  jornadaManualSchema,
  type JornadaManualInput,
} from "@/lib/validations/jornada-manual";
import type { ActionResult, Status } from "@/types";

export interface AlumnoStatsData {
  accumulatedMinutes: number;
  targetHours:        number;
  progressPercent:    number;
  thisMonthHours:     number;
  weeklyAverage:      number;
  remainingHours:     number;
  estatus:            "En Tiempo" | "Atrasado" | "Sin Datos";
}

export interface RecentSessionData {
  id:             string;
  date:           string;          // ISO
  supervisorName: string;
  hours:          number;          // decimal
  status:         Status;
  isManual:       boolean;
  canCancel:      boolean;
}

/**
 * Estadísticas agregadas del alumno para el período activo.
 * Solo se consideran APROBADA para acumulado y stats de horas.
 */
export async function getAlumnoStats(): Promise<AlumnoStatsData | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ALUMNO") return null;

  const assignment = await db.assignment.findFirst({
    where: {
      studentId: session.user.id,
      isActive:  true,
      period:    { isClosed: false, isActive: true },
    },
    include: { period: true },
    orderBy: { createdAt: "desc" },
  });

  if (!assignment) return null;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const approvedThisMonth = await db.workSession.aggregate({
    _sum: { totalMinutes: true },
    where: {
      assignmentId: assignment.id,
      status:       "APROBADA",
      endTime:      { gte: monthStart, lte: monthEnd },
    },
  });

  const thisMonthMins = approvedThisMonth._sum.totalMinutes ?? 0;

  // Semanas transcurridas en el período (mínimo 1 para evitar división por cero)
  const periodStart = assignment.period.startDate;
  const weeksElapsed = Math.max(1, differenceInWeeks(now, periodStart) + 1);
  const accumulatedHours = assignment.accumulatedMinutes / 60;
  const weeklyAverage    = accumulatedHours / weeksElapsed;
  const remainingHours   = Math.max(0, assignment.targetHours - accumulatedHours);
  const progressPercent  = Math.min(
    100,
    Math.round((accumulatedHours / assignment.targetHours) * 100),
  );

  // "En tiempo" si con el promedio semanal actual alcanza la meta antes del fin de período
  const periodEnd     = assignment.period.endDate;
  const weeksRemaining = Math.max(
    0,
    differenceInWeeks(periodEnd, now),
  );
  const projected = accumulatedHours + weeklyAverage * weeksRemaining;

  let estatus: AlumnoStatsData["estatus"];
  if (assignment.accumulatedMinutes === 0 && weeksElapsed <= 1) {
    estatus = "Sin Datos";
  } else {
    estatus = projected >= assignment.targetHours ? "En Tiempo" : "Atrasado";
  }

  return {
    accumulatedMinutes: assignment.accumulatedMinutes,
    targetHours:        assignment.targetHours,
    progressPercent,
    thisMonthHours:     Math.round((thisMonthMins / 60) * 10) / 10,
    weeklyAverage:      Math.round(weeklyAverage * 10) / 10,
    remainingHours:     Math.round(remainingHours * 10) / 10,
    estatus,
  };
}

/**
 * Jornadas recientes del alumno (últimas 10, cualquier estado).
 */
export async function getRecentSessions(): Promise<RecentSessionData[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ALUMNO") return [];

  const rows = await db.workSession.findMany({
    where: { studentId: session.user.id },
    include: { assignment: { include: { supervisor: true } } },
    orderBy: { startTime: "desc" },
    take: 10,
  });

  return rows.map((r) => ({
    id:             r.id,
    date:           (r.endTime ?? r.startTime).toISOString(),
    supervisorName: r.assignment.supervisor.name,
    hours:          r.totalMinutes ? Math.round((r.totalMinutes / 60) * 10) / 10 : 0,
    status:         r.status,
    isManual:       r.isManual,
    canCancel:      r.status === "PENDIENTE" && r.endTime !== null,
  }));
}

/**
 * Cancela una jornada del alumno (solo si está PENDIENTE y ya terminó).
 */
export async function cancelWorkSessionAction(
  sessionId: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "ALUMNO") {
      return { success: false, error: "Solo los alumnos pueden cancelar jornadas" };
    }

    const ws = await db.workSession.findUnique({
      where: { id: sessionId },
      include: { assignment: { include: { period: true } } },
    });

    if (!ws || ws.studentId !== session.user.id) {
      return { success: false, error: "Jornada no encontrada" };
    }
    if (ws.status !== "PENDIENTE") {
      return { success: false, error: "Solo se pueden cancelar jornadas pendientes" };
    }
    if (!ws.endTime) {
      return {
        success: false,
        error:   "No puedes cancelar una jornada en curso. Deténla primero.",
      };
    }
    if (ws.assignment.period.isClosed) {
      return { success: false, error: "El período está cerrado" };
    }

    await db.workSession.update({
      where: { id: sessionId },
      data:  { status: "CANCELADA" },
    });

    revalidatePath("/alumno/jornadas");
    return { success: true };
  } catch (error) {
    console.error("[cancelWorkSessionAction]", error);
    return { success: false, error: "No se pudo cancelar la jornada" };
  }
}

/**
 * Crea una jornada manual (pasa por validación del jefe como cualquier otra).
 * Valida traslape con jornadas existentes del mismo alumno (excepto CANCELADAS).
 */
export async function crearJornadaManualAction(
  input: JornadaManualInput,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "ALUMNO") {
      return { success: false, error: "Solo los alumnos pueden registrar jornadas" };
    }

    const parsed = jornadaManualSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const assignment = await db.assignment.findFirst({
      where: {
        studentId: session.user.id,
        isActive:  true,
        period:    { isClosed: false, isActive: true },
      },
      include: { period: true },
      orderBy: { createdAt: "desc" },
    });

    if (!assignment) {
      return { success: false, error: "No tienes una asignación activa" };
    }

    const startDateTime = new Date(`${parsed.data.date}T${parsed.data.startTime}`);
    const endDateTime   = new Date(`${parsed.data.date}T${parsed.data.endTime}`);

    // Debe caer dentro del rango del período activo
    if (
      startDateTime < assignment.period.startDate ||
      endDateTime   > assignment.period.endDate
    ) {
      return {
        success: false,
        error:   "La jornada debe estar dentro del período activo",
      };
    }

    // Validar traslape con otras jornadas (excepto CANCELADAS)
    const overlap = await db.workSession.findFirst({
      where: {
        studentId: session.user.id,
        status:    { not: "CANCELADA" },
        OR: [
          // Traslape estándar: startA < endB AND endA > startB
          {
            startTime: { lt: endDateTime },
            endTime:   { gt: startDateTime },
          },
          // Jornada en curso (endTime null) que arrancó antes del fin del nuevo rango
          {
            endTime:   null,
            startTime: { lt: endDateTime },
          },
        ],
      },
    });

    if (overlap) {
      return {
        success: false,
        error:   "La jornada se traslapa con otra ya registrada",
      };
    }

    const totalMinutes = Math.floor(
      (endDateTime.getTime() - startDateTime.getTime()) / 60000,
    );

    await db.workSession.create({
      data: {
        assignmentId: assignment.id,
        studentId:    session.user.id,
        startTime:    startDateTime,
        endTime:      endDateTime,
        totalMinutes,
        status:       "PENDIENTE",
        isManual:     true,
        description:  parsed.data.description,
      },
    });

    revalidatePath("/alumno/jornadas");
    return { success: true };
  } catch (error) {
    console.error("[crearJornadaManualAction]", error);
    return { success: false, error: "No se pudo registrar la jornada" };
  }
}
