import { z } from "zod";

const departamento = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(120, "Máximo 120 caracteres");

export const createAssignmentSchema = z.object({
  studentId:    z.string().min(1, "Selecciona un alumno"),
  supervisorId: z.string().min(1, "Selecciona un jefe"),
  department:   departamento,
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = z.object({
  id:           z.string().min(1),
  supervisorId: z.string().min(1, "Selecciona un jefe"),
  department:   departamento,
});

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
