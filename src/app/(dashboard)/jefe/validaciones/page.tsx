import { getPendingValidations } from "@/actions/validaciones";
import ValidationsList from "@/components/jefe/ValidationsList";

export const dynamic = "force-dynamic";

export default async function JefeValidacionesPage() {
  const pending = await getPendingValidations();

  return (
    <div className="px-8 pb-12 pt-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
              Bandeja del jefe
            </p>
            <h1 className="mt-1 font-headline text-3xl font-black tracking-tight text-on-surface">
              Validaciones
            </h1>
            <p className="mt-2 text-sm text-secondary">
              Revisa y valida las jornadas terminadas de tus alumnos asignados.
              Al aprobar, las horas se suman a su acumulado.
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest px-5 py-4 shadow-card">
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
              Pendientes
            </p>
            <p className="mt-1 font-headline text-3xl font-black text-primary">
              {pending.length}
            </p>
          </div>
        </div>

        <ValidationsList sessions={pending} />
      </div>
    </div>
  );
}
