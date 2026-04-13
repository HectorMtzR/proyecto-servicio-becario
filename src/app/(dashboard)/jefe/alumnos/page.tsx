import { getSupervisedStudents } from "@/actions/validaciones";
import StudentsTable from "@/components/jefe/StudentsTable";

export const dynamic = "force-dynamic";

export default async function JefeAlumnosPage() {
  const students = await getSupervisedStudents();

  const totalPending = students.reduce((acc, s) => acc + s.pendingCount, 0);

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
          </div>
        </div>

        <StudentsTable students={students} />
      </div>
    </div>
  );
}
