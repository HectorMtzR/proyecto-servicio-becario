"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createCareerSchema,
  updateCareerSchema,
  type CreateCareerInput,
  type UpdateCareerInput,
} from "@/lib/validations/carreras";
import type { ActionResult } from "@/types";

export interface AdminCareerRow {
  id:           string;
  name:         string;
  faculty:      string;
  studentCount: number;
}

async function requireAdmin(): Promise<{ error: string } | { ok: true }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  if (session.user.role !== "ADMIN") return { error: "Solo el administrador puede gestionar carreras" };
  return { ok: true };
}

export async function listCareersAdmin(): Promise<AdminCareerRow[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];

  const careers = await db.career.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { studentProfiles: true } } },
  });

  return careers.map((c) => ({
    id:           c.id,
    name:         c.name,
    faculty:      c.faculty,
    studentCount: c._count.studentProfiles,
  }));
}

export async function createCareerAction(
  input: CreateCareerInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const parsed = createCareerSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;

    const existing = await db.career.findUnique({ where: { name: data.name } });
    if (existing) return { success: false, error: "Ya existe una carrera con ese nombre" };

    const career = await db.career.create({
      data: { name: data.name, faculty: data.faculty },
    });

    revalidatePath("/admin/carreras");
    return { success: true, data: { id: career.id } };
  } catch (error) {
    console.error("[createCareerAction]", error);
    return { success: false, error: "No se pudo crear la carrera" };
  }
}

export async function updateCareerAction(
  input: UpdateCareerInput,
): Promise<ActionResult> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const parsed = updateCareerSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;

    const career = await db.career.findUnique({ where: { id: data.id } });
    if (!career) return { success: false, error: "Carrera no encontrada" };

    if (data.name !== career.name) {
      const collision = await db.career.findUnique({ where: { name: data.name } });
      if (collision) return { success: false, error: "Ya existe una carrera con ese nombre" };
    }

    await db.career.update({
      where: { id: data.id },
      data:  { name: data.name, faculty: data.faculty },
    });

    revalidatePath("/admin/carreras");
    return { success: true };
  } catch (error) {
    console.error("[updateCareerAction]", error);
    return { success: false, error: "No se pudo actualizar la carrera" };
  }
}

export async function deleteCareerAction(id: string): Promise<ActionResult> {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return { success: false, error: guard.error };

    const career = await db.career.findUnique({
      where:   { id },
      include: { _count: { select: { studentProfiles: true } } },
    });
    if (!career) return { success: false, error: "Carrera no encontrada" };

    if (career._count.studentProfiles > 0) {
      return {
        success: false,
        error: `No se puede eliminar: ${career._count.studentProfiles} alumno(s) asociado(s) a esta carrera.`,
      };
    }

    await db.career.delete({ where: { id } });

    revalidatePath("/admin/carreras");
    return { success: true };
  } catch (error) {
    console.error("[deleteCareerAction]", error);
    return { success: false, error: "No se pudo eliminar la carrera" };
  }
}
