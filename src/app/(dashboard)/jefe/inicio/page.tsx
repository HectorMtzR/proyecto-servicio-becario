import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import WelcomeHeader from "@/components/shared/WelcomeHeader";
import MetricCard from "@/components/shared/MetricCard";

export default async function JefeInicioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const supervisorId = session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeAssignments = await db.assignment.findMany({
    where:   { supervisorId, isActive: true, period: { isClosed: false } },
    select:  { id: true, accumulatedMinutes: true, targetHours: true },
  });

  const assignmentIds = activeAssignments.map((a) => a.id);

  const [pendientes, aprobadasMes, rechazadasMes] = await Promise.all([
    db.workSession.count({
      where: {
        assignmentId: { in: assignmentIds },
        status:       "PENDIENTE",
        endTime:      { not: null },
      },
    }),
    db.workSession.count({
      where: {
        assignmentId: { in: assignmentIds },
        status:       "APROBADA",
        validatedAt:  { gte: startOfMonth },
      },
    }),
    db.workSession.count({
      where: {
        assignmentId: { in: assignmentIds },
        status:       "RECHAZADA",
        validatedAt:  { gte: startOfMonth },
      },
    }),
  ]);

  const alumnosEnRiesgo = activeAssignments.filter((a) => {
    if (a.targetHours === 0) return false;
    const horas = a.accumulatedMinutes / 60;
    return horas / a.targetHours < 0.5;
  }).length;

  return (
    <section className="space-y-8 p-8">
      <WelcomeHeader name={session.user.name ?? "Jefe"} />

      <div>
        <h2 className="font-headline text-xl font-bold text-on-surface">
          Panel de supervisión
        </h2>
        <p className="mt-1 text-sm text-secondary">
          Resumen de tus alumnos y jornadas en validación.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon="pending_actions"
          label="Por validar"
          value={pendientes}
          hint="Jornadas pendientes"
          tone={pendientes > 0 ? "primary" : "default"}
        />
        <MetricCard
          icon="groups"
          label="Alumnos activos"
          value={activeAssignments.length}
          hint="Asignados en este período"
        />
        <MetricCard
          icon="check_circle"
          label="Aprobadas este mes"
          value={aprobadasMes}
          hint={`${rechazadasMes} rechazadas`}
          tone="tertiary"
        />
        <MetricCard
          icon="warning"
          label="En riesgo"
          value={alumnosEnRiesgo}
          hint="< 50% de avance"
          tone={alumnosEnRiesgo > 0 ? "error" : "default"}
        />
      </div>
    </section>
  );
}
