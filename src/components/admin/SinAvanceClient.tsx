"use client";

import type { StudentNoProgressData } from "@/actions/alumnos";

const SCHOLARSHIP_TYPE_LABELS: Record<string, string> = {
  ACADEMICA:        "Académica",
  EXCELENCIA:       "Excelencia",
  DEPORTIVA:        "Deportiva",
  CULTURAL:         "Cultural",
  COMERCIAL:        "Comercial",
  LIDERAZGO_SOCIAL: "Liderazgo Social",
  SEP:              "SEP",
};

export default function SinAvanceClient({
  students,
}: {
  students: StudentNoProgressData[];
}) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-12 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
          <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
        </div>
        <h3 className="font-headline text-xl font-black tracking-tight text-on-surface">
          Sin alumnos sin avance
        </h3>
        <p className="mt-2 text-sm text-secondary">
          Todos los alumnos han registrado al menos una hora aprobada en el período activo.
        </p>
      </div>
    );
  }

  const voluntarioCount = students.filter((s) => s.isVoluntario).length;

  return (
    <div className="space-y-4">
      {voluntarioCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-tertiary-fixed/30 p-4 text-sm text-on-tertiary-fixed">
          <span className="material-symbols-outlined mt-0.5 text-[18px]">info</span>
          <span>
            <strong>{voluntarioCount} alumno(s) SEP</strong> están marcados como &quot;Voluntario&quot;.
            Los alumnos SEP no representan un caso de atraso.
          </span>
        </div>
      )}

      <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
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
                  Jefe asignado
                </th>
                <th className="px-6 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">
                  Tipo de beca
                </th>
                <th className="px-6 py-4 text-center font-label text-xs font-bold uppercase tracking-widest text-secondary">
                  Días del período
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {students.map((s) => (
                <tr key={s.assignmentId} className="transition-colors hover:bg-surface-bright">
                  <td className="px-6 py-4 text-sm font-bold text-on-surface">{s.studentName}</td>
                  <td className="px-6 py-4 font-mono text-sm text-secondary">{s.matricula}</td>
                  <td className="px-6 py-4 text-sm text-on-surface">{s.careerName}</td>
                  <td className="px-6 py-4 text-sm text-secondary">{s.supervisorName}</td>
                  <td className="px-6 py-4">
                    {s.isVoluntario ? (
                      <span className="inline-flex items-center rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-tertiary-fixed">
                        Voluntario (SEP)
                      </span>
                    ) : (
                      <span className="text-sm text-on-surface">
                        {SCHOLARSHIP_TYPE_LABELS[s.scholarshipType] ?? s.scholarshipType}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-on-surface">
                    {s.daysElapsed} días
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { window.location.href = "/api/export/sin-avance"; }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Exportar a Excel
        </button>
      </div>
    </div>
  );
}
