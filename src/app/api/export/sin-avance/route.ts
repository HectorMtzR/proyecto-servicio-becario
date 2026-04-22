import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStudentsWithNoProgress } from "@/actions/alumnos";
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
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const students = await getStudentsWithNoProgress("ADMIN");

  const excelRows = students.map((s) => ({
    "Alumno":          s.studentName,
    "Correo":          s.studentEmail,
    "Matrícula":       s.matricula,
    "Carrera":         s.careerName,
    "Jefe":            s.supervisorName,
    "Tipo de Beca":    SCHOLARSHIP_TYPE_LABELS[s.scholarshipType] ?? s.scholarshipType,
    "Días del Período": s.daysElapsed,
  }));

  const buffer = generateWorkbook([{ name: "Sin Avance", rows: excelRows }]);
  const filename = `sin-avance-${todayStamp()}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":        XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
