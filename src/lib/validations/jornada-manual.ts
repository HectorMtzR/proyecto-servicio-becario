import { z } from "zod";

export const jornadaManualSchema = z
  .object({
    date:        z.string().min(1, "Selecciona una fecha"),
    startTime:   z.string().min(1, "Ingresa la hora de inicio"),
    endTime:     z.string().min(1, "Ingresa la hora de fin"),
    description: z
      .string()
      .trim()
      .min(10, "Describe tus actividades con al menos 10 caracteres")
      .max(500, "Máximo 500 caracteres"),
  })
  .refine(
    (d) => {
      const start = new Date(`${d.date}T${d.startTime}`);
      const end   = new Date(`${d.date}T${d.endTime}`);
      return end.getTime() > start.getTime();
    },
    { message: "La hora de fin debe ser posterior a la de inicio", path: ["endTime"] },
  )
  .refine(
    (d) => {
      const start = new Date(`${d.date}T${d.startTime}`);
      const end   = new Date(`${d.date}T${d.endTime}`);
      const mins  = (end.getTime() - start.getTime()) / 60000;
      return mins >= 30;
    },
    { message: "La jornada debe durar al menos 30 minutos", path: ["endTime"] },
  )
  .refine(
    (d) => {
      const start = new Date(`${d.date}T${d.startTime}`);
      return start.getTime() <= Date.now();
    },
    { message: "No puedes registrar jornadas en el futuro", path: ["date"] },
  );

export type JornadaManualInput = z.infer<typeof jornadaManualSchema>;
