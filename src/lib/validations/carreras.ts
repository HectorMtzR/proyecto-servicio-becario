import { z } from "zod";

const nombre = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(120, "Máximo 120 caracteres");

const facultad = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(120, "Máximo 120 caracteres");

export const createCareerSchema = z.object({
  name:    nombre,
  faculty: facultad,
});

export type CreateCareerInput = z.infer<typeof createCareerSchema>;

export const updateCareerSchema = z.object({
  id:      z.string().min(1),
  name:    nombre,
  faculty: facultad,
});

export type UpdateCareerInput = z.infer<typeof updateCareerSchema>;
