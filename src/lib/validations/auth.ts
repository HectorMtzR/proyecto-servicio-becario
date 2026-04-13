import { z } from "zod";

export const loginSchema = z.object({
  email:    z.string().email("Ingresa un correo válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const cambiarPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword:     z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const cambiarPasswordPrimerLoginSchema = z
  .object({
    newPassword:     z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginFormData                   = z.infer<typeof loginSchema>;
export type CambiarPasswordFormData         = z.infer<typeof cambiarPasswordSchema>;
export type CambiarPasswordPrimerLoginData  = z.infer<typeof cambiarPasswordPrimerLoginSchema>;
