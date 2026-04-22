import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReportData } from "@/actions/reportes";
import { db } from "@/lib/db";
import { generateWorkbook, XLSX_CONTENT_TYPE, slugify, todayStamp } from "@/lib/excel";

const SCHOLARSHIP_TYPE_LABELS: Record<string, string> = {
  ACADEMICA:        "Académica",
  EXCELENCIA:       "Excelencia",
  DEPORTIVA:        "Deportiva",
  CULTURAL:         "Cultural",
  COMERCIAL:        "Comercial",
  LIDERAZGO_SOCIAL: "Liderazgo Social",
  SEP:              "SEP",
};

function parseBeca(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;

  const { rows, periodId } = await getReportData({
    periodId:        sp.get("periodId") ?? undefined,
    careerId:        sp.get("careerId") ?? undefined,
    faculty:         sp.get("faculty") ?? undefined,
    supervisorId:    sp.get("supervisorId") ?? undefined,
    minBeca:         parseBeca(sp.get("minBeca")),
    maxBeca:         parseBeca(sp.get("maxBeca")),
    scholarshipType: sp.get("scholarshipType") ?? undefined,
    sinAvance:       sp.get("sinAvance") === "1",
  });

  const period = periodId
    ? await db.period.findUnique({ where: { id: periodId }, select: { name: true } })
    : null;

  const excelRows = rows.map((r) => ({
    "Alumno":         r.studentName,
    "Correo":         r.studentEmail,
    "Matrícula":      r.matricula,
    "Carrera":        r.careerName,
    "Facultad":       r.faculty,
    "Jefe":           r.supervisorName,
    "Tipo de Beca":   SCHOLARSHIP_TYPE_LABELS[r.scholarshipType] ?? r.scholarshipType,
    "% Beca":         r.scholarshipPercent,
    "Meta Hrs":       r.targetHours,
    "Acumuladas":     r.accumulatedHours,
    "% Avance":       r.progressPercent,
    "Estatus":        r.estatus,
  }));

  const buffer = generateWorkbook([{ name: "Reporte", rows: excelRows }]);

  const periodSlug = period ? slugify(period.name) : "sin-periodo";
  const filename   = `reporte-${periodSlug}-${todayStamp()}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":        XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
