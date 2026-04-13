import Link from "next/link";
import { getAllSessions } from "@/actions/jornadas";
import RecentActivity from "@/components/cronometro/RecentActivity";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const sessions = await getAllSessions();

  return (
    <div className="px-8 pb-12 pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/alumno/jornadas"
              className="mb-2 inline-flex items-center gap-1 font-label text-xs font-bold uppercase tracking-widest text-secondary transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Volver al dashboard
            </Link>
            <h1 className="font-headline text-3xl font-black tracking-tight text-on-surface">
              Historial Completo
            </h1>
            <p className="mt-1 text-sm text-secondary">
              Todas tus jornadas registradas, en orden cronológico inverso.
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low px-4 py-3 text-right">
            <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
              Total
            </p>
            <p className="font-headline text-2xl font-black text-on-surface">
              {sessions.length}
            </p>
          </div>
        </div>

        <RecentActivity
          sessions={sessions}
          title="Todas las Jornadas"
          showHistoryLink={false}
          emptyMessage="Aún no tienes jornadas registradas."
        />
      </div>
    </div>
  );
}
