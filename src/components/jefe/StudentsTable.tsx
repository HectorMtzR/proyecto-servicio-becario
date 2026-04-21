import Link from "next/link";
import type { SupervisedStudentData } from "@/actions/validaciones";

function EstatusBadge({ value }: { value: SupervisedStudentData["estatus"] }) {
  const styles: Record<SupervisedStudentData["estatus"], string> = {
    "En Tiempo":  "bg-tertiary-fixed text-on-tertiary-fixed",
    "Atrasado":   "bg-error-container text-on-error-container",
    "Sin Datos":  "bg-surface-container-high text-on-surface-variant",
    "Voluntario": "bg-tertiary-fixed text-on-tertiary-fixed",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${styles[value]}`}
    >
      {value}
    </span>
  );
}

export default function StudentsTable({ students }: { students: SupervisedStudentData[] }) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-12 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
          <span className="material-symbols-outlined text-3xl text-secondary">
            groups
          </span>
        </div>
        <h3 className="font-headline text-xl font-black tracking-tight text-on-surface">
          Sin alumnos asignados
        </h3>
        <p className="mt-2 text-sm text-secondary">
          No tienes alumnos asignados en el período activo.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                Alumno
              </th>
              <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                Carrera
              </th>
              <th className="px-6 py-4 text-center font-label text-xs font-bold uppercase tracking-widest text-secondary">
                % Beca
              </th>
              <th className="px-6 py-4 text-center font-label text-xs font-bold uppercase tracking-widest text-secondary">
                Meta
              </th>
              <th className="px-6 py-4 text-center font-label text-xs font-bold uppercase tracking-widest text-secondary">
                Acumuladas
              </th>
              <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                Avance
              </th>
              <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                Estatus
              </th>
              <th className="px-6 py-4 text-right font-label text-xs font-bold uppercase tracking-widest text-secondary" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {students.map((s) => (
              <tr key={s.assignmentId} className="transition-colors hover:bg-surface-bright">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-on-surface">{s.studentName}</p>
                    {s.pendingCount > 0 && (
                      <span
                        title={`${s.pendingCount} jornada(s) pendiente(s)`}
                        className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-100 px-1.5 text-[10px] font-black text-orange-600"
                      >
                        {s.pendingCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-label text-[11px] font-medium uppercase tracking-widest text-secondary">
                    {s.studentMatricula} · {s.department}
                  </p>
                </td>
                <td className="px-6 py-5 text-sm text-secondary">
                  <p className="text-on-surface">{s.career}</p>
                  <p className="mt-0.5 text-xs">{s.faculty}</p>
                </td>
                <td className="px-6 py-5 text-center text-sm font-bold text-on-surface">
                  {s.scholarshipPercent}%
                </td>
                <td className="px-6 py-5 text-center text-sm font-medium text-on-surface">
                  {s.targetHours} h
                </td>
                <td className="px-6 py-5 text-center text-sm font-bold text-on-surface">
                  {s.accumulatedHours.toFixed(1)} h
                </td>
                <td className="w-56 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-primary-container transition-all"
                        style={{ width: `${s.progressPercent}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-bold text-on-surface">
                      {s.progressPercent}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <EstatusBadge value={s.estatus} />
                </td>
                <td className="px-6 py-5 text-right">
                  <Link
                    href={`/jefe/alumnos/${s.studentId}`}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-label text-xs font-bold text-primary transition-colors hover:bg-surface-container-low hover:text-primary-container"
                  >
                    Ver detalle
                    <span className="material-symbols-outlined text-[16px]">
                      arrow_forward
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
