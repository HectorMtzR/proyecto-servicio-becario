import type { ImportType } from "@/lib/validations/importar";

interface ColumnDef {
  name:        string;
  description: string;
  example:     string;
}

const COLUMNS: Record<ImportType, ColumnDef[]> = {
  alumnos: [
    { name: "name",               description: "Nombre completo",                         example: "Juan Pérez Martínez" },
    { name: "email",               description: "Correo institucional @anahuac.mx",        example: "juan.perez@anahuac.mx" },
    { name: "studentId",           description: "Matrícula universitaria (única)",          example: "00123456" },
    { name: "careerName",          description: "Nombre EXACTO de una carrera existente",  example: "Ingeniería en Sistemas" },
    { name: "semester",            description: "Semestre (1 a 20)",                        example: "5" },
    { name: "enrollmentYear",      description: "Año de ingreso (1990 a 2100)",            example: "2023" },
    { name: "scholarshipPercent",  description: "Porcentaje de beca (1 a 100)",             example: "50" },
  ],
  jefes: [
    { name: "name",  description: "Nombre completo",                 example: "María López García" },
    { name: "email", description: "Correo institucional @anahuac.mx", example: "maria.lopez@anahuac.mx" },
  ],
  asignaciones: [
    { name: "studentEmail",    description: "Email del alumno (debe existir, activo)",    example: "juan.perez@anahuac.mx" },
    { name: "supervisorEmail", description: "Email del jefe (debe existir, activo)",       example: "maria.lopez@anahuac.mx" },
    { name: "periodName",      description: "Nombre EXACTO de un período abierto",          example: "Agosto - Diciembre 2024" },
    { name: "department",      description: "Departamento donde trabaja",                    example: "Laboratorios TI" },
  ],
};

const TITLES: Record<ImportType, string> = {
  alumnos:      "Importación de Alumnos",
  jefes:        "Importación de Jefes de Servicio",
  asignaciones: "Importación de Asignaciones",
};

export default function InstruccionesImport({ type }: { type: ImportType }) {
  const cols = COLUMNS[type];

  return (
    <div className="rounded-xl bg-surface-container-low p-6">
      <div className="mb-4">
        <h3 className="font-headline text-lg font-bold tracking-tight text-on-surface">
          {TITLES[type]}
        </h3>
        <p className="mt-1 text-sm text-secondary">
          Sube un archivo <strong>.csv</strong> con las columnas exactas que se listan abajo. Puedes descargar la plantilla para asegurar el formato correcto.
        </p>
      </div>

      <div className="mb-4 overflow-hidden rounded-lg bg-surface-container-lowest">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container-high">
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">Columna</th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">Descripción</th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">Ejemplo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {cols.map((c) => (
              <tr key={c.name}>
                <td className="px-4 py-2 font-mono text-xs font-semibold text-on-surface">{c.name}</td>
                <td className="px-4 py-2 text-on-surface-variant">{c.description}</td>
                <td className="px-4 py-2 font-mono text-xs text-secondary">{c.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 text-xs text-secondary">
        <p>
          <strong className="text-on-surface">Consideraciones:</strong>
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Máximo <strong>500 filas</strong> por archivo. Tamaño máximo <strong>2 MB</strong>.</li>
          <li>Acepta separador <code className="rounded bg-surface-container px-1">,</code> o <code className="rounded bg-surface-container px-1">;</code> (detectado automáticamente).</li>
          <li>Codificación UTF-8. Si exportas desde Excel, usa &quot;CSV UTF-8&quot;.</li>
          <li>Los emails deben terminar en <code className="rounded bg-surface-container px-1">@anahuac.mx</code>.</li>
          {type !== "asignaciones" && (
            <li>La contraseña inicial asignada es <code className="rounded bg-surface-container px-1">Temporal123!</code> — el usuario deberá cambiarla en su primer acceso.</li>
          )}
          {type === "alumnos" && (
            <li>La carrera referenciada por <code className="rounded bg-surface-container px-1">careerName</code> debe existir previamente en el catálogo.</li>
          )}
          {type === "asignaciones" && (
            <>
              <li>Tanto el alumno como el jefe deben existir y estar activos antes de importar.</li>
              <li>No se puede asignar a un período cerrado.</li>
              <li>Las horas meta se asignan automáticamente según el % de beca del alumno.</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
