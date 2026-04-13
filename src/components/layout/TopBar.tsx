"use client";

import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

const titleByPath: { match: (p: string) => boolean; title: string }[] = [
  { match: (p) => p === "/" || p.endsWith("/inicio"),            title: "Inicio" },
  { match: (p) => p.startsWith("/alumno/jornadas"),              title: "Mis Jornadas" },
  { match: (p) => p.startsWith("/jefe/validaciones"),            title: "Validaciones" },
  { match: (p) => p.startsWith("/jefe/alumnos"),                 title: "Mis Alumnos" },
  { match: (p) => p.startsWith("/admin/usuarios"),               title: "Usuarios" },
  { match: (p) => p.startsWith("/admin/asignaciones"),           title: "Asignaciones" },
  { match: (p) => p.startsWith("/admin/carreras"),               title: "Carreras" },
  { match: (p) => p.startsWith("/admin/periodos"),               title: "Períodos" },
  { match: (p) => p.startsWith("/admin/reportes"),               title: "Reportes" },
  { match: (p) => p.startsWith("/perfil"),                       title: "Perfil" },
  { match: (p) => p.startsWith("/configuracion"),                title: "Configuración" },
  { match: (p) => p.startsWith("/ayuda"),                        title: "Ayuda" },
];

const roleLabel: Record<Role, string> = {
  ADMIN:         "Administrador",
  JEFE_SERVICIO: "Jefe de Servicio",
  ALUMNO:        "Alumno Becario",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function TopBar({ name, role }: { name: string; role: Role }) {
  const pathname = usePathname();
  const entry = titleByPath.find((e) => e.match(pathname));
  const title = entry?.title ?? "Portal";

  return (
    <header className="fixed right-0 top-0 z-40 flex h-16 w-[calc(100%-16rem)] items-center justify-between bg-white/80 px-8 backdrop-blur-xl">
      <h1 className="font-headline text-lg font-black tracking-tight text-on-surface">
        {title}
      </h1>

      <div className="flex items-center gap-3 border-l border-zinc-100 pl-6">
        <div className="text-right">
          <p className="font-body text-sm font-bold leading-none text-on-surface">
            {name}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-tighter text-secondary">
            {roleLabel[role]}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 font-headline text-sm font-bold text-white shadow-sm">
          {initials(name)}
        </div>
      </div>
    </header>
  );
}
