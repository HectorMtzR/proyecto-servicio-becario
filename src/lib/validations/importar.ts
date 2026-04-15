import { z } from "zod";

const emailInstitucional = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Correo vacío")
  .email("Correo inválido")
  .refine((v) => v.endsWith("@anahuac.mx"), {
    message: "Debe ser un correo @anahuac.mx",
  });

const nombre = z
  .string()
  .trim()
  .min(2, "Nombre muy corto")
  .max(120, "Nombre muy largo");

const intCoerce = (min: number, max: number, msg: string) =>
  z.coerce.number({ error: msg }).int(msg).min(min, msg).max(max, msg);

export const alumnoCsvRowSchema = z.object({
  name:               nombre,
  email:              emailInstitucional,
  studentId:          z.string().trim().min(3, "Matrícula muy corta").max(20, "Matrícula muy larga"),
  careerName:         z.string().trim().min(1, "Carrera vacía"),
  semester:           intCoerce(1, 20, "Semestre debe estar entre 1 y 20"),
  enrollmentYear:     intCoerce(1990, 2100, "Año de ingreso inválido"),
  scholarshipPercent: intCoerce(1, 100, "% de beca debe estar entre 1 y 100"),
});
export type AlumnoCsvRow = z.infer<typeof alumnoCsvRowSchema>;

export const jefeCsvRowSchema = z.object({
  name:  nombre,
  email: emailInstitucional,
});
export type JefeCsvRow = z.infer<typeof jefeCsvRowSchema>;

export const asignacionCsvRowSchema = z.object({
  studentEmail:    emailInstitucional,
  supervisorEmail: emailInstitucional,
  periodName:      z.string().trim().min(1, "Período vacío"),
  department:      z.string().trim().min(2, "Departamento muy corto").max(120, "Departamento muy largo"),
});
export type AsignacionCsvRow = z.infer<typeof asignacionCsvRowSchema>;

export const importTypeSchema = z.enum(["alumnos", "jefes", "asignaciones"]);
export type ImportType = z.infer<typeof importTypeSchema>;

export const MAX_CSV_ROWS = 500;
export const DEFAULT_TEMP_PASSWORD = "Temporal123!";
