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

export const removeAssignmentSchema = z
  .object({
    assignmentId:    z.string().min(1, "Asignación inválida"),
    reason:          z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres")
      .max(500, "Máximo 500 caracteres"),
    newSupervisorId: z.string().optional(),
    newDepartment:   z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newSupervisorId && data.newSupervisorId.length > 0) {
        return !!data.newDepartment && data.newDepartment.trim().length >= 2;
      }
      return true;
    },
    {
      message: "El departamento es obligatorio al reasignar",
      path:    ["newDepartment"],
    },
  );

export type RemoveAssignmentInput = z.infer<typeof removeAssignmentSchema>;
