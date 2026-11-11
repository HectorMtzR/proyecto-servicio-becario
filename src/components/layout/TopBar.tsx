"use client";

import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { useUIStore } from "@/stores/ui-store";

const titleByPath: { match: (p: string) => boolean; title: string }[] = [
  { match: (p) => p === "/" || p.endsWith("/inicio"),            title: "Inicio" },
  { match: (p) => p.startsWith("/alumno/jornadas"),              title: "Mis Jornadas" },
  { match: (p) => p.startsWith("/alumno/historial"),             title: "Historial" },
  { match: (p) => p.startsWith("/jefe/validaciones"),            title: "Validaciones" },
  { match: (p) => p.startsWith("/jefe/alumnos"),                 title: "Mis Alumnos" },
  { match: (p) => p.startsWith("/admin/usuarios"),               title: "Usuarios" },
  { match: (p) => p.startsWith("/admin/asignaciones"),           title: "Asignaciones" },
  { match: (p) => p.startsWith("/admin/carreras"),               title: "Carreras" },
  { match: (p) => p.startsWith("/admin/periodos"),               title: "Períodos" },
  { match: (p) => p.startsWith("/admin/reportes"),               title: "Reportes" },
  { match: (p) => p.startsWith("/admin/sin-avance"),             title: "Alumnos sin avance" },
  { match: (p) => p.startsWith("/admin/importar"),               title: "Importar CSV" },
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
  const pathname    = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const openSidebar = useUIStore((s) => s.openSidebar);
  const entry = titleByPath.find((e) => e.match(pathname));
  const title = entry?.title ?? "Portal";

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between gap-3 bg-white/80 px-4 backdrop-blur-xl sm:px-8 lg:left-64">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Abrir menú"
          aria-controls="app-sidebar"
          aria-expanded={sidebarOpen}
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-on-surface transition-colors hover:bg-surface-container-low lg:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="truncate font-headline text-lg font-black tracking-tight text-on-surface">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:border-l sm:border-zinc-100 sm:pl-6">
        <div className="hidden text-right sm:block">
          <p className="font-body text-sm font-bold leading-none text-on-surface">
            {name}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-tighter text-secondary">
            {roleLabel[role]}
          </p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 font-headline text-sm font-bold text-white shadow-sm"
          title={`${name} · ${roleLabel[role]}`}
        >
          {initials(name)}
        </div>
      </div>
    </header>
  );
}
