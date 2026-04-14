import { z } from "zod";

const nombre = z
  .string()
  .trim()
  .min(3, "Mínimo 3 caracteres")
  .max(80, "Máximo 80 caracteres");

export const createPeriodSchema = z
  .object({
    name:      nombre,
    startDate: z.string().min(1, "Selecciona una fecha de inicio"),
    endDate:   z.string().min(1, "Selecciona una fecha de fin"),
  })
  .refine(
    (d) => {
      const s = new Date(d.startDate);
      const e = new Date(d.endDate);
      return e.getTime() > s.getTime();
    },
    { message: "La fecha de fin debe ser posterior a la de inicio", path: ["endDate"] },
  );

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
