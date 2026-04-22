import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSupervisedStudents } from "@/actions/validaciones";
import { generateWorkbook, XLSX_CONTENT_TYPE, todayStamp } from "@/lib/excel";

const SCHOLARSHIP_TYPE_LABELS: Record<string, string> = {
  ACADEMICA:        "Académica",
  EXCELENCIA:       "Excelencia",
  DEPORTIVA:        "Deportiva",
  CULTURAL:         "Cultural",
  COMERCIAL:        "Comercial",
  LIDERAZGO_SOCIAL: "Liderazgo Social",
  SEP:              "SEP",
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.role !== "JEFE_SERVICIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const students = await getSupervisedStudents();

  const excelRows = students.map((s) => ({
    "Alumno":              s.studentName,
    "Correo":              s.studentEmail,
    "Matrícula":           s.studentMatricula,
    "Carrera":             s.career,
    "% Beca":              s.scholarshipPercent,
    "Tipo de Beca":        SCHOLARSHIP_TYPE_LABELS[s.scholarshipType] ?? s.scholarshipType,
    "Meta Hrs":            s.targetHours,
    "Acumuladas":          s.accumulatedHours,
    "% Avance":            s.progressPercent,
    "Estatus":             s.estatus,
    "Jornadas Pendientes": s.pendingCount,
  }));

  const buffer = generateWorkbook([{ name: "Mis Alumnos", rows: excelRows }]);

  const supervisor = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  const slug = supervisor?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ?? "jefe";
  const filename = `mis-alumnos-${slug}-${todayStamp()}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":        XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
