import type { AssignmentSummary } from "@/actions/cronometro";

export default function AssignmentCard({
  assignment,
}: {
  assignment: AssignmentSummary | null;
}) {
  if (!assignment) {
    return (
      <section className="col-span-12 flex flex-col justify-between rounded-xl bg-zinc-900 p-8 text-white shadow-card lg:col-span-4">
        <div>
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <span className="material-symbols-outlined text-orange-400">
              error
            </span>
          </div>
          <h3 className="mb-1 font-label text-xs font-bold uppercase tracking-widest text-zinc-400">
            Sin asignación
          </h3>
          <p className="font-headline text-lg font-medium opacity-90">
            No estás asignado a ningún jefe en un período activo.
          </p>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-sm text-zinc-400">
            Contacta al administrador para comenzar tu servicio becario.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="col-span-12 flex flex-col justify-between rounded-xl bg-zinc-900 p-8 text-white shadow-card lg:col-span-4">
      <div>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
          <span className="material-symbols-outlined text-orange-400">
            account_balance
          </span>
        </div>

        <h3 className="mb-1 font-label text-xs font-bold uppercase tracking-widest text-zinc-400">
          Jefe de Servicio
        </h3>
        <p className="mb-6 font-headline text-xl font-bold">
          {assignment.supervisorName}
        </p>

        <h3 className="mb-1 font-label text-xs font-bold uppercase tracking-widest text-zinc-400">
          Período Actual
        </h3>
        <p className="font-headline text-lg font-medium opacity-90">
          {assignment.periodName}
        </p>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Departamento</span>
          <span className="font-bold">{assignment.department}</span>
        </div>
      </div>
    </section>
  );
}
