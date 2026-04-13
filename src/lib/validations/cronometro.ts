import { z } from "zod";

export const stopWorkSessionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Describe tus actividades con al menos 10 caracteres")
    .max(500, "Máximo 500 caracteres"),
});

export type StopWorkSessionInput = z.infer<typeof stopWorkSessionSchema>;
