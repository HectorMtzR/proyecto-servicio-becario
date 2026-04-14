import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getReportFilterOptions, getReportData } from "@/actions/reportes";
import ReportesFilters from "@/components/admin/ReportesFilters";
import ReportesTable from "@/components/admin/ReportesTable";

interface PageProps {
  searchParams: {
    periodId?:     string;
    careerId?:     string;
    faculty?:      string;
    supervisorId?: string;
    minBeca?:      string;
    maxBeca?:      string;
  };
}

function parseBeca(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default async function AdminReportesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const options = await getReportFilterOptions();

  const filters = {
    periodId:     searchParams.periodId,
    careerId:     searchParams.careerId,
    faculty:      searchParams.faculty,
    supervisorId: searchParams.supervisorId,
    minBeca:      parseBeca(searchParams.minBeca),
    maxBeca:      parseBeca(searchParams.maxBeca),
  };

  const { rows, summary, periodId } = await getReportData(filters);

  return (
    <main className="space-y-6 p-8">
      <header>
        <p className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary">
          Panel de administración
        </p>
        <h1 className="mt-1 font-headline text-3xl font-black tracking-tight text-on-surface">
          Reportes
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Resumen global de avance del servicio becario con filtros combinables.
        </p>
      </header>

      <ReportesFilters options={options} currentPeriodId={periodId} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total de alumnos"
          value={String(summary.totalStudents)}
          icon="groups"
        />
        <SummaryCard
          label="Promedio de avance"
          value={`${summary.avgCompletionPct}%`}
          icon="trending_up"
        />
        <SummaryCard
          label="En Tiempo vs Atrasados"
          value={`${summary.enTiempoCount} / ${summary.atrasadoCount}`}
          helper={summary.sinDatosCount > 0 ? `${summary.sinDatosCount} sin datos` : undefined}
          icon="balance"
        />
        <SummaryCard
          label="Horas totales acumuladas"
          value={`${summary.totalAccumulatedHrs.toFixed(1)} h`}
          icon="schedule"
        />
      </section>

      <ReportesTable rows={rows} />
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  helper,
}: {
  label:   string;
  value:   string;
  icon:    string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary">
          {label}
        </p>
        <span className="material-symbols-outlined text-secondary">{icon}</span>
      </div>
      <p className="mt-3 font-headline text-3xl font-black tracking-tight text-on-surface">
        {value}
      </p>
      {helper && (
        <p className="mt-1 font-label text-[11px] font-medium uppercase tracking-widest text-secondary">
          {helper}
        </p>
      )}
    </div>
  );
}
