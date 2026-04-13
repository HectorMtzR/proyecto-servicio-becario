import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import WelcomeHeader from "@/components/shared/WelcomeHeader";
import MetricCard from "@/components/shared/MetricCard";

export default async function AlumnoInicioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const assignment = await db.assignment.findFirst({
    where:   { studentId: userId, isActive: true, period: { isClosed: false } },
    include: { period: true, supervisor: true },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pendientes, aprobadasMes] = await Promise.all([
    db.workSession.count({
      where: { studentId: userId, status: "PENDIENTE", endTime: { not: null } },
    }),
    db.workSession.aggregate({
      where: {
        studentId: userId,
        status:    "APROBADA",
        endTime:   { gte: startOfMonth },
      },
      _sum: { totalMinutes: true },
    }),
  ]);

  const minutosAprobados = assignment?.accumulatedMinutes ?? 0;
  const horasAprobadas = Math.floor(minutosAprobados / 60);
  const meta = assignment?.targetHours ?? 0;
  const progreso = meta > 0 ? Math.round((horasAprobadas / meta) * 100) : 0;

  const horasMes = Math.round(((aprobadasMes._sum.totalMinutes ?? 0) / 60) * 10) / 10;

  const diasRestantes = assignment?.period
    ? Math.max(
        0,
        Math.ceil(
          (assignment.period.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <section className="space-y-8 p-8">
      <WelcomeHeader name={session.user.name ?? "Alumno"} />

      <div>
        <h2 className="font-headline text-xl font-bold text-on-surface">
          Resumen de tu servicio
        </h2>
        <p className="mt-1 text-sm text-secondary">
          {assignment
            ? `${assignment.department} · ${assignment.period.name}`
            : "Sin asignación activa en este momento."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon="schedule"
          label="Horas acumuladas"
          value={`${horasAprobadas} / ${meta}`}
          hint={`${progreso}% completado`}
          tone="primary"
        />
        <MetricCard
          icon="calendar_month"
          label="Horas este mes"
          value={horasMes}
          hint="Jornadas aprobadas"
        />
        <MetricCard
          icon="pending_actions"
          label="Pendientes"
          value={pendientes}
          hint="Esperando validación"
          tone={pendientes > 0 ? "primary" : "default"}
        />
        <MetricCard
          icon="event"
          label="Días restantes"
          value={diasRestantes}
          hint={assignment?.period.name ?? "—"}
          tone="tertiary"
        />
      </div>
    </section>
  );
}
