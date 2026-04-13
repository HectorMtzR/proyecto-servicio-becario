import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./ChangePasswordForm";
import { logoutAction } from "@/actions/auth";

export default async function CambiarPasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-10">

          {/* Encabezado */}
          <div className="mb-8">
            <div className="w-11 h-11 bg-surface-container-low rounded-xl flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontSize: 22 }}>
                lock_reset
              </span>
            </div>
            <h1 className="font-headline text-[22px] font-bold text-on-surface leading-tight">
              {session.user.mustChangePassword
                ? "Crea tu contraseña"
                : "Cambiar contraseña"}
            </h1>
            <p className="font-body text-sm text-secondary mt-1.5">
              {session.user.mustChangePassword
                ? "Define una contraseña segura para tu cuenta."
                : "Actualiza tu contraseña de acceso al portal."}
            </p>
          </div>

          <ChangePasswordForm mustChangePassword={session.user.mustChangePassword} />

          {/* Cerrar sesión */}
          <form action={logoutAction} className="mt-6 text-center">
            <button
              type="submit"
              className="text-xs font-label text-secondary hover:text-on-surface transition-colors"
            >
              Cerrar sesión
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
