"use server";

import { AuthError } from "next-auth";
import { signIn, signOut, auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

/**
 * Inicia sesión con email y contraseña.
 * En éxito lanza NEXT_REDIRECT a "/"; en error retorna { success: false, error }.
 */
export async function loginAction(
  email: string,
  password: string,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await signIn("credentials", {
      email:      parsed.data.email,
      password:   parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Correo o contraseña incorrectos" };
    }
    // Re-lanzar para que Next.js maneje el NEXT_REDIRECT
    throw error;
  }

  // Inalcanzable (signIn siempre redirige o lanza)
  return { success: true };
}

/**
 * Cierra la sesión actual.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

/**
 * Cambia la contraseña del usuario autenticado.
 * Si mustChangePassword === true en DB, no requiere contraseña actual.
 * Tras el cambio exitoso actualiza mustChangePassword = false y refresca la sesión.
 */
export async function cambiarPasswordAction(input: {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    // Validaciones básicas (Zod ya las aplica en cliente, pero las repetimos en servidor)
    if (input.newPassword.length < 8) {
      return { success: false, error: "La contraseña debe tener al menos 8 caracteres" };
    }
    if (input.newPassword !== input.confirmPassword) {
      return { success: false, error: "Las contraseñas no coinciden" };
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Si NO es primer login, verificar contraseña actual
    if (!user.mustChangePassword) {
      if (!input.currentPassword) {
        return { success: false, error: "Ingresa tu contraseña actual" };
      }
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) {
        return { success: false, error: "Contraseña actual incorrecta" };
      }
    }

    // Hashear nueva contraseña y actualizar en DB
    const newHash = await bcrypt.hash(input.newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data:  { passwordHash: newHash, mustChangePassword: false },
    });

    return { success: true };
  } catch (error) {
    // Re-lanzar NEXT_REDIRECT para que Next.js maneje la navegación
    if (error instanceof Error && "digest" in error) throw error;
    console.error("[cambiarPasswordAction]", error);
    return { success: false, error: "Error al cambiar la contraseña. Intenta de nuevo." };
  }
}
