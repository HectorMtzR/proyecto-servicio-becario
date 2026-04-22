"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface ReportFilterOptions {
  periods:    { id: string; name: string; isActive: boolean; isClosed: boolean }[];
  careers:    { id: string; name: string }[];
  faculties:  string[];
  supervisors: { id: string; name: string }[];
  activePeriodId: string | null;
}

export interface ReportRow {
  assignmentId:       string;
  studentId:          string;
  studentName:        string;
  studentEmail:       string;
  matricula:          string;
  careerId:           string;
  careerName:         string;
  faculty:            string;
  supervisorId:       string;
  supervisorName:     string;
  scholarshipPercent: number;
  scholarshipType:    string;
  targetHours:        number;
  accumulatedHours:   number;
  progressPercent:    number;
  estatus:            "En Tiempo" | "Atrasado" | "Sin Datos" | "Voluntario";
  isVoluntario:       boolean;
}

export interface ReportSummary {
  totalStudents:       number;
  avgCompletionPct:    number;
  enTiempoCount:       number;
  atrasadoCount:       number;
  sinDatosCount:       number;
  voluntarioCount:     number;
  totalAccumulatedHrs: number;
}

export interface ReportFilters {
  periodId?:        string;
  careerId?:        string;
  faculty?:         string;
  supervisorId?:    string;
  minBeca?:         number;
  maxBeca?:         number;
  scholarshipType?: string;
  sinAvance?:       boolean;
}

export async function getReportFilterOptions(): Promise<ReportFilterOptions> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { periods: [], careers: [], faculties: [], supervisors: [], activePeriodId: null };
  }

  const [periods, careers, supervisors] = await Promise.all([
    db.period.findMany({ orderBy: [{ isActive: "desc" }, { startDate: "desc" }] }),
    db.career.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where:   { role: "JEFE_SERVICIO" },
      orderBy: { name: "asc" },
      select:  { id: true, name: true },
    }),
  ]);

  const faculties = Array.from(new Set(careers.map((c) => c.faculty))).sort();
  const activePeriod = periods.find((p) => p.isActive && !p.isClosed) ?? periods[0] ?? null;

  return {
    periods: periods.map((p) => ({
      id:       p.id,
      name:     p.name,
      isActive: p.isActive,
      isClosed: p.isClosed,
    })),
    careers:     careers.map((c) => ({ id: c.id, name: c.name })),
    faculties,
    supervisors,
    activePeriodId: activePeriod?.id ?? null,
  };
}

export async function getReportData(
  filters: ReportFilters,
): Promise<{ rows: ReportRow[]; summary: ReportSummary; periodId: string | null }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return {
      rows:     [],
      summary:  emptySummary(),
      periodId: null,
    };
  }

  const period = filters.periodId
    ? await db.period.findUnique({ where: { id: filters.periodId } })
    : await db.period.findFirst({ where: { isActive: true, isClosed: false } })
      ?? await db.period.findFirst({ orderBy: { startDate: "desc" } });

  if (!period) {
    return { rows: [], summary: emptySummary(), periodId: null };
  }

  const assignments = await db.assignment.findMany({
    where: {
      periodId:           period.id,
      supervisorId:       filters.supervisorId || undefined,
      ...(filters.sinAvance ? { accumulatedMinutes: 0 } : {}),
      student: {
        studentProfile: {
          ...(filters.careerId ? { careerId: filters.careerId } : {}),
          ...(filters.faculty ? { career: { faculty: filters.faculty } } : {}),
          ...(filters.minBeca !== undefined || filters.maxBeca !== undefined
            ? {
                scholarshipPercent: {
                  ...(filters.minBeca !== undefined ? { gte: filters.minBeca } : {}),
                  ...(filters.maxBeca !== undefined ? { lte: filters.maxBeca } : {}),
                },
              }
            : {}),
          ...(filters.scholarshipType ? { scholarshipType: filters.scholarshipType as never } : {}),
        },
      },
    },
    include: {
      student: {
        include: { studentProfile: { include: { career: true } } },
      },
      supervisor: true,
      period:     true,
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const totalMs = period.endDate.getTime() - period.startDate.getTime();
  const doneMs  = now.getTime() - period.startDate.getTime();
  const timeFrac = totalMs > 0 ? Math.max(0, Math.min(1, doneMs / totalMs)) : 0;

  const rows: ReportRow[] = assignments
    .filter((a) => a.student.studentProfile !== null)
    .map((a) => {
      const profile          = a.student.studentProfile!;
      const accumulatedHours = a.accumulatedMinutes / 60;
      const progressPercent  = a.targetHours === 0
        ? 0
        : Math.min(100, Math.round((accumulatedHours / a.targetHours) * 100));

      const isVoluntario = profile.scholarshipType === "SEP";

      let estatus: ReportRow["estatus"];
      if (a.accumulatedMinutes === 0 && timeFrac < 0.1) {
        estatus = "Sin Datos";
      } else {
        const expectedHours = a.targetHours * timeFrac;
        const enTiempo = accumulatedHours >= expectedHours;
        estatus = enTiempo ? "En Tiempo" : isVoluntario ? "Voluntario" : "Atrasado";
      }

      return {
        assignmentId:       a.id,
        studentId:          a.studentId,
        studentName:        a.student.name,
        studentEmail:       a.student.email,
        matricula:          profile.studentId,
        careerId:           profile.careerId,
        careerName:         profile.career.name,
        faculty:            profile.career.faculty,
        supervisorId:       a.supervisorId,
        supervisorName:     a.supervisor.name,
        scholarshipPercent: profile.scholarshipPercent,
        scholarshipType:    profile.scholarshipType,
        targetHours:        a.targetHours,
        accumulatedHours:   Math.round(accumulatedHours * 10) / 10,
        progressPercent,
        estatus,
        isVoluntario,
      };
    });

  const totalStudents       = rows.length;
  const avgCompletionPct    = totalStudents === 0
    ? 0
    : Math.round(rows.reduce((s, r) => s + r.progressPercent, 0) / totalStudents);
  const enTiempoCount       = rows.filter((r) => r.estatus === "En Tiempo").length;
  const atrasadoCount       = rows.filter((r) => r.estatus === "Atrasado").length;
  const sinDatosCount       = rows.filter((r) => r.estatus === "Sin Datos").length;
  const voluntarioCount     = rows.filter((r) => r.estatus === "Voluntario").length;
  const totalAccumulatedHrs = Math.round(rows.reduce((s, r) => s + r.accumulatedHours, 0) * 10) / 10;

  return {
    rows,
    summary: {
      totalStudents,
      avgCompletionPct,
      enTiempoCount,
      atrasadoCount,
      sinDatosCount,
      voluntarioCount,
      totalAccumulatedHrs,
    },
    periodId: period.id,
  };
}

function emptySummary(): ReportSummary {
  return {
    totalStudents:       0,
    avgCompletionPct:    0,
    enTiempoCount:       0,
    atrasadoCount:       0,
    sinDatosCount:       0,
    voluntarioCount:     0,
    totalAccumulatedHrs: 0,
  };
}
