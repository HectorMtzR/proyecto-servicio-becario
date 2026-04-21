import type { AlumnoStatsData } from "@/actions/jornadas";

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <p className="font-label text-xs font-bold uppercase text-secondary">
        {label}
      </p>
      <p
        className={
          accent
            ? "mt-1 font-headline text-xl font-bold text-tertiary"
            : "mt-1 font-headline text-xl font-bold text-on-surface"
        }
      >
        {value}
      </p>
    </div>
  );
}

export default function ProgressWidget({ stats }: { stats: AlumnoStatsData | null }) {
  if (!stats) {
    return (
      <section className="col-span-12 rounded-xl bg-surface-container-lowest p-8 shadow-card">
        <h2 className="font-headline text-2xl font-black tracking-tight text-on-surface">
          Progreso de Servicio Becario
        </h2>
        <p className="mt-2 text-sm text-secondary">
          No hay datos disponibles. Necesitas una asignación activa.
        </p>
      </section>
    );
  }

  const accumulatedHours = stats.accumulatedMinutes / 60;
  const hoursDisplay     = Math.round(accumulatedHours * 10) / 10;

  const estatusLabel: Record<AlumnoStatsData["estatus"], string> = {
    "En Tiempo": "En Tiempo",
    "Atrasado":  "Atrasado",
    "Sin Datos": "—",
    "Voluntario": "Voluntario",
  };

  return (
    <section className="col-span-12 rounded-xl bg-surface-container-lowest p-8 shadow-card">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="mb-1 font-headline text-2xl font-black tracking-tight text-on-surface">
            Progreso de Servicio Becario
          </h2>
          <p className="font-medium text-secondary">
            Horas completadas:{" "}
            <span className="font-bold text-primary">{hoursDisplay}</span> de{" "}
            {stats.targetHours} requeridas
          </p>
        </div>
        <div className="text-right">
          <span className="font-headline text-4xl font-black text-on-surface">
            {stats.progressPercent}%
          </span>
        </div>
      </div>

      <div className="relative h-6 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          className="relative h-full rounded-full bg-primary-container shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all duration-1000"
          style={{ width: `${stats.progressPercent}%` }}
        >
          <div className="progress-stripe absolute inset-0" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Este Mes" value={`${stats.thisMonthHours} hrs`} />
        <StatCard label="Promedio Semanal" value={`${stats.weeklyAverage} hrs`} />
        <StatCard label="Restantes" value={`${stats.remainingHours} hrs`} />
        <StatCard
          label="Estatus"
          value={estatusLabel[stats.estatus]}
          accent={stats.estatus === "En Tiempo"}
        />
      </div>
    </section>
  );
}
