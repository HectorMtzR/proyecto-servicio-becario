"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import {
  alumnoCsvRowSchema,
  jefeCsvRowSchema,
  asignacionCsvRowSchema,
  MAX_CSV_ROWS,
  DEFAULT_TEMP_PASSWORD,
  type AlumnoCsvRow,
  type JefeCsvRow,
  type AsignacionCsvRow,
} from "@/lib/validations/importar";
import type { ActionResult } from "@/types";

export interface RowError {
  rowNumber: number;
  raw:       Record<string, unknown>;
  error:     string;
}

export interface PreviewResult<T> {
  valid:   Array<{ rowNumber: number; data: T }>;
  invalid: RowError[];
  total:   number;
}

async function requireAdmin(): Promise<{ error: string } | { ok: true }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  if (session.user.role !== "ADMIN") return { error: "Solo el administrador puede importar" };
  return { ok: true };
}

function checkSize(
  rows: unknown[],
): { error: string } | { ok: true } {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "El archivo no contiene filas" };
  }
  if (rows.length > MAX_CSV_ROWS) {
    return { error: `Máximo ${MAX_CSV_ROWS} filas por archivo. Divide el CSV y vuelve a intentarlo.` };
  }
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/*                                  ALUMNOS                                   */
/* -------------------------------------------------------------------------- */

export async function previewImportAlumnos(
  rows: Array<Record<string, unknown>>,
): Promise<ActionResult<PreviewResult<AlumnoCsvRow>>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const size = checkSize(rows);
    if ("error" in size) return { success: false, error: size.error };

    const careers = await db.career.findMany({ select: { id: true, name: true } });
    const careerByName = new Map(careers.map((c) => [c.name.toLowerCase(), c]));

    const existingUsers = await db.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    const existingProfiles = await db.studentProfile.findMany({ select: { studentId: true } });
    const existingMatriculas = new Set(existingProfiles.map((p) => p.studentId));

    const valid: Array<{ rowNumber: number; data: AlumnoCsvRow }> = [];
    const invalid: RowError[] = [];
    const seenEmails = new Set<string>();
    const seenMatriculas = new Set<string>();

    rows.forEach((raw, idx) => {
      const rowNumber = idx + 2; // asumiendo header en fila 1
      const parsed = alumnoCsvRowSchema.safeParse(raw);
      if (!parsed.success) {
        invalid.push({ rowNumber, raw, error: parsed.error.issues[0].message });
        return;
      }
      const data = parsed.data;

      if (seenEmails.has(data.email)) {
        invalid.push({ rowNumber, raw, error: "Email duplicado dentro del archivo" });
        return;
      }
      if (seenMatriculas.has(data.studentId)) {
        invalid.push({ rowNumber, raw, error: "Matrícula duplicada dentro del archivo" });
        return;
      }
      if (existingEmails.has(data.email)) {
        invalid.push({ rowNumber, raw, error: "Email ya registrado en el sistema" });
        return;
      }
      if (existingMatriculas.has(data.studentId)) {
        invalid.push({ rowNumber, raw, error: "Matrícula ya registrada en el sistema" });
        return;
      }
      if (!careerByName.has(data.careerName.toLowerCase())) {
        invalid.push({ rowNumber, raw, error: `Carrera "${data.careerName}" no encontrada` });
        return;
      }

      seenEmails.add(data.email);
      seenMatriculas.add(data.studentId);
      valid.push({ rowNumber, data });
    });

    return {
      success: true,
      data:    { valid, invalid, total: rows.length },
    };
  } catch (error) {
    console.error("[previewImportAlumnos]", error);
    return { success: false, error: "No se pudo validar el archivo" };
  }
}

export async function confirmImportAlumnos(
  rows: AlumnoCsvRow[],
): Promise<ActionResult<{ created: number }>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const size = checkSize(rows);
    if ("error" in size) return { success: false, error: size.error };

    // Revalidar contra la DB para evitar carrera
    const careers = await db.career.findMany({ select: { id: true, name: true } });
    const careerByName = new Map(careers.map((c) => [c.name.toLowerCase(), c]));

    const passwordHash = await bcrypt.hash(DEFAULT_TEMP_PASSWORD, 12);

    const creates = rows.map((r) => {
      const career = careerByName.get(r.careerName.toLowerCase());
      if (!career) throw new Error(`Carrera "${r.careerName}" no existe`);
      return db.user.create({
        data: {
          email:              r.email,
          name:               r.name,
          passwordHash,
          role:               "ALUMNO",
          mustChangePassword: true,
          isActive:           true,
          studentProfile: {
            create: {
              studentId:          r.studentId,
              careerId:           career.id,
              semester:           r.semester,
              enrollmentYear:     r.enrollmentYear,
              scholarshipPercent: r.scholarshipPercent,
            },
          },
        },
      });
    });

    await db.$transaction(creates);

    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/inicio");
    return { success: true, data: { created: rows.length } };
  } catch (error) {
    console.error("[confirmImportAlumnos]", error);
    return { success: false, error: "No se pudo completar la importación" };
  }
}

/* -------------------------------------------------------------------------- */
/*                                   JEFES                                    */
/* -------------------------------------------------------------------------- */

export async function previewImportJefes(
  rows: Array<Record<string, unknown>>,
): Promise<ActionResult<PreviewResult<JefeCsvRow>>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const size = checkSize(rows);
    if ("error" in size) return { success: false, error: size.error };

    const existingUsers = await db.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    const valid: Array<{ rowNumber: number; data: JefeCsvRow }> = [];
    const invalid: RowError[] = [];
    const seenEmails = new Set<string>();

    rows.forEach((raw, idx) => {
      const rowNumber = idx + 2;
      const parsed = jefeCsvRowSchema.safeParse(raw);
      if (!parsed.success) {
        invalid.push({ rowNumber, raw, error: parsed.error.issues[0].message });
        return;
      }
      const data = parsed.data;

      if (seenEmails.has(data.email)) {
        invalid.push({ rowNumber, raw, error: "Email duplicado dentro del archivo" });
        return;
      }
      if (existingEmails.has(data.email)) {
        invalid.push({ rowNumber, raw, error: "Email ya registrado en el sistema" });
        return;
      }

      seenEmails.add(data.email);
      valid.push({ rowNumber, data });
    });

    return { success: true, data: { valid, invalid, total: rows.length } };
  } catch (error) {
    console.error("[previewImportJefes]", error);
    return { success: false, error: "No se pudo validar el archivo" };
  }
}

export async function confirmImportJefes(
  rows: JefeCsvRow[],
): Promise<ActionResult<{ created: number }>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const size = checkSize(rows);
    if ("error" in size) return { success: false, error: size.error };

    const passwordHash = await bcrypt.hash(DEFAULT_TEMP_PASSWORD, 12);

    const creates = rows.map((r) =>
      db.user.create({
        data: {
          email:              r.email,
          name:               r.name,
          passwordHash,
          role:               "JEFE_SERVICIO",
          mustChangePassword: true,
          isActive:           true,
        },
      }),
    );

    await db.$transaction(creates);

    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/inicio");
    return { success: true, data: { created: rows.length } };
  } catch (error) {
    console.error("[confirmImportJefes]", error);
    return { success: false, error: "No se pudo completar la importación" };
  }
}

/* -------------------------------------------------------------------------- */
/*                                ASIGNACIONES                                */
/* -------------------------------------------------------------------------- */

export async function previewImportAsignaciones(
  rows: Array<Record<string, unknown>>,
): Promise<ActionResult<PreviewResult<AsignacionCsvRow>>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const size = checkSize(rows);
    if ("error" in size) return { success: false, error: size.error };

    const [users, periods, existingAssignments] = await Promise.all([
      db.user.findMany({
        where:   { isActive: true },
        include: { studentProfile: true },
      }),
      db.period.findMany(),
      db.assignment.findMany({ select: { studentId: true, periodId: true } }),
    ]);

    const studentByEmail = new Map(
      users.filter((u) => u.role === "ALUMNO").map((u) => [u.email.toLowerCase(), u]),
    );
    const jefeByEmail = new Map(
      users.filter((u) => u.role === "JEFE_SERVICIO").map((u) => [u.email.toLowerCase(), u]),
    );
    const periodByName = new Map(periods.map((p) => [p.name.toLowerCase(), p]));
    const assignmentKey = (s: string, p: string) => `${s}::${p}`;
    const existingSet = new Set(
      existingAssignments.map((a) => assignmentKey(a.studentId, a.periodId)),
    );

    const valid: Array<{ rowNumber: number; data: AsignacionCsvRow }> = [];
    const invalid: RowError[] = [];
    const seenPairs = new Set<string>();

    rows.forEach((raw, idx) => {
      const rowNumber = idx + 2;
      const parsed = asignacionCsvRowSchema.safeParse(raw);
      if (!parsed.success) {
        invalid.push({ rowNumber, raw, error: parsed.error.issues[0].message });
        return;
      }
      const data = parsed.data;

      const student = studentByEmail.get(data.studentEmail);
      if (!student) {
        invalid.push({ rowNumber, raw, error: `Alumno "${data.studentEmail}" no encontrado o inactivo` });
        return;
      }
      if (!student.studentProfile) {
        invalid.push({ rowNumber, raw, error: "El alumno no tiene perfil académico" });
        return;
      }

      const jefe = jefeByEmail.get(data.supervisorEmail);
      if (!jefe) {
        invalid.push({ rowNumber, raw, error: `Jefe "${data.supervisorEmail}" no encontrado o inactivo` });
        return;
      }

      const period = periodByName.get(data.periodName.toLowerCase());
      if (!period) {
        invalid.push({ rowNumber, raw, error: `Período "${data.periodName}" no encontrado` });
        return;
      }
      if (period.isClosed) {
        invalid.push({ rowNumber, raw, error: "El período está cerrado" });
        return;
      }

      const pairKey = assignmentKey(student.id, period.id);
      if (seenPairs.has(pairKey)) {
        invalid.push({ rowNumber, raw, error: "Asignación duplicada dentro del archivo (alumno+período)" });
        return;
      }
      if (existingSet.has(pairKey)) {
        invalid.push({ rowNumber, raw, error: "El alumno ya tiene una asignación en ese período" });
        return;
      }

      seenPairs.add(pairKey);
      valid.push({ rowNumber, data });
    });

    return { success: true, data: { valid, invalid, total: rows.length } };
  } catch (error) {
    console.error("[previewImportAsignaciones]", error);
    return { success: false, error: "No se pudo validar el archivo" };
  }
}

export async function confirmImportAsignaciones(
  rows: AsignacionCsvRow[],
): Promise<ActionResult<{ created: number }>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const size = checkSize(rows);
    if ("error" in size) return { success: false, error: size.error };

    const [users, periods] = await Promise.all([
      db.user.findMany({
        where:   { isActive: true },
        include: { studentProfile: true },
      }),
      db.period.findMany(),
    ]);

    const studentByEmail = new Map(
      users.filter((u) => u.role === "ALUMNO").map((u) => [u.email.toLowerCase(), u]),
    );
    const jefeByEmail = new Map(
      users.filter((u) => u.role === "JEFE_SERVICIO").map((u) => [u.email.toLowerCase(), u]),
    );
    const periodByName = new Map(periods.map((p) => [p.name.toLowerCase(), p]));

    const creates = rows.map((r) => {
      const student = studentByEmail.get(r.studentEmail);
      const jefe = jefeByEmail.get(r.supervisorEmail);
      const period = periodByName.get(r.periodName.toLowerCase());
      if (!student || !student.studentProfile || !jefe || !period) {
        throw new Error("Referencia inválida durante la importación");
      }
      if (period.isClosed) throw new Error(`Período "${r.periodName}" está cerrado`);
      return db.assignment.create({
        data: {
          studentId:    student.id,
          supervisorId: jefe.id,
          periodId:     period.id,
          department:   r.department,
          targetHours:  student.studentProfile.scholarshipPercent,
          isActive:     true,
        },
      });
    });

    await db.$transaction(creates);

    revalidatePath("/admin/asignaciones");
    revalidatePath("/admin/inicio");
    return { success: true, data: { created: rows.length } };
  } catch (error) {
    console.error("[confirmImportAsignaciones]", error);
    return { success: false, error: "No se pudo completar la importación" };
  }
}
