import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getStudentDetail } from "@/actions/validaciones";
import StatusChip from "@/components/shared/StatusChip";

export const dynamic = "force-dynamic";

function formatDuration(minutes: number) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default async function JefeAlumnoDetallePage({
  params,
}: {
  params: { studentId: string };
}) {
  const detail = await getStudentDetail(params.studentId);
  if (!detail) notFound();

  const { student, assignment, sessions } = detail;

  return (
    <div className="px-8 pb-12 pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Link
            href="/jefe/alumnos"
            className="mb-2 inline-flex items-center gap-1 font-label text-xs font-bold uppercase tracking-widest text-secondary transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Volver a mis alumnos
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-headline text-3xl font-black tracking-tight text-on-surface">
                {student.name}
              </h1>
              <p className="mt-1 font-label text-xs font-medium uppercase tracking-widest text-secondary">
                {student.matricula} · {student.career} · {student.faculty}
              </p>
            </div>
            <a
              href={`/api/export/historial-jornadas?studentId=${student.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 font-label text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Exportar historial
            </a>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-card">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
              Semestre
            </p>
            <p className="mt-2 font-headline text-2xl font-black text-on-surface">
              {student.semester}°
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-card">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
              % Beca
            </p>
            <p className="mt-2 font-headline text-2xl font-black text-on-surface">
              {student.scholarshipPercent}%
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-card">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
              Meta
            </p>
            <p className="mt-2 font-headline text-2xl font-black text-on-surface">
              {assignment.targetHours} h
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-card">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
              Acumuladas
            </p>
            <p className="mt-2 font-headline text-2xl font-black text-primary">
              {assignment.accumulatedHours.toFixed(1)} h
            </p>
          </div>
        </section>

        <section className="rounded-xl bg-surface-container-lowest p-6 shadow-card">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                Avance del período · {assignment.department}
              </p>
              <p className="mt-1 font-headline text-lg font-black text-on-surface">
                {assignment.accumulatedHours.toFixed(1)} / {assignment.targetHours} h
              </p>
            </div>
            <p className="font-headline text-3xl font-black text-primary">
              {assignment.progressPercent}%
            </p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-primary-container shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all"
              style={{ width: `${assignment.progressPercent}%` }}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
          <div className="p-6 pb-4">
            <h2 className="font-headline text-xl font-black tracking-tight text-on-surface">
              Historial de jornadas
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {sessions.length} registro(s) en este período.
            </p>
          </div>

          {sessions.length === 0 ? (
            <div className="px-6 pb-8 text-sm text-secondary">
              Aún no hay jornadas registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                      Fecha
                    </th>
                    <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                      Horario
                    </th>
                    <th className="px-6 py-4 text-center font-label text-xs font-bold uppercase tracking-widest text-secondary">
                      Duración
                    </th>
                    <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                      Descripción
                    </th>
                    <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {sessions.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-surface-bright">
                      <td className="px-6 py-5 text-sm font-medium text-on-surface">
                        {format(new Date(s.startTime), "d MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-6 py-5 text-sm text-secondary">
                        {format(new Date(s.startTime), "HH:mm")}
                        {s.endTime
                          ? ` – ${format(new Date(s.endTime), "HH:mm")}`
                          : " · en curso"}
                      </td>
                      <td className="px-6 py-5 text-center text-sm font-bold text-on-surface">
                        {formatDuration(s.totalMinutes)}
                      </td>
                      <td className="max-w-md px-6 py-5 text-sm text-secondary">
                        <div className="flex items-start gap-2">
                          {s.isManual && (
                            <span
                              className="material-symbols-outlined mt-0.5 text-[14px] text-secondary"
                              title="Registro manual"
                            >
                              edit_note
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate">{s.description ?? "—"}</p>
                            {s.rejectionComment && (
                              <p className="mt-1 text-xs font-medium text-error">
                                Rechazo: {s.rejectionComment}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusChip status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
