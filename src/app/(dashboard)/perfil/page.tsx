import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatMinutes } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = {
  ADMIN:          "Administrador",
  JEFE_SERVICIO:  "Jefe de Servicio",
  ALUMNO:         "Alumno",
};

const roleChipStyle: Record<string, string> = {
  ADMIN:          "bg-surface-container-high text-on-surface-variant",
  JEFE_SERVICIO:  "bg-tertiary-fixed text-on-tertiary-fixed",
  ALUMNO:         "bg-orange-100 text-orange-600",
};

const scholarshipTypeLabel: Record<string, string> = {
  ACADEMICA:        "Académica",
  EXCELENCIA:       "Excelencia",
  DEPORTIVA:        "Deportiva",
  CULTURAL:        "Cultural",
  COMERCIAL:        "Comercial",
  LIDERAZGO_SOCIAL: "Liderazgo Social",
  SEP:              "SEP",
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : parts[0].slice(0, 2);
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-container-low">
      <span className="font-headline text-3xl font-black uppercase tracking-tight text-primary">
        {initials.toUpperCase()}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
        {label}
      </p>
      <p className="mt-1 font-headline text-base font-bold text-on-surface">
        {value}
      </p>
    </div>
  );
}

function SubCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_4px_32px_rgba(25,28,29,0.06)]">
      <p className="mb-5 font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
        {title}
      </p>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;
  const role = session.user.role as string;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      isActive:  true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  const createdAtFormatted = format(user.createdAt, "d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  // ── Alumno data ────────────────────────────────────────────────────────────
  let studentProfile = null;
  let activeAssignment = null;

  if (role === "ALUMNO") {
    studentProfile = await db.studentProfile.findUnique({
      where:   { userId },
      include: { career: true },
    });

    activeAssignment = await db.assignment.findFirst({
      where: {
        studentId: userId,
        isActive:  true,
        period:    { isActive: true, isClosed: false },
      },
      include: {
        supervisor: { select: { name: true } },
        period:     { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Jefe data ──────────────────────────────────────────────────────────────
  let assignedStudentCount = 0;

  if (role === "JEFE_SERVICIO") {
    assignedStudentCount = await db.assignment.count({
      where: {
        supervisorId: userId,
        isActive:     true,
        period:       { isActive: true, isClosed: false },
      },
    });
  }

  return (
    <div className="px-8 pb-12 pt-8">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Header label */}
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
            Mi cuenta
          </p>
          <h1 className="mt-1 font-headline text-3xl font-black tracking-tight text-on-surface">
            Perfil
          </h1>
        </div>

        {/* Hero card */}
        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-[0_4px_32px_rgba(25,28,29,0.06)]">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <Initials name={user.name} />
            <div className="text-center sm:text-left">
              <h2 className="font-headline text-3xl font-black tracking-tight text-on-surface">
                {user.name}
              </h2>
              <p className="mt-1 text-sm text-secondary">{user.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${roleChipStyle[role]}`}
                >
                  {roleLabel[role]}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                    user.isActive
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of sub-cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

          {/* ── Datos de cuenta (todos los roles) ── */}
          <SubCard title="Datos de cuenta">
            <InfoRow label="Correo institucional" value={user.email} />
            <InfoRow label="Rol" value={roleLabel[role]} />
            <InfoRow label="Miembro desde" value={createdAtFormatted} />
            <InfoRow
              label="Estado"
              value={
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                    user.isActive
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>
              }
            />
          </SubCard>

          {/* ── Alumno: datos académicos ── */}
          {role === "ALUMNO" && studentProfile && (
            <SubCard title="Datos académicos">
              <InfoRow label="Matrícula" value={studentProfile.studentId} />
              <InfoRow label="Carrera" value={studentProfile.career.name} />
              <InfoRow label="Facultad" value={studentProfile.career.faculty} />
              <InfoRow label="Semestre" value={`${studentProfile.semester}°`} />
              <InfoRow label="Año de ingreso" value={String(studentProfile.enrollmentYear)} />
              <InfoRow
                label="Tipo de beca"
                value={scholarshipTypeLabel[studentProfile.scholarshipType] ?? studentProfile.scholarshipType}
              />
              <InfoRow label="Porcentaje de beca" value={`${studentProfile.scholarshipPercent}%`} />
            </SubCard>
          )}

          {/* ── Alumno: asignación activa ── */}
          {role === "ALUMNO" && activeAssignment && (
            <SubCard title="Asignación actual">
              <InfoRow label="Jefe asignado" value={activeAssignment.supervisor.name} />
              <InfoRow label="Departamento" value={activeAssignment.department} />
              <InfoRow label="Período" value={activeAssignment.period.name} />
              <InfoRow label="Meta de horas" value={`${activeAssignment.targetHours}h`} />
              <InfoRow
                label="Horas acumuladas"
                value={formatMinutes(activeAssignment.accumulatedMinutes)}
              />
            </SubCard>
          )}

          {role === "ALUMNO" && !activeAssignment && (
            <SubCard title="Asignación actual">
              <p className="text-sm text-secondary">
                No tienes una asignación activa en este período.
              </p>
            </SubCard>
          )}

          {/* ── Jefe: resumen de alumnos ── */}
          {role === "JEFE_SERVICIO" && (
            <SubCard title="Período activo">
              <InfoRow
                label="Alumnos bajo supervisión"
                value={String(assignedStudentCount)}
              />
              <p className="text-xs text-secondary">
                Alumnos asignados en el período activo actualmente.
              </p>
            </SubCard>
          )}

          {/* ── Admin: nota de cuenta ── */}
          {role === "ADMIN" && (
            <SubCard title="Cuenta administrativa">
              <p className="text-sm text-secondary">
                Esta cuenta tiene acceso completo al sistema. Las acciones
                realizadas quedan registradas para auditoría.
              </p>
            </SubCard>
          )}
        </div>

        {/* Enlace discreto a cambiar contraseña */}
        <div className="text-center">
          <Link
            href="/cambiar-password"
            className="text-xs text-secondary underline-offset-4 hover:text-primary hover:underline"
          >
            Cambiar contraseña
          </Link>
        </div>

      </div>
    </div>
  );
}
