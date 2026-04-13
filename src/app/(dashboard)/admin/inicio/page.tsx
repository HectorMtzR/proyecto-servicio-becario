import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import WelcomeHeader from "@/components/shared/WelcomeHeader";
import MetricCard from "@/components/shared/MetricCard";

export default async function AdminInicioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();

  const [
    usuariosActivos,
    alumnosActivos,
    jefesActivos,
    periodoActivo,
    pendientesSistema,
    asignacionesActivas,
  ] = await Promise.all([
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { isActive: true, role: "ALUMNO" } }),
    db.user.count({ where: { isActive: true, role: "JEFE_SERVICIO" } }),
    db.period.findFirst({ where: { isActive: true, isClosed: false } }),
    db.workSession.count({
      where: {
        status:  "PENDIENTE",
        endTime: { not: null },
      },
    }),
    db.assignment.count({
      where: { isActive: true, period: { isClosed: false } },
    }),
  ]);

  const diasRestantes = periodoActivo
    ? Math.max(
        0,
        Math.ceil(
          (periodoActivo.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <section className="space-y-8 p-8">
      <WelcomeHeader name={session.user.name ?? "Admin"} />

      <div>
        <h2 className="font-headline text-xl font-bold text-on-surface">
          Estado general del sistema
        </h2>
        <p className="mt-1 text-sm text-secondary">
          {periodoActivo
            ? `Período activo: ${periodoActivo.name} · ${diasRestantes} días restantes`
            : "No hay un período activo."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon="group"
          label="Usuarios activos"
          value={usuariosActivos}
          hint={`${alumnosActivos} alumnos · ${jefesActivos} jefes`}
        />
        <MetricCard
          icon="assignment_ind"
          label="Asignaciones activas"
          value={asignacionesActivas}
          hint="En período vigente"
          tone="tertiary"
        />
        <MetricCard
          icon="pending_actions"
          label="Jornadas pendientes"
          value={pendientesSistema}
          hint="En todo el sistema"
          tone={pendientesSistema > 0 ? "primary" : "default"}
        />
        <MetricCard
          icon="event"
          label="Días del período"
          value={diasRestantes}
          hint={periodoActivo?.name ?? "Sin período"}
          tone="tertiary"
        />
      </div>
    </section>
  );
}
