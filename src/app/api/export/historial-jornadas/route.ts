import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateWorkbook, XLSX_CONTENT_TYPE, todayStamp } from "@/lib/excel";

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA:  "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.role !== "JEFE_SERVICIO" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId es requerido" }, { status: 400 });
  }

  if (session.user.role === "JEFE_SERVICIO") {
    const owns = await db.assignment.findFirst({
      where: {
        studentId,
        supervisorId: session.user.id,
        isActive:     true,
        period:       { isClosed: false, isActive: true },
      },
      select: { id: true },
    });
    if (!owns) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const student = await db.user.findUnique({
    where:   { id: studentId },
    include: { studentProfile: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
  }

  const sessions = await db.workSession.findMany({
    where: {
      studentId,
      ...(session.user.role === "JEFE_SERVICIO"
        ? { assignment: { supervisorId: session.user.id } }
        : {}),
    },
    include: {
      validator: { select: { name: true } },
    },
    orderBy: { startTime: "desc" },
  });

  const excelRows = sessions.map((s) => ({
    "Alumno":          student.name,
    "Correo":          student.email,
    "Matrícula":       student.studentProfile?.studentId ?? "",
    "Fecha":           format(s.startTime, "yyyy-MM-dd"),
    "Hora Inicio":     format(s.startTime, "HH:mm"),
    "Hora Fin":        s.endTime ? format(s.endTime, "HH:mm") : "—",
    "Minutos":         s.totalMinutes ?? 0,
    "Tipo":            s.isManual ? "Manual" : "Cronómetro",
    "Descripción":     s.description ?? "",
    "Estado":          STATUS_LABELS[s.status] ?? s.status,
    "Jefe Validador":  s.validator?.name ?? "",
    "Fecha Validación": s.validatedAt ? format(s.validatedAt, "yyyy-MM-dd HH:mm") : "",
    "Comentario Rechazo": s.rejectionComment ?? "",
  }));

  const buffer = generateWorkbook([{ name: "Historial", rows: excelRows }]);
  const slug = student.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const filename = `historial-${slug}-${todayStamp()}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":        XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
