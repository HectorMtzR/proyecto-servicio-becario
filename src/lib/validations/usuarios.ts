import { z } from "zod";

const emailInstitucional = z
  .string()
  .trim()
  .min(1, "Ingresa el correo")
  .email("Correo inválido")
  .refine((v) => v.toLowerCase().endsWith("@anahuac.mx"), {
    message: "Debe ser un correo @anahuac.mx",
  });

const passwordMin = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(100, "Máximo 100 caracteres");

const nombre = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(120, "Máximo 120 caracteres");

const roleSchema = z.enum(["ADMIN", "JEFE_SERVICIO", "ALUMNO"]);

const scholarshipTypeSchema = z
  .enum(["ACADEMICA", "EXCELENCIA", "DEPORTIVA", "CULTURAL", "COMERCIAL", "LIDERAZGO_SOCIAL", "SEP"])
  .default("ACADEMICA");

const studentProfileSchema = z.object({
  studentId:          z.string().trim().min(3, "Matrícula inválida").max(20),
  careerId:           z.string().min(1, "Selecciona una carrera"),
  semester:           z.coerce.number().int().min(1, "Mínimo 1").max(20, "Máximo 20"),
  enrollmentYear:     z.coerce.number().int().min(1990, "Año inválido").max(2100, "Año inválido"),
  scholarshipPercent: z.coerce
    .number()
    .int()
    .min(1, "Mínimo 1%")
    .max(100, "Máximo 100%"),
  scholarshipType:    scholarshipTypeSchema,
});

export const createUserSchema = z
  .object({
    name:     nombre,
    email:    emailInstitucional,
    password: passwordMin,
    role:     roleSchema,
    profile:  z.any().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role !== "ALUMNO") return;
    const result = studentProfileSchema.safeParse(val.profile);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          path:    ["profile", ...issue.path],
          message: issue.message,
        });
      }
    }
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const editUserFormSchema = z
  .object({
    name:    nombre,
    role:    roleSchema.optional(),
    profile: z.any().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role !== "ALUMNO") return;
    const result = studentProfileSchema.safeParse(val.profile);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          path:    ["profile", ...issue.path],
          message: issue.message,
        });
      }
    }
  });

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export const updateUserSchema = z.object({
  id:   z.string().min(1),
  name: nombre,
  profile: z
    .object({
      studentId:          z.string().trim().min(3).max(20),
      careerId:           z.string().min(1),
      semester:           z.coerce.number().int().min(1).max(20),
      enrollmentYear:     z.coerce.number().int().min(1990).max(2100),
      scholarshipPercent: z.coerce.number().int().min(1).max(100),
      scholarshipType:    scholarshipTypeSchema,
    })
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
