"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cambiarPasswordAction, logoutAction } from "@/actions/auth";

type Props = {
  mustChangePassword: boolean;
};

export default function ChangePasswordForm({ mustChangePassword }: Props) {
  // Schema construido aquí para que TypeScript infiera el tipo correcto
  const schema = z
    .object({
      currentPassword: mustChangePassword
        ? z.string().optional()
        : z.string().min(1, "Ingresa tu contraseña actual"),
      newPassword:     z.string().min(8, "Mínimo 8 caracteres"),
      confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const result = await cambiarPasswordAction({
      currentPassword: data.currentPassword,
      newPassword:     data.newPassword,
      confirmPassword: data.confirmPassword,
    });

    // Guard: si el servidor lanzó una excepción no capturada, result llega como undefined
    if (!result) {
      toast.error("Error inesperado. Recarga la página e intenta de nuevo.");
      return;
    }

    if (result.success) {
      toast.success("Contraseña actualizada. Por favor inicia sesión.");
      await logoutAction(); // lanza NEXT_REDIRECT → Next.js navega a /login
    } else {
      toast.error(result.error ?? "Error al cambiar la contraseña");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

      {/* Contraseña actual — solo si NO es primer login */}
      {!mustChangePassword && (
        <div className="space-y-1.5">
          <label
            htmlFor="currentPassword"
            className="block font-label text-[11px] uppercase tracking-[0.08em] text-secondary"
          >
            Contraseña actual
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("currentPassword")}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {"currentPassword" in errors && errors.currentPassword && (
            <p className="text-error text-xs font-label">
              {errors.currentPassword.message as string}
            </p>
          )}
        </div>
      )}

      {/* Nueva contraseña */}
      <div className="space-y-1.5">
        <label
          htmlFor="newPassword"
          className="block font-label text-[11px] uppercase tracking-[0.08em] text-secondary"
        >
          Nueva contraseña
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          {...register("newPassword")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {errors.newPassword && (
          <p className="text-error text-xs font-label">{errors.newPassword.message}</p>
        )}
      </div>

      {/* Confirmar contraseña */}
      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="block font-label text-[11px] uppercase tracking-[0.08em] text-secondary"
        >
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repite la nueva contraseña"
          {...register("confirmPassword")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {errors.confirmPassword && (
          <p className="text-error text-xs font-label">{errors.confirmPassword.message}</p>
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
              Guardando…
            </span>
          ) : (
            "Guardar contraseña"
          )}
        </button>
      </div>

    </form>
  );
}
