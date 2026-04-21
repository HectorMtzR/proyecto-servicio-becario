import { getSupervisedStudents } from "@/actions/validaciones";
import StudentsTable from "@/components/jefe/StudentsTable";

export const dynamic = "force-dynamic";

export default async function JefeAlumnosPage() {
  const students = await getSupervisedStudents();

  const totalPending  = students.reduce((acc, s) => acc + s.pendingCount, 0);
  const sinAvance     = students.filter((s) => s.progressPercent === 0);
  const voluntarios   = sinAvance.filter((s) => s.isVoluntario);

  return (
    <div className="px-8 pb-12 pt-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
              Panel del jefe
            </p>
            <h1 className="mt-1 font-headline text-3xl font-black tracking-tight text-on-surface">
              Mis Alumnos
            </h1>
            <p className="mt-2 text-sm text-secondary">
              Alumnos asignados a tu supervisión en el período activo. Haz click en
              &quot;Ver detalle&quot; para consultar el historial de jornadas.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-surface-container-lowest px-5 py-4 shadow-card">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                Alumnos
              </p>
              <p className="mt-1 font-headline text-3xl font-black text-on-surface">
                {students.length}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-lowest px-5 py-4 shadow-card">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                Por validar
              </p>
              <p className="mt-1 font-headline text-3xl font-black text-primary">
                {totalPending}
              </p>
            </div>
            {sinAvance.length > 0 && (
              <div className="rounded-xl bg-surface-container-lowest px-5 py-4 shadow-card">
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                  Sin avance
                </p>
                <p className="mt-1 font-headline text-3xl font-black text-error">
                  {sinAvance.length}
                </p>
              </div>
            )}
          </div>
        </div>

        <StudentsTable students={students} />

        {sinAvance.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="font-headline text-xl font-black tracking-tight text-on-surface">
                Sin avance
              </h2>
              <p className="mt-1 text-sm text-secondary">
                Alumnos con 0 horas acumuladas en el período activo.
              </p>
            </div>

            {voluntarios.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl bg-tertiary-fixed/30 p-4 text-sm text-on-tertiary-fixed">
                <span className="material-symbols-outlined mt-0.5 text-[18px]">info</span>
                <span>
                  <strong>{voluntarios.length} alumno(s) SEP</strong> están marcados como &quot;Voluntario&quot;.
                  Los alumnos SEP no representan un caso de atraso.
                </span>
              </div>
            )}

            <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                        Alumno
                      </th>
                      <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                        Matrícula
                      </th>
                      <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                        Carrera
                      </th>
                      <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                        Tipo de beca
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {sinAvance.map((s) => (
                      <tr key={s.assignmentId} className="transition-colors hover:bg-surface-bright">
                        <td className="px-6 py-4 text-sm font-bold text-on-surface">{s.studentName}</td>
                        <td className="px-6 py-4 font-mono text-sm text-secondary">{s.studentMatricula}</td>
                        <td className="px-6 py-4 text-sm text-on-surface">{s.career}</td>
                        <td className="px-6 py-4">
                          {s.isVoluntario ? (
                            <span className="inline-flex items-center rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-tertiary-fixed">
                              Voluntario (SEP)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-error-container px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-error-container">
                              Sin avance
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
