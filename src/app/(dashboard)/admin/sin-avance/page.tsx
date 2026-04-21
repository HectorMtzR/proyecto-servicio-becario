import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentsWithNoProgress } from "@/actions/alumnos";
import SinAvanceClient from "@/components/admin/SinAvanceClient";

export const dynamic = "force-dynamic";

export default async function AdminSinAvancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const students = await getStudentsWithNoProgress("ADMIN");

  return (
    <main className="space-y-6 p-8">
      <header>
        <p className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary">
          Panel de administración
        </p>
        <h1 className="mt-1 font-headline text-3xl font-black tracking-tight text-on-surface">
          Sin Avance
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Alumnos con 0 horas acumuladas en el período activo.
        </p>
      </header>

      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-surface-container-lowest px-5 py-4 shadow-card">
          <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
            Sin avance
          </p>
          <p className="mt-1 font-headline text-3xl font-black text-on-surface">
            {students.length}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest px-5 py-4 shadow-card">
          <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
            Voluntarios (SEP)
          </p>
          <p className="mt-1 font-headline text-3xl font-black text-tertiary">
            {students.filter((s) => s.isVoluntario).length}
          </p>
        </div>
      </div>

      <SinAvanceClient students={students} />
    </main>
  );
}
