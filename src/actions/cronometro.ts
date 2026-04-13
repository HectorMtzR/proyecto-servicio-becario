"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stopWorkSessionSchema } from "@/lib/validations/cronometro";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const MIN_MINUTES = 15;

export interface ActiveSessionData {
  id:           string;
  startTime:    string;
  assignmentId: string;
}

export interface AssignmentSummary {
  id:            string;
  supervisorName: string;
  periodName:    string;
  department:    string;
  targetHours:   number;
  accumulatedMinutes: number;
}

/**
 * Retorna la jornada activa del alumno autenticado (endTime IS NULL, status PENDIENTE),
 * si existe.
 */
export async function getActiveWorkSession(): Promise<ActiveSessionData | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ALUMNO") return null;

  const active = await db.workSession.findFirst({
    where: {
      studentId: session.user.id,
      endTime:   null,
      status:    "PENDIENTE",
    },
    orderBy: { startTime: "desc" },
  });

  if (!active) return null;

  return {
    id:           active.id,
    startTime:    active.startTime.toISOString(),
    assignmentId: active.assignmentId,
  };
}

/**
 * Retorna el Assignment activo del alumno (periodo abierto, isActive), con info del jefe y periodo.
 */
export async function getCurrentAssignment(): Promise<AssignmentSummary | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ALUMNO") return null;

  const assignment = await db.assignment.findFirst({
    where: {
      studentId: session.user.id,
      isActive:  true,
      period:    { isClosed: false, isActive: true },
    },
    include: {
      supervisor: true,
      period:     true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!assignment) return null;

  return {
    id:                 assignment.id,
    supervisorName:     assignment.supervisor.name,
    periodName:         assignment.period.name,
    department:         assignment.department,
    targetHours:        assignment.targetHours,
    accumulatedMinutes: assignment.accumulatedMinutes,
  };
}

/**
 * Inicia una jornada para el alumno autenticado.
 * Reglas: rol ALUMNO, assignment activo, periodo no cerrado, sin sesión activa previa.
 */
export async function startWorkSessionAction(): Promise<ActionResult<ActiveSessionData>> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "ALUMNO") {
      return { success: false, error: "Solo los alumnos pueden iniciar jornadas" };
    }

    // Verificar que no exista una sesión activa
    const existingActive = await db.workSession.findFirst({
      where: {
        studentId: session.user.id,
        endTime:   null,
        status:    "PENDIENTE",
      },
    });
    if (existingActive) {
      return { success: false, error: "Ya tienes una jornada activa" };
    }

    // Obtener assignment activo con periodo abierto
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
      return {
        success: false,
        error:   "No tienes una asignación activa. Contacta al administrador.",
      };
    }

    if (assignment.period.isClosed) {
      return { success: false, error: "El período está cerrado" };
    }

    const created = await db.workSession.create({
      data: {
        assignmentId: assignment.id,
        studentId:    session.user.id,
        startTime:    new Date(),
        status:       "PENDIENTE",
        isManual:     false,
      },
    });

    revalidatePath("/alumno/jornadas");

    return {
      success: true,
      data: {
        id:           created.id,
        startTime:    created.startTime.toISOString(),
        assignmentId: created.assignmentId,
      },
    };
  } catch (error) {
    console.error("[startWorkSessionAction]", error);
    return { success: false, error: "No se pudo iniciar la jornada. Intenta de nuevo." };
  }
}

/**
 * Detiene la jornada activa del alumno con descripción.
 * Valida duración mínima y longitud mínima de descripción.
 */
export async function stopWorkSessionAction(input: {
  description: string;
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "ALUMNO") {
      return { success: false, error: "Solo los alumnos pueden detener jornadas" };
    }

    const parsed = stopWorkSessionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const active = await db.workSession.findFirst({
      where: {
        studentId: session.user.id,
        endTime:   null,
        status:    "PENDIENTE",
      },
      include: { assignment: { include: { period: true } } },
    });

    if (!active) {
      return { success: false, error: "No tienes una jornada activa" };
    }

    if (active.assignment.period.isClosed) {
      return { success: false, error: "El período está cerrado" };
    }

    const endTime     = new Date();
    const durationMs  = endTime.getTime() - active.startTime.getTime();
    const totalMinutes = Math.floor(durationMs / 60000);

    if (totalMinutes < MIN_MINUTES) {
      return {
        success: false,
        error:   `La jornada debe durar al menos ${MIN_MINUTES} minutos. Han transcurrido ${totalMinutes}.`,
      };
    }

    await db.workSession.update({
      where: { id: active.id },
      data: {
        endTime,
        totalMinutes,
        description: parsed.data.description,
      },
    });

    revalidatePath("/alumno/jornadas");
    return { success: true };
  } catch (error) {
    console.error("[stopWorkSessionAction]", error);
    return { success: false, error: "No se pudo detener la jornada. Intenta de nuevo." };
  }
}
