"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginAction } from "@/actions/auth";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginAction(data.email, data.password);
      // Solo llega aquí si hubo un error (el éxito dispara NEXT_REDIRECT)
      if (result && !result.success) {
        toast.error(result.error ?? "Error al iniciar sesión");
      }
    } catch {
      // NEXT_REDIRECT lanzado por Next.js al autenticar exitosamente — es el comportamiento esperado
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-10">

          {/* Marca */}
          <div className="mb-8">
            <div className="w-11 h-11 bg-primary-container rounded-xl flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-white text-[22px]" style={{ fontSize: 22 }}>
                school
              </span>
            </div>
            <h1 className="font-headline text-[26px] font-bold text-on-surface leading-tight">
              Portal Becario
            </h1>
            <p className="font-label text-[11px] uppercase tracking-[0.1em] text-secondary mt-1">
              Anáhuac · Servicio Becario
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block font-label text-[11px] uppercase tracking-[0.08em] text-secondary"
              >
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="usuario@anahuac.mx"
                {...register("email")}
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              {errors.email && (
                <p className="text-error text-xs font-label">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-label text-[11px] uppercase tracking-[0.08em] text-secondary"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              {errors.password && (
                <p className="text-error text-xs font-label">{errors.password.message}</p>
              )}
            </div>

            {/* Botón */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-semibold text-sm rounded-xl shadow-btn-primary hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Iniciando sesión…
                  </span>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  );
}
